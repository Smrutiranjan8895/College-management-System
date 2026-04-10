# Minimal Mock Tests

This folder has a minimal mock set for the 4 flows:

- signup
- signin check
- create post
- delete post

## Kept event files

- mock/events/custom-message/signup.json
- mock/events/users/get-users-me.json
- mock/events/notices/post-notice.json
- mock/events/notices/delete-notice.json

## Run all 4 (PowerShell)

From backend folder:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\mock\invoke-all.ps1
```

## Run all 4 (CMD)

From backend folder:

```bat
mock\invoke-all.cmd
```

## Run one by one

```powershell
# 1) Signup trigger
npx serverless invoke local -f customMessageHandler -p .\mock\events\custom-message\signup.json --stage dev

# 2) Signin check (/users/me)
npx serverless invoke local -f userHandler -p .\mock\events\users\get-users-me.json --stage dev

# 3) Create post (/notices POST)
npx serverless invoke local -f noticeHandler -p .\mock\events\notices\post-notice.json --stage dev

# 4) Delete post (/notices DELETE)
npx serverless invoke local -f noticeHandler -p .\mock\events\notices\delete-notice.json --stage dev
```

## Outputs

Runner output files are written to:

- mock/outputs/<test-name>.json
