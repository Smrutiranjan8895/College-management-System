# GCEK Central Backend - Serverless Deployment

## Prerequisites

1. **Node.js 20+** installed
2. **AWS CLI** configured with credentials:
   ```bash
   aws configure
   ```
3. **Serverless Framework** installed globally (optional):
   ```bash
   npm install -g serverless
   ```

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Update `serverless.yml` with your Cognito User Pool ID:
   ```yaml
   custom:
     cognitoUserPoolId: ap-south-1_zndNmRJGt  # Your User Pool ID
   ```

3. Configure Cognito email OTP + CustomMessage trigger:
   ```bash
   powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-cognito-email.ps1
   ```

   Notes:
   - `setup-cognito-email.ps1` deploys the Serverless stack, wires the `CustomMessage` trigger, and enables code-based email verification.
   - In `auto` mode, it uses SES only when sender is verified and SES is out of sandbox; otherwise it falls back to `COGNITO_DEFAULT` for development delivery.

## Local Development

Run locally with serverless-offline:
```bash
npm start
```

This starts a local API at `http://localhost:3000`

### Seed Realistic Dummy Academic Data

You can seed realistic demo data (students, notices, results, attendance) in two ways:

1. Script (local/CI):
   ```bash
   npm run seed:dummy
   ```

2. API endpoint (admin/branch_admin only):
   - `GET /seed/dummy-data` returns dataset preview
   - `POST /seed/dummy-data` writes dataset to DynamoDB

By default, auto-seeding runs once when APIs are first hit and no students exist.
Disable with:

```bash
AUTO_SEED_DUMMY=false
```

### Real-time Sync Strategy (Dashboard-safe)

The app uses lightweight polling for near real-time sync without changing auth/UI architecture:

- Student dashboard polls attendance/results/notices every 10s
- Teacher dashboard polls students/results/attendance/notices every 10s
- Admin/Branch Admin dashboards poll counters every 12s

This keeps student and teacher views aligned when attendance/results/notices are updated.

### Fixed: Post Notice Not Working

`noticeHandler` now accepts both old and new payloads and role permutations:

- Accepts `content` or `description`
- Accepts `branch` or `targetBranch`
- Supports posting by `admin`, `branch_admin`, and `teacher`
- Returns both `{ data }` and `{ notices/notice }` compatibility shapes

This resolves failures where frontend payload naming previously caused notice creation to fail.

## Deployment

### Deploy to Development
```bash
npm run deploy
```

### Deploy to Production
```bash
npm run deploy:prod
```

### View Deployment Info
```bash
npm run info
```

### View Function Logs
```bash
npm run logs -- studentHandler
npm run logs -- attendanceHandler
npm run logs -- resultsHandler
npm run logs -- noticeHandler
```

### Remove Stack
```bash
npm run remove
```

## API Endpoints

After deployment, you'll get endpoints like:
```
https://xxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/students
https://xxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/attendance
https://xxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/results
https://xxxxxxxx.execute-api.ap-south-1.amazonaws.com/dev/notices
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│    (Cognito Authorizer for JWT validation)                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ studentHandler│   │attendanceHdlr │   │ resultsHandler│
│   (Lambda)    │   │   (Lambda)    │   │   (Lambda)    │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │   DynamoDB    │
                    │ (Pay per req) │
                    └───────────────┘
```

## DynamoDB Tables Created

| Table | Partition Key | Sort Key | GSI |
|-------|--------------|----------|-----|
| Students | studentId | branch | branch-index |
| Attendance | studentId | date | branch-date-index |
| Results | studentId | semester | branch-semester-index |
| Notices | noticeId | createdAt | audience-index |

## Handlers

### studentHandler
- `GET /students` - List students by branch
- `GET /students/{studentId}` - Get single student
- `POST /students` - Create student
- `PUT /students/{studentId}` - Update student
- `DELETE /students/{studentId}` - Delete student

### attendanceHandler
- `GET /attendance` - List attendance by branch/date
- `GET /attendance/{studentId}` - Get student attendance
- `POST /attendance` - Mark attendance
- `POST /attendance/bulk` - Bulk mark attendance

### resultsHandler
- `GET /results` - List results by branch/semester
- `GET /results/{studentId}` - Get student results
- `POST /results` - Add results
- `PUT /results/{studentId}` - Update results

### noticeHandler
- `GET /notices` - List notices
- `GET /notices/{noticeId}` - Get single notice
- `POST /notices` - Create notice
- `PUT /notices/{noticeId}` - Update notice
- `DELETE /notices/{noticeId}` - Delete notice

## Environment Variables

Set automatically by Serverless:
- `DYNAMODB_REGION` - AWS region
- `STUDENTS_TABLE` - Students table name
- `ATTENDANCE_TABLE` - Attendance table name
- `RESULTS_TABLE` - Results table name
- `NOTICES_TABLE` - Notices table name
- `COGNITO_USER_POOL_ID` - Cognito User Pool ID

## Troubleshooting

### "User is not authorized"
Ensure AWS credentials are configured:
```bash
aws configure
# Enter Access Key, Secret Key, Region (ap-south-1)
```

### "Stack already exists"
If redeploying after manual resource creation:
```bash
serverless deploy --force
```

### View CloudFormation Events
```bash
serverless deploy --verbose
```
