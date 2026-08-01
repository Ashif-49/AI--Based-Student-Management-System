# AI-Based Student Management

This project is a JavaScript monorepo with:

- `backend`: Node.js + Express + Sequelize API
- `frontend`: React + Vite client

It is not a Maven or Spring Boot project, so commands like `mvn spring-boot:run` will fail in this workspace.

## Prerequisites

- Node.js and npm
- MySQL running with credentials that match `backend/.env`

## Run The Backend

From the project root:

```powershell
npm.cmd run backend:start
```

For development mode:

```powershell
npm.cmd run backend:dev
```

Or from the backend folder:

```powershell
cd backend
npm.cmd start
```

The backend runs on `http://localhost:5000`.

## Forgot Password Email Setup (Gmail)

To send real reset links to registered Gmail addresses, add these values in `backend/.env`:

```env
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-gmail-address@gmail.com
SMTP_PASS=your-16-char-gmail-app-password
SMTP_FROM=Flash AI <your-gmail-address@gmail.com>
```

Important: `SMTP_PASS` must be a Gmail **App Password** (not your normal Gmail login password).

## Run The Frontend

From the project root:

```powershell
npm.cmd run frontend:dev
```

Or from the frontend folder:

```powershell
cd frontend
npm.cmd run dev
```

## Build The Frontend

```powershell
npm.cmd run frontend:build
```

## Cleanup Invalid Grade Scores

If old data has invalid values (for example `score > maxScore` or `maxScore > 100`), run:

```powershell
# Preview what will be changed (safe)
npm.cmd run grades:cleanup-invalid:dry

# Apply fixes
npm.cmd run grades:cleanup-invalid
```

Rules enforced by the cleanup:

- `maxScore` is clamped to `1..100`
- `score` is clamped to `0..maxScore`
- letter grade is recalculated
- affected student GPA values are recalculated

## Notes For PowerShell

If `npm` is blocked by execution policy on Windows PowerShell, use `npm.cmd` instead of `npm`.
