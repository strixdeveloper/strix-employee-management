# Setting Up Supabase Storage for Salary Slips

## Step 1: Create Storage Bucket (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"** or **"Create bucket"**
4. Configure the bucket:
   - **Name**: `salary-slips`
   - **Public bucket**: Choose based on your needs:
     - **Yes** - If you want direct URL access (easier for downloads)
     - **No** - If you want more control (requires signed URLs)
   - **File size limit**: `10 MB` (PDFs are usually small)
   - **Allowed MIME types**: `application/pdf` (optional, for security)

5. Click **"Create bucket"**

## Step 2: Set Up Storage Policies (SQL Editor)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Copy and paste the SQL from `sql/setup_salary_slips_storage.sql`
4. Click **"Run"** to execute the policies

## Step 3: Verify Setup

You can test the storage by:

1. Going to **Storage** > **salary-slips**
2. Try uploading a test PDF file
3. Check if you can view/download it

## Alternative: Manual Policy Setup (Dashboard)

If you prefer using the Dashboard UI:

1. Go to **Storage** > **salary-slips** > **Policies**
2. Click **"New Policy"**
3. For each policy:

   **Upload Policy:**
   - Policy name: "Allow authenticated users to upload salary slips"
   - Allowed operation: `INSERT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'salary-slips'`

   **Read Policy:**
   - Policy name: "Allow authenticated users to read salary slips"
   - Allowed operation: `SELECT`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'salary-slips'`

   **Update Policy (optional):**
   - Policy name: "Allow authenticated users to update salary slips"
   - Allowed operation: `UPDATE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'salary-slips'`

   **Delete Policy (optional):**
   - Policy name: "Allow authenticated users to delete salary slips"
   - Allowed operation: `DELETE`
   - Target roles: `authenticated`
   - Policy definition: `bucket_id = 'salary-slips'`

## Storage Path Structure

PDFs will be stored with this naming convention:
```
salary-slips/{employee_id}_{year}_{month}.pdf
```

Example:
```
salary-slips/SD001_2025_5.pdf
```

## Environment Variables

Make sure you have these in your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## Usage in Code

You'll use the Supabase Storage client to:
- Upload PDFs: `supabase.storage.from('salary-slips').upload()`
- Download PDFs: `supabase.storage.from('salary-slips').download()`
- Get public URLs: `supabase.storage.from('salary-slips').getPublicUrl()`

