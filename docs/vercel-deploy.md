# Vercel Deployment (Frontend + Backend)

## What is configured
- React frontend is built from `frontend/` and served as static output.
- Express backend is exposed as a Vercel serverless function via `api/[...all].js`.
- SPA routes fall back to `index.html`.
- Frontend API base defaults to `/api` for same-domain deployment.
- CORS accepts configured origins and Vercel preview domains.

## Required Vercel Environment Variables
Set these in Project Settings -> Environment Variables:

- `NODE_ENV=production`
- `JWT_SECRET=<at least 32 characters>`
- `JWT_EXPIRE=7d` (optional)
- `CLIENT_URL=https://<your-production-domain>`
- `CORS_ALLOWED_ORIGINS=https://<your-production-domain>,https://<your-preview-domain-if-needed>`
- `DB_HOST=<mysql-host>`
- `DB_PORT=3306`
- `DB_USER=<mysql-user>`
- `DB_PASSWORD=<mysql-password>`
- `DB_NAME=<mysql-database>`
- `CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>`
- `CLOUDINARY_API_KEY=<cloudinary-api-key>`
- `CLOUDINARY_API_SECRET=<cloudinary-api-secret>`
- `CLOUDINARY_FOLDER=sprintboard/tasks` (optional)

## Deploy Steps
1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Keep root directory as repository root.
4. Ensure Vercel detects `vercel.json`.
5. Add the env variables above.
6. Deploy.

## Important Note for File Attachments
- With Cloudinary vars configured, uploads are persisted to Cloudinary and `task_attachments.file_path` stores the remote URL.
- Without Cloudinary vars, uploads fall back to local disk (`/tmp` on Vercel), which is ephemeral.
