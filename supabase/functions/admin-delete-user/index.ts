import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId: string | undefined = body.user_id;
    const targetEmail: string | undefined = body.email;

    if (!targetUserId && !targetEmail) {
      return new Response(JSON.stringify({ error: 'Provide user_id or email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let userId = targetUserId;
    if (!userId && targetEmail) {
      // Look up by email via admin listUsers (paginate)
      let page = 1;
      while (page < 50 && !userId) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) break;
        const found = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
        if (found) userId = found.id;
        if (data.users.length < 200) break;
        page++;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (userId === userData.user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account from admin tool' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Best-effort cleanup of public-schema rows that reference this user
    const cleanupTables: Array<{ table: string; col: string }> = [
      { table: 'profiles', col: 'user_id' },
      { table: 'guru_profiles', col: 'user_id' },
      { table: 'guru_applications', col: 'user_id' },
      { table: 'trades', col: 'user_id' },
      { table: 'strategies', col: 'user_id' },
      { table: 'strategy_extractions', col: 'user_id' },
      { table: 'checklist_templates', col: 'user_id' },
      { table: 'checklist_sessions', col: 'user_id' },
      { table: 'backtest_runs', col: 'user_id' },
      { table: 'quiz_attempts', col: 'user_id' },
      { table: 'lessons', col: 'author_id' },
      { table: 'quizzes', col: 'author_id' },
      { table: 'investor_notes', col: 'author_id' },
      { table: 'class_enrollments', col: 'student_id' },
      { table: 'live_session_attendance', col: 'student_id' },
    ];

    const cleanupErrors: string[] = [];
    for (const { table, col } of cleanupTables) {
      const { error } = await admin.from(table).delete().eq(col, userId);
      if (error) cleanupErrors.push(`${table}: ${error.message}`);
    }

    // Finally delete from auth
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      return new Response(
        JSON.stringify({ error: deleteErr.message, cleanup_errors: cleanupErrors }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, user_id: userId, cleanup_errors: cleanupErrors }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
