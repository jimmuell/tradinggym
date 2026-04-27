UPDATE profiles SET plan_state = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@gmail.com');