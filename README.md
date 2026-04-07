# GCEK Central

GCEK Central is a role-based college management web application for Government College of Engineering Kalahandi.

It provides a unified system for student records, attendance, results, notices, and analytics with secure Cognito authentication and a Serverless backend.

## Features

- Role-based access for Admin, Branch Admin, Teacher, and Student
- Student management (create, update, branch-wise access)
- Attendance management (single and bulk workflows)
- Results and GPA workflows
- Notice publishing and audience targeting
- Dashboard analytics
- Mobile-responsive UI

## Tech Stack

- Frontend: React 18, Vite, React Router, AWS Amplify, Axios, Recharts
- Backend: Node.js 20, Serverless Framework, AWS Lambda, API Gateway, DynamoDB, Cognito
- Auth: Amazon Cognito User Pool (email alias sign-in)

## Project Structure

```text
gcek-central/
  frontend/   # React + Vite application
  backend/    # Serverless Lambda API
```

## Prerequisites

- Node.js 20+
- npm
- AWS CLI configured (`aws configure`)
- Access to the AWS account hosting the Cognito User Pool and Serverless stack

## Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` with:

```env
VITE_API_URL=https://<api-id>.execute-api.ap-south-1.amazonaws.com/dev
VITE_COGNITO_REGION=ap-south-1
VITE_COGNITO_USER_POOL_ID=<your-user-pool-id>
VITE_COGNITO_APP_CLIENT_ID=<your-app-client-id>
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Backend Setup

```bash
cd backend
npm install
```

Run locally (serverless-offline):

```bash
npm start
```

Deploy (dev):

```bash
npm run deploy
```

Deploy (prod):

```bash
npm run deploy:prod
```

Get stack info:

```bash
npm run info
```

## Authentication and Role Notes

- Cognito is configured with **email alias** sign-in.
- Usernames are generated in non-email format for compatibility.
- Role assignment supports Admin, Branch Admin, Teacher, Student.
- If an account has no assigned role yet, the app can sync selected role on login.
- First admin bootstrap is supported only when no admin exists; after that, admin access should be assigned by an existing admin.

## Important API Routes

- `GET /users/me`
- `GET /users/check-email`
- `POST /users/self-role`
- `GET /users`
- `POST /users`
- `PUT /users/{username}`
- `GET/POST /students`
- `GET/POST /attendance`
- `GET/POST /results`
- `GET/POST /notices`

## Common Troubleshooting

### 1. Incorrect email or password after creating account

This usually happens when the same email already has a confirmed account in Cognito.

What to do:

- Use the existing account password for that email, or
- Use a new email for a new account

### 2. Role shows as Student unexpectedly

- Sign in once using the intended role selection if the account is unresolved.
- If role is already assigned, update it via Admin user management.

### 3. API requests fail from frontend

- Verify `VITE_API_URL` points to deployed API Gateway stage.
- Ensure Cognito env vars are correct and app client has no secret.

## Useful Backend Docs

For deeper backend deployment and DynamoDB details, see:

- `backend/README.md`
