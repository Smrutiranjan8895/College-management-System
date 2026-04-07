# Cognito Email OTP Fix Commands (Use this after reading setup-cognito-email.ps1)

# Recommended: run the automated idempotent setup script.
# - Auto mode: uses SES only when sender is verified and SES is out of sandbox,
#   otherwise falls back to Cognito default sender for development reliability.
.\setup-cognito-email.ps1

# Force Cognito default sender (quick dev fix when SES is sandboxed)
.\setup-cognito-email.ps1 -EmailMode cognito-default

# Force SES mode (production-like)
# Replace sender email if needed.
.\setup-cognito-email.ps1 -EmailMode ses -SenderEmail "smrutiranjanadhikari17@gmail.com"

# Diagnostics: verify resulting user pool email and trigger config.
aws cognito-idp describe-user-pool `
  --user-pool-id ap-south-1_zndNmRJGt `
  --region ap-south-1 `
  --query "UserPool.{EmailConfig:EmailConfiguration,AutoVerified:AutoVerifiedAttributes,VerificationTemplate:VerificationMessageTemplate,LambdaConfig:LambdaConfig}"

# Diagnostics: check SES account mode (sandbox vs production).
aws sesv2 get-account --region ap-south-1 --query "{ProductionAccessEnabled:ProductionAccessEnabled,SendingEnabled:SendingEnabled,SendQuota:SendQuota}"
