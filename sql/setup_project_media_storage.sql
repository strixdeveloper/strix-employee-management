-- Create storage bucket for project media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-media',
  'project-media',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'application/zip', 'application/x-rar-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for project-media bucket
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload project media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-media');

-- Allow authenticated users to read files
CREATE POLICY "Allow authenticated users to read project media"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'project-media');

-- Allow authenticated users to update files
CREATE POLICY "Allow authenticated users to update project media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-media')
WITH CHECK (bucket_id = 'project-media');

-- Allow authenticated users to delete files
CREATE POLICY "Allow authenticated users to delete project media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-media');

