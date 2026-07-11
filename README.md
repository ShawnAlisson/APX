# APX

Next.js 16 app starter with:

- MongoDB connection helpers
- Email/password auth backed by opaque sessions
- A protected dashboard
- An OpenRouter connector for server-side chat requests

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `MONGODB_URI` and `OPENROUTER_API_KEY`.
3. Run the app:

```bash
npm run dev
```

## Routes

- `/` landing page with stack summary and session status
- `/login` register or sign in
- `/dashboard` protected dashboard and OpenRouter test panel
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/chat`

## Notes

- Sessions are stored in MongoDB and expire automatically after 30 days.
- OpenRouter requests stay server-side so the API key never reaches the browser.
- The Mongo helper follows Next.js App Router server conventions for Next 16.
