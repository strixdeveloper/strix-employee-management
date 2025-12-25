# Vercel PDF Generation Fix

## Issue
When deploying to Vercel, PDF generation fails with the error:
```
Error generating salary PDF: Failed to launch the browser process: Code: 127
stderr: /tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

## Solution

### Step 1: Set Environment Variable in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Key:** `AWS_LAMBDA_JS_RUNTIME`
   - **Value:** `nodejs22.x`
   - **Environment:** Production, Preview, and Development (select all)
4. Save the changes

### Step 2: Redeploy

After adding the environment variable, redeploy your application:
- Either push a new commit to trigger a redeploy
- Or manually trigger a redeploy from the Vercel dashboard

## What This Fixes

The `AWS_LAMBDA_JS_RUNTIME` environment variable ensures that Vercel uses a Node.js runtime that includes the necessary system libraries (like `libnss3.so`) required by Chromium for PDF generation.

## Additional Notes

- The code has been updated to use proper Chromium configuration for serverless environments
- The `vercel.json` file has been created to configure function timeouts (60 seconds for PDF generation)
- The `package.json` has been updated to specify Node.js engine requirements

## Testing

After deployment, test PDF generation by:
1. Creating a new salary record
2. Verifying that the PDF is generated and uploaded successfully
3. Checking that the PDF URL is returned in the response

