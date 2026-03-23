# Supabase Migration Setup Guide

This guide will help you complete the migration from Firebase to Supabase.

## Step 1: Install Dependencies

Run the following command to install the new dependencies:

```bash
npm install
```

This will install `@supabase/supabase-js` and remove the old Firebase dependency.

## Step 2: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in the project details:
   - **Name**: ProMarketplace (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 3: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (gear icon)
2. Go to **API** section
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the public API key)

## Step 4: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
GEMINI_API_KEY="your-gemini-api-key"
```

## Step 5: Set Up Database Schema

1. In your Supabase project dashboard, click on the **SQL Editor** icon
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- `users` table
- `items` table
- `offers` table
- Indexes for performance
- Row Level Security policies (currently open for all)
- Default test user

## Step 6: Set Up Storage Bucket

1. In your Supabase project dashboard, click on **Storage**
2. Click "Create a new bucket"
3. Enter bucket name: `item-images`
4. Make it **Public** (toggle the public option)
5. Click "Create bucket"

### Configure Storage Policies

After creating the bucket, set up policies:

1. Click on the `item-images` bucket
2. Go to **Policies** tab
3. Click "New Policy" and select "For full customization"
4. Create a policy for uploads:
   - **Policy name**: "Allow public uploads"
   - **Allowed operation**: INSERT
   - **Policy definition**: `true`
5. Create a policy for reads:
   - **Policy name**: "Allow public reads"
   - **Allowed operation**: SELECT
   - **Policy definition**: `true`

Or use this SQL in the SQL Editor:

```sql
-- Storage policies for item-images bucket
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'item-images');

CREATE POLICY "Allow public reads" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'item-images');
```

## Step 7: Run the Application

```bash
npm run dev
```

The application should now be running with Supabase!

## Verification Checklist

- [ ] Dependencies installed (`@supabase/supabase-js` in package.json)
- [ ] Supabase project created
- [ ] Environment variables configured in `.env`
- [ ] Database schema executed successfully
- [ ] Storage bucket `item-images` created and set to public
- [ ] Storage policies configured
- [ ] Application runs without errors

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env` file exists in the project root
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly
- Restart the dev server after changing `.env`

### Database connection errors
- Verify your Supabase project is active
- Check that the schema was executed successfully
- Ensure RLS policies are in place

### Image upload errors
- Verify the `item-images` bucket exists
- Check that the bucket is set to **Public**
- Ensure storage policies allow uploads and reads

### Real-time updates not working
- Supabase real-time is enabled by default for new projects
- Check the browser console for any subscription errors

## What Changed

### Removed
- `firebase` package
- `firebase-applet-config.json`
- `firebase-blueprint.json`
- `firestore.rules`
- `src/firebase.ts`

### Added
- `@supabase/supabase-js` package
- `src/supabase.ts` (Supabase client configuration)
- `supabase-schema.sql` (Database schema)
- Image upload functions for Supabase Storage

### Modified
- `src/App.tsx` - All database operations now use Supabase
- `.env.example` - Added Supabase configuration
- `package.json` - Updated dependencies

## Next Steps (Future Enhancements)

1. **Authentication**: Implement Supabase Auth with email/password or OAuth
2. **User Profiles**: Link authenticated users to user profiles
3. **Advanced RLS**: Restrict operations based on authenticated user
4. **Real-time Subscriptions**: Optimize real-time updates
5. **Image Optimization**: Add image resizing and optimization on upload

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in your repository
