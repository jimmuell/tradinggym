
-- Server-authoritative quiz grading

-- Grading RPC: client sends only answers; server grades using quizzes.questions
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_quiz_id uuid, _answers jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  qquestions jsonb;
  threshold int;
  total int;
  score int := 0;
  passed_bool boolean;
  responses jsonb := '[]'::jsonb;
  ans_map jsonb;
  qitem jsonb;
  qid text;
  selected int;
  correct int;
  is_correct boolean;
  attempt_id uuid;
  sanitized_answers jsonb := '[]'::jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT questions, pass_threshold
    INTO qquestions, threshold
  FROM public.quizzes
  WHERE id = _quiz_id;

  IF qquestions IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;

  -- Build map question_id -> selected_index from client input.
  -- Any client-supplied 'correct', 'score', 'passed' fields are ignored.
  SELECT jsonb_object_agg(a->>'question_id', (a->>'selected_index')::int)
    INTO ans_map
  FROM jsonb_array_elements(COALESCE(_answers, '[]'::jsonb)) a
  WHERE a ? 'question_id' AND a ? 'selected_index';

  total := jsonb_array_length(qquestions);

  FOR qitem IN SELECT * FROM jsonb_array_elements(qquestions) LOOP
    qid := qitem->>'id';
    correct := (qitem->>'correct_index')::int;
    BEGIN
      selected := NULLIF(ans_map->>qid, '')::int;
    EXCEPTION WHEN OTHERS THEN
      selected := NULL;
    END;
    is_correct := selected IS NOT NULL AND selected = correct;
    IF is_correct THEN
      score := score + 1;
    END IF;

    sanitized_answers := sanitized_answers || jsonb_build_array(jsonb_build_object(
      'question_id', qid,
      'selected_index', selected,
      'correct', is_correct
    ));

    responses := responses || jsonb_build_array(jsonb_build_object(
      'question_id', qid,
      'question_text', qitem->>'question',
      'selected_answer', selected,
      'correct_answer', correct,
      'is_correct', is_correct,
      'options', COALESCE(qitem->'options', '[]'::jsonb),
      'explanation', COALESCE(qitem->>'explanation', ''),
      'source_lesson_id', qitem->'source_lesson_id',
      'source_lesson_title', qitem->'source_lesson_title',
      'source_slide_index', COALESCE((qitem->>'source_slide_index')::int, 0)
    ));
  END LOOP;

  passed_bool := total > 0 AND (score::numeric * 100 / total) >= threshold;

  INSERT INTO public.quiz_attempts(
    user_id, quiz_id, score, total_questions, passed, answers, responses
  )
  VALUES (
    uid, _quiz_id, score, total, passed_bool, sanitized_answers, responses
  )
  RETURNING id INTO attempt_id;

  RETURN jsonb_build_object(
    'attempt_id', attempt_id,
    'score', score,
    'total_questions', total,
    'passed', passed_bool,
    'pass_threshold', threshold,
    'answers', sanitized_answers,
    'responses', responses
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- Lock down direct client writes: drop the client INSERT policy.
-- Reads (SELECT own attempts) remain. The SECURITY DEFINER RPC is now the only writer.
DROP POLICY IF EXISTS quiz_attempts_insert_own ON public.quiz_attempts;

-- Also revoke direct INSERT/UPDATE/DELETE table privileges from authenticated
-- as defense-in-depth (RLS would already block without a policy).
REVOKE INSERT, UPDATE, DELETE ON public.quiz_attempts FROM authenticated;
GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;

-- Consistency trigger: passed must match score/threshold, even for SECURITY DEFINER writes.
CREATE OR REPLACE FUNCTION public.enforce_quiz_attempt_consistency()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  th int;
  actual_pass boolean;
BEGIN
  SELECT pass_threshold INTO th FROM public.quizzes WHERE id = NEW.quiz_id;
  IF th IS NULL THEN
    RAISE EXCEPTION 'Invalid quiz_id';
  END IF;
  IF NEW.score < 0 OR NEW.total_questions < 0 OR NEW.score > NEW.total_questions THEN
    RAISE EXCEPTION 'invalid score/total_questions';
  END IF;
  IF NEW.total_questions = 0 THEN
    actual_pass := false;
  ELSE
    actual_pass := (NEW.score::numeric * 100 / NEW.total_questions) >= th;
  END IF;
  IF NEW.passed IS DISTINCT FROM actual_pass THEN
    RAISE EXCEPTION 'quiz_attempt passed flag inconsistent with score and pass_threshold';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quiz_attempt_consistency ON public.quiz_attempts;
CREATE TRIGGER trg_quiz_attempt_consistency
BEFORE INSERT OR UPDATE ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.enforce_quiz_attempt_consistency();

-- Cleanup: remove the planted test row and any other inconsistent "passed" rows.
DELETE FROM public.quiz_attempts qa
USING public.quizzes q
WHERE qa.quiz_id = q.id
  AND qa.passed = true
  AND (qa.total_questions = 0 OR (qa.score::numeric * 100 / qa.total_questions) < q.pass_threshold);
