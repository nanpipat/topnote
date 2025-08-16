# topnote - Your Personal Notion-like Note App

A beautiful, modern note-taking application built with Next.js, TypeScript, and Supabase. Create, edit, and share your notes with markdown support, just like Notion!

## ✨ Features

- **🔐 Authentication** - Secure login with Supabase Auth (Google, GitHub, Email)
- **📝 Markdown Editor** - Rich text editing with live preview
- **🎨 Notion-like UI** - Clean, modern interface inspired by Notion
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **🔗 Share Notes** - Generate shareable links for read-only access
- **⚡ Real-time Sync** - Auto-save and sync across devices
- **🎯 Fast Search** - Quickly find your notes
- **🗂️ Organization** - Sidebar with all your notes

## 🚀 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time)
- **Markdown**: react-markdown, remark-gfm, rehype-highlight
- **Icons**: Lucide React
- **Styling**: Inter font, custom CSS for Notion-like experience

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- A Supabase account and project
- Yarn package manager

## ⚙️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd top-note
yarn install
```

### 2. Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to **Settings** > **API**
3. Copy your **Project URL** and **anon public key**

### 3. Create Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Database Schema

In your Supabase dashboard, go to **SQL Editor** and run this query:

```sql
-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  share_token UUID DEFAULT NULL
);

-- Enable Row Level Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes" ON notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" ON notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public access to shared notes
CREATE POLICY "Anyone can view public notes" ON notes
  FOR SELECT USING (is_public = true);

-- Create indexes for better performance
CREATE INDEX notes_user_id_idx ON notes(user_id);
CREATE INDEX notes_updated_at_idx ON notes(updated_at);
CREATE INDEX notes_share_token_idx ON notes(share_token);
```

### 5. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** > **Settings**
2. Add your site URL to **Site URL**: `http://localhost:3000`
3. Add redirect URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`

For OAuth providers (optional):

1. Go to **Authentication** > **Providers**
2. Enable Google and/or GitHub
3. Add your OAuth app credentials

## 🏃‍♂️ Running the Application

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 📱 How to Use

1. **Sign Up/Login** - Create an account or sign in
2. **Create Notes** - Click the + button to create a new note
3. **Edit Notes** - Click on any note to start editing
4. **Markdown Support** - Use markdown syntax for rich formatting
5. **Preview Mode** - Toggle between edit and preview modes
6. **Share Notes** - Click "Share" to generate a public link
7. **Organize** - Use the sidebar to navigate between notes

## 🎨 Customization

The app uses Tailwind CSS for styling. You can customize:

- Colors in `tailwind.config.js`
- Global styles in `src/app/globals.css`
- Component styles in individual component files

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel dashboard
4. Update your Supabase redirect URLs to include your production URL

### Deploy to Netlify

1. Build the project: `yarn build`
2. Deploy the `out` folder to Netlify
3. Add environment variables in Netlify dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🆘 Troubleshooting

### Common Issues

1. **Authentication not working**: Check your Supabase URL and keys
2. **Database errors**: Make sure you've run the SQL schema
3. **Styling issues**: Clear your browser cache and restart the dev server

### Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Open an issue in this repository

---

Built with ❤️ using Next.js and Supabase
