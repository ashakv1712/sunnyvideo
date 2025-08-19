# 🚀 Quick Setup Guide for Sunny Video

If you're seeing errors about "Invalid URL" or "Account created but profile setup failed", follow these steps:

## 1. Set up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose your organization and enter project details:
   - **Name**: sunny-video (or any name you prefer)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your location
4. Wait for the project to be created (2-3 minutes)

## 2. Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Disable Email Confirmation (For Development)

1. In your Supabase dashboard, go to **Authentication** → **Settings**
2. Scroll down to **Email Auth**
3. **Turn OFF** "Enable email confirmations"
4. Click **Save**

This allows users to login immediately without email verification (perfect for development).

## 4. Configure Environment Variables

1. Open the `.env.local` file in your project
2. Replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 5. Set up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the SQL

This will create:
- `users` table for user profiles
- `contacts` table for friend relationships
- `video_messages` table for video metadata
- `videos` storage bucket for video files
- All necessary security policies
- Automatic triggers for user profile creation

## 5. Test the Application

1. Make sure your development server is running: `npm run dev`
2. Go to [http://localhost:3000](http://localhost:3000)
3. Click "Create Account" and register a new user
4. You should now be able to log in and access all features!

## 🔧 Troubleshooting

### "Email not confirmed" Error
- **Most Common Issue**: Go to Supabase Dashboard → Authentication → Settings
- Turn OFF "Enable email confirmations" under Email Auth section
- Click Save and try registering again
- For production, you'd want to implement proper email confirmation flow

### "Invalid URL" Error
- Check that your `NEXT_PUBLIC_SUPABASE_URL` is correct
- Make sure there are no extra spaces or quotes
- Restart your development server after changing `.env.local`

### "Profile setup failed" Error
- Make sure you ran the SQL schema from `supabase-schema.sql`
- Check that the `users` table exists in your Supabase dashboard
- The updated code now handles this gracefully and will retry profile creation

### "Permission denied" Errors
- Ensure you ran the complete SQL schema including the RLS policies
- Check that the storage bucket `videos` exists and is set to public

### Videos Not Playing
- Make sure the `videos` storage bucket is created
- Verify the bucket is set to public access
- Check browser permissions for camera/microphone access

## 🎥 Features You Can Test

Once set up, you can:
- ✅ Register and login with email
- ✅ Record 10-second videos with camera
- ✅ Apply filters and emoji overlays
- ✅ Add friends by username search
- ✅ Send videos to contacts
- ✅ View received videos
- ✅ Download videos before they expire
- ✅ Manage your profile and contacts

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Make sure your Supabase project is active and not paused
4. Try creating a fresh Supabase project if problems persist

The application is now much more robust and will handle missing user profiles automatically!