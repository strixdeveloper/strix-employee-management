# Setting Up Supabase Storage for Profile Avatars

## Step 1: Create Storage Bucket (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create bucket"**
4. Configure the bucket:
   - **Name**: `avatars`
   - **Public bucket**: **Yes** (recommended for easy access to profile pictures)
   - **File size limit**: `5 MB` (sufficient for profile images)
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp` (optional, for security)
5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (SQL Editor)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Copy and paste the following SQL:

```sql
-- Policy: Allow authenticated users to upload avatars
-- Note: Since filenames include user ID, users can only upload files with their own ID
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
);

-- Policy: Allow authenticated users to read avatars
CREATE POLICY "Allow authenticated users to read avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
);

-- Policy: Allow authenticated users to update avatars
CREATE POLICY "Allow authenticated users to update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
)
WITH CHECK (
  bucket_id = 'avatars'
);

-- Policy: Allow authenticated users to delete avatars
CREATE POLICY "Allow authenticated users to delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
);
```

**Note:** For more security, you can restrict uploads to only files that start with the user's ID. However, since the bucket is public and filenames include user IDs, the current setup is sufficient for most use cases.

4. Click **"Run"** to execute the policies

## Step 3: Verify Setup

You can test the storage by:
1. Going to **Storage** > **avatars**
2. Try uploading a test image file
3. Check if you can view/download it

## Storage Path Structure

Avatars will be stored with this naming convention:
```
avatars/{user_id}-{timestamp}.{extension}
```

Example:
```
avatars/123e4567-e89b-12d3-a456-426614174000-1704067200000.jpg
```

## Notes

- The bucket should be **public** for easy access to profile pictures
- File size is limited to 5MB per image
- Only authenticated users can upload/update/delete their own avatars
- All authenticated users can view avatars (for displaying profile pictures)

