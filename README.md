# ☀️ Sunny Video - Social Video Sharing App

A Next.js social video sharing web application that allows users to record, enhance, and share ephemeral video messages with friends.

## Features

- **User Authentication**: Email-based registration and login with Supabase
- **Video Recording**: Record short video clips (up to 10 seconds)
- **Live Video Enhancement**: Apply filters and embed emojis directly into videos
- **Video Messaging**: Send enhanced videos to specific contacts
- **Ephemeral Storage**: Videos automatically expire after 24 hours
- **Recipient Control**: Recipients can view and save videos to their device
- **Video-Only Communication**: Exclusively video-based messaging platform

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Storage)
- **Video Processing**: Web APIs (MediaRecorder, getUserMedia)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd sunny_project
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. **IMPORTANT**: Go to Authentication > Settings and disable "Enable email confirmations" for development
3. Go to Settings > API to get your project URL and anon key
4. Copy `.env.local` and update with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL commands to create tables and policies

### 4. Configure Storage

1. In Supabase dashboard, go to Storage
2. The `videos` bucket should be created automatically by the schema
3. Ensure the bucket is set to public access for video playback

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx      # Login page
│   │   └── register/page.tsx   # Registration page
│   ├── contacts/page.tsx       # Contact management
│   ├── dashboard/page.tsx      # Main dashboard
│   ├── messages/page.tsx       # View received videos
│   ├── profile/page.tsx        # User profile settings
│   ├── record/page.tsx         # Video recording interface
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
└── lib/
    └── supabase.ts             # Supabase client configuration
```

## Key Features Explained

### Video Recording
- Uses `navigator.mediaDevices.getUserMedia()` to access camera and microphone
- Implements `MediaRecorder` API for video capture
- Enforces 10-second maximum recording time
- Real-time preview with mirror effect

### Video Enhancement
- **Filters**: Sepia, Grayscale, Blur, Brightness, Contrast, Hue Rotate, Saturate
- **Emoji Overlay**: Add animated emojis that appear on the video
- **Live Preview**: See effects in real-time during recording

### Ephemeral Storage
- Videos are stored in Supabase Storage with public URLs
- Database records include expiration timestamps (24 hours)
- Automatic cleanup of expired video records
- Recipients can download videos before expiration

### Security & Privacy
- Row Level Security (RLS) policies ensure users only access their own data
- Videos are only accessible to sender and recipient
- Automatic user profile creation on registration
- Secure authentication flow with Supabase Auth

## Database Schema

### Tables
- `users`: User profiles linked to Supabase Auth
- `contacts`: Friend/contact relationships
- `video_messages`: Video message metadata with expiration

### Key Features
- Foreign key relationships ensure data integrity
- RLS policies protect user privacy
- Indexes optimize query performance
- Triggers handle automatic user profile creation

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 14.3+)
- **Mobile**: Responsive design works on all modern mobile browsers

## Permissions Required

- **Camera**: Required for video recording
- **Microphone**: Required for audio in videos
- **Storage**: Used for temporary video processing

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment

1. Build the application: `npm run build`
2. Deploy to your preferred platform (Vercel, Netlify, etc.)
3. Set environment variables in your deployment platform
4. Ensure Supabase project is properly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the GitHub issues
2. Review Supabase documentation
3. Check Next.js documentation

---

Built with ❤️ using Next.js and Supabase