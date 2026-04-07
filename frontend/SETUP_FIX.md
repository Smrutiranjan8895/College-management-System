# GCEK Central - AWS Setup Instructions

## Current Configuration
```
User Pool ID: ap-south-1_zndNmRJGt
App Client ID: 3un6jatnpo8iga6vh2hvf4ko8e
Region: ap-south-1
```

---

## TROUBLESHOOTING CHECKLIST

### Error: "SECRET_HASH was not received"
**Cause:** App Client has a client secret enabled.

**Fix:**
1. Go to: https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools/ap-south-1_zndNmRJGt/app-integration/clients
2. Create new App Client:
   - Click **Create app client**
   - App type: **Public client**
   - Name: `gcek-web-public`
   - **UNCHECK** "Generate client secret"
   - Auth flows: Enable `ALLOW_USER_SRP_AUTH`
   - Click **Create**
3. Copy the new Client ID
4. Update `.env`: `VITE_COGNITO_APP_CLIENT_ID=<new-id>`
5. Restart: `npm run dev`

---

### Error: "User is not confirmed"
**Fix:** Manually confirm user:
1. Go to: https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools/ap-south-1_zndNmRJGt/users
2. Click on your username
3. Click **Actions** → **Confirm account**

---

### Error: "Attributes did not conform to schema"
**Cause:** Required attributes not provided or custom attributes don't exist.

**Fix:** Check User Pool required attributes:
1. Go to: https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools/ap-south-1_zndNmRJGt/sign-up-experience
2. See which attributes are required
3. The app sends: email, name, phone_number
4. If phone_number is NOT required, I can remove it from the code

---

### Error: "Username cannot be of email format"
**Cause:** User Pool uses email as alias.
**Status:** Already fixed in code - generates unique username automatically.

---

### Verification emails not arriving
**Cause:** Cognito default email has limits, or SES is in sandbox.

**Automated Fix (recommended):**
Run from `gcek-central/backend`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-cognito-email.ps1
```

**Quick Dev Fix (forces Cognito default sender):**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-cognito-email.ps1 -EmailMode cognito-default
```

**Why this works:**
- Wires the Cognito `CustomMessage` Lambda trigger correctly
- Ensures email verification uses code mode (`CONFIRM_WITH_CODE`)
- Falls back from SES when SES sandbox would block recipient delivery

**Production Fix:**
1. Set up Amazon SES
2. Verify your domain in SES
3. Configure Cognito to use SES for emails

---

## VERIFY YOUR APP CLIENT SETTINGS

Your App Client (`3un6jatnpo8iga6vh2hvf4ko8e`) must have:
- [ ] **NO client secret** (Generate client secret = UNCHECKED)
- [ ] Auth flow: `ALLOW_USER_SRP_AUTH` enabled
- [ ] Auth flow: `ALLOW_REFRESH_TOKEN_AUTH` enabled

Check here: https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools/ap-south-1_zndNmRJGt/app-integration/clients/3un6jatnpo8iga6vh2hvf4ko8e

---

## TEST YOUR CONFIGURATION

Open browser console (F12) and check for error details when you try to register/login.
The error name and message will tell you exactly what's wrong.

### Quick Fix: Manually Confirm User (for testing)
1. Go to [AWS Cognito Console](https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools)
2. Select User Pool: `ap-south-1_zndNmRJGt`
3. Go to **Users** tab
4. Find your registered user
5. Click on username → **Actions** → **Confirm account**
6. Now you can login!

### Production Fix: Configure Amazon SES
1. Go to **Amazon SES** → **Verified identities**
2. Add your domain or email address and verify it
3. Go to **Cognito** → User Pool → **Messaging** → **Email**
4. Select **Send email with Amazon SES**
5. Choose your verified SES identity
6. If SES is in sandbox, request production access

### Why This Happens
- Cognito's default email sender has daily limits (~50 emails)
- SES sandbox mode only allows sending to verified emails
- For production, you need SES in production mode with a verified domain

---

## Original Issue: Create App Client Without Secret

### Step 1: Go to AWS Cognito Console
1. Open [AWS Cognito Console](https://ap-south-1.console.aws.amazon.com/cognito/v2/idp/user-pools)
2. Select your User Pool: `ap-south-1_tguutXqZc`

### Step 2: Create New App Client
1. Go to **App integration** tab
2. Scroll to **App clients and analytics**
3. Click **Create app client**

### Step 3: Configure App Client
- **App type**: Public client
- **App client name**: `gcek-central-web`
- **Client secret**: **Do NOT generate** (leave unchecked) ❌
- **Authentication flows**:
  - ✅ ALLOW_USER_SRP_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH
- **Token expiration**: Use defaults or customize
- Click **Create**

### Step 4: Update .env File
Copy the new Client ID and update `frontend/.env`:

```env
VITE_COGNITO_APP_CLIENT_ID=<your-new-client-id-without-secret>
```

### Step 5: Configure Custom Attributes (if not done)
Ensure your User Pool has these custom attributes:
- `custom:role` (String) - Values: admin, branch_admin, teacher, student
- `custom:branch` (String) - Values: CS, EC, ME, CE, EE

To add custom attributes:
1. Go to **Sign-up experience** → **Custom attributes**
2. Add `role` and `branch` as String type

### Step 6: Restart Development Server
```bash
cd frontend
npm run dev
```

## Why This Happens
- Client secrets are meant for server-side applications
- Browser/mobile apps expose all JavaScript code to users
- Cognito requires "Public client" (no secret) for frontend apps
- The SDK cannot compute SECRET_HASH securely in the browser
