# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EverMoment** is a digital souvenir photo editor for tourists in El Salvador. Users upload a photo, AI removes the background via Photoroom API, and users can position themselves over landscape templates with customizable text overlays.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage (images)
- **Auth**: Supabase Auth (admin only)
- **Canvas**: HTML5 Canvas API (1080x1350px, 4:5 ratio)

## Project Structure

```
EverMoment/
├── index.html                  # Public app (no login required)
├── admin/
│   ├── index.html             # Admin login
│   ├── dashboard.html         # Admin dashboard
│   └── backgrounds.html       # Backgrounds CRUD
├── css/
│   ├── styles.css             # Public app styles
│   └── admin.css              # Admin panel styles
├── js/
│   ├── config.js              # Public config (no API keys)
│   ├── app.js                 # Public app logic
│   ├── supabase.js            # Supabase client
│   └── admin/
│       ├── auth.js            # Admin authentication
│       ├── dashboard.js       # Dashboard logic
│       └── backgrounds.js     # Backgrounds CRUD
├── api/
│   ├── remove-bg.js           # Photoroom proxy
│   ├── backgrounds/
│   │   ├── list.js            # GET (public)
│   │   ├── create.js          # POST (admin)
│   │   ├── update.js          # PUT (admin)
│   │   └── delete.js          # DELETE (admin)
│   └── middleware/
│       └── auth.js            # JWT verification
├── supabase/
│   └── schema.sql             # Database schema
├── vercel.json
└── .env.example
```

## Development Setup

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your actual keys
```

Required variables:
- `PHOTOROOM_API_KEY` - Photoroom API key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (backend only)

### 3. Run Locally
```bash
vercel dev
# Opens at http://localhost:3000
```

## Supabase Setup

### 1. Create Project
Create a new project at [supabase.com](https://supabase.com)

### 2. Run Schema
Execute `supabase/schema.sql` in the SQL Editor

### 3. Create Storage Bucket
- Go to Storage > Create new bucket
- Name: `backgrounds`
- Public: Yes

### 4. Update Frontend Config
Edit `js/supabase.js`:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
};
```

### 5. Create First Admin User
1. Go to Authentication > Users > Add user
2. Create user with email/password
3. Copy the user's UUID
4. Run in SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = 'paste-uuid-here';
```

## Key Architecture

### Layer System (Canvas Rendering)
3-layer compositing in `render()`:
- **Layer 0**: Background (template or custom)
- **Layer 1**: Subject (user photo with filters)
- **Layer 2**: Overlay (branding, text, watermark)

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/remove-bg` | POST | No | Photoroom proxy |
| `/api/backgrounds/list` | GET | No | List active backgrounds |
| `/api/backgrounds/create` | POST | Admin | Create background |
| `/api/backgrounds/update` | PUT | Admin | Update background |
| `/api/backgrounds/delete` | DELETE | Admin | Delete background |

### Admin Panel Flow
1. Login at `/admin/` → Supabase Auth
2. Verify role = 'admin' → Redirect to dashboard
3. Manage backgrounds with full CRUD
4. Drag & drop reordering (SortableJS)

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | FK to auth.users |
| role | TEXT | 'admin' or 'user' |
| created_at | TIMESTAMPTZ | |

### backgrounds
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Display name |
| file_path | TEXT | Storage path |
| file_url | TEXT | Public URL |
| active | BOOLEAN | Visible in app |
| display_order | INT | Sort order |

## Security

- API keys only in environment variables (never in frontend)
- Admin endpoints verify JWT + role
- RLS policies as second security layer
- Service role key only in backend
