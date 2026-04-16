
-- Create public avatars bucket (idempotent)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read access to avatar files
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Users can upload to their own folder: avatars/{user_id}/...
create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update files in their own folder
create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete files in their own folder
create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
