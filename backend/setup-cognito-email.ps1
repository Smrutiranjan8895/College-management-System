# GCEK Central - Cognito OTP Email Setup
# Idempotent setup using AWS CLI + Serverless

param(
    [string]$Region = "ap-south-1",
    [string]$UserPoolId = "ap-south-1_zndNmRJGt",
    [string]$SenderEmail = "smrutiranjanadhikari17@gmail.com",
    [ValidateSet("auto", "ses", "cognito-default")]
    [string]$EmailMode = "auto",
    [string]$Stage = "dev",
    [switch]$SkipDeploy
)

$ErrorActionPreference = "Stop"
$env:AWS_PAGER = ""

function Require-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' is not installed or not in PATH."
    }
}

function Get-SesStatus {
    param(
        [string]$Region,
        [string]$SenderEmail
    )

    $account = aws sesv2 get-account --region $Region --output json | ConvertFrom-Json

    $senderVerified = $false
    if ($SenderEmail) {
        $attrs = aws ses get-identity-verification-attributes --identities $SenderEmail --region $Region --query "VerificationAttributes" --output json | ConvertFrom-Json
        if ($attrs.$SenderEmail -and $attrs.$SenderEmail.VerificationStatus -eq "Success") {
            $senderVerified = $true
        }
    }

    return [PSCustomObject]@{
        ProductionAccessEnabled = [bool]$account.ProductionAccessEnabled
        SendingEnabled          = [bool]$account.SendingEnabled
        SenderVerified          = $senderVerified
    }
}

function Resolve-EmailMode {
    param(
        [string]$RequestedMode,
        [object]$SesStatus
    )

    if ($RequestedMode -eq "ses") {
        if (-not $SesStatus.SenderVerified) {
            throw "Sender identity is not verified in SES. Verify sender first or use -EmailMode cognito-default."
        }
        return "ses"
    }

    if ($RequestedMode -eq "cognito-default") {
        return "cognito-default"
    }

    if ($SesStatus.SenderVerified -and $SesStatus.ProductionAccessEnabled) {
        return "ses"
    }

    return "cognito-default"
}

function Build-LambdaConfigJson {
    param(
        [object]$CurrentLambdaConfig,
        [string]$CustomMessageArn
    )

    $result = @{}
    $fields = @(
        "PreSignUp",
        "CustomMessage",
        "PostConfirmation",
        "PreAuthentication",
        "PostAuthentication",
        "DefineAuthChallenge",
        "CreateAuthChallenge",
        "VerifyAuthChallengeResponse",
        "PreTokenGeneration",
        "UserMigration",
        "KMSKeyID"
    )

    foreach ($field in $fields) {
        if ($CurrentLambdaConfig -and $CurrentLambdaConfig.$field) {
            $result[$field] = $CurrentLambdaConfig.$field
        }
    }

    if ($CurrentLambdaConfig -and $CurrentLambdaConfig.CustomSMSSender) {
        $result["CustomSMSSender"] = @{
            LambdaArn     = $CurrentLambdaConfig.CustomSMSSender.LambdaArn
            LambdaVersion = $CurrentLambdaConfig.CustomSMSSender.LambdaVersion
        }
    }

    if ($CurrentLambdaConfig -and $CurrentLambdaConfig.CustomEmailSender) {
        $result["CustomEmailSender"] = @{
            LambdaArn     = $CurrentLambdaConfig.CustomEmailSender.LambdaArn
            LambdaVersion = $CurrentLambdaConfig.CustomEmailSender.LambdaVersion
        }
    }

    $result["CustomMessage"] = $CustomMessageArn

    return ($result | ConvertTo-Json -Compress -Depth 8)
}

function New-AwsJsonFile {
    param([string]$Json)

    $file = New-TemporaryFile
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($file.FullName, $Json, $utf8NoBom)
    return $file.FullName
}

function To-FileUri {
    param([string]$Path)
    return "file://$($Path -replace '\\', '/')"
}

Write-Host "=== GCEK Central - Cognito OTP Email Setup ===" -ForegroundColor Cyan

Require-Command aws
Require-Command npx

$backendDir = $PSScriptRoot

Write-Host "Checking AWS caller identity..." -ForegroundColor Cyan
$accountId = aws sts get-caller-identity --query Account --output text
Write-Host "Account ID: $accountId" -ForegroundColor Green

if (-not $SkipDeploy) {
    Write-Host "Deploying Serverless stack to ensure CustomMessage Lambda exists..." -ForegroundColor Cyan
    Push-Location $backendDir
    try {
        npx serverless deploy --stage $Stage
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Skipping Serverless deploy because -SkipDeploy was provided." -ForegroundColor Yellow
}

$functionName = "gcek-central-$Stage-customMessageHandler"
Write-Host "Resolving Lambda ARN for function: $functionName" -ForegroundColor Cyan
$lambdaArn = aws lambda get-function --function-name $functionName --query "Configuration.FunctionArn" --output text --region $Region
Write-Host "CustomMessage Lambda ARN: $lambdaArn" -ForegroundColor Green

$statementId = "CognitoInvokeCustomMessage"
$sourceArn = "arn:aws:cognito-idp:${Region}:${accountId}:userpool/$UserPoolId"

Write-Host "Ensuring Cognito invoke permission on Lambda..." -ForegroundColor Cyan
$hasPermission = $false
try {
    $policyPayload = aws lambda get-policy --function-name $functionName --region $Region --query "Policy" --output text
    if ($policyPayload) {
        $policyDoc = $policyPayload | ConvertFrom-Json
        foreach ($statement in $policyDoc.Statement) {
            if ($statement.Sid -eq $statementId) {
                $hasPermission = $true
                break
            }
        }
    }
} catch {
    $hasPermission = $false
}

if (-not $hasPermission) {
    aws lambda add-permission `
        --function-name $functionName `
        --statement-id $statementId `
        --action lambda:InvokeFunction `
        --principal cognito-idp.amazonaws.com `
        --source-arn $sourceArn `
        --region $Region | Out-Null
    Write-Host "Added Lambda permission for Cognito." -ForegroundColor Green
} else {
    Write-Host "Lambda permission already exists. Skipping add-permission." -ForegroundColor Yellow
}

Write-Host "Checking SES status..." -ForegroundColor Cyan
$sesStatus = Get-SesStatus -Region $Region -SenderEmail $SenderEmail
$resolvedMode = Resolve-EmailMode -RequestedMode $EmailMode -SesStatus $sesStatus

if ($resolvedMode -eq "ses") {
    $sourceIdentityArn = "arn:aws:ses:${Region}:${accountId}:identity/$SenderEmail"
    $emailConfigJson = (@{
            EmailSendingAccount = "DEVELOPER"
            SourceArn           = $sourceIdentityArn
        } | ConvertTo-Json -Compress)

    if (-not $sesStatus.ProductionAccessEnabled) {
        Write-Host "SES is in sandbox. OTP emails can only be sent to verified recipient identities." -ForegroundColor Yellow
    }
} else {
    $emailConfigJson = (@{
            EmailSendingAccount = "COGNITO_DEFAULT"
        } | ConvertTo-Json -Compress)

    Write-Host "Using Cognito default email sender to avoid SES sandbox recipient restrictions during development." -ForegroundColor Yellow
}

Write-Host "Loading current user pool config..." -ForegroundColor Cyan
$pool = aws cognito-idp describe-user-pool --user-pool-id $UserPoolId --region $Region --output json | ConvertFrom-Json

$lambdaConfigJson = Build-LambdaConfigJson -CurrentLambdaConfig $pool.UserPool.LambdaConfig -CustomMessageArn $lambdaArn

$verificationTemplateJson = (@{
        DefaultEmailOption = "CONFIRM_WITH_CODE"
    EmailSubject       = "GCEK Central - Your Verification Code"
    EmailMessage       = "Welcome to GCEK Central.`n`nYour verification code is {####}.`n`nEnter this code to complete your signup. This code expires in 24 hours.`n`nFor security, do not share this code with anyone."
    } | ConvertTo-Json -Compress)

Write-Host "Updating Cognito user pool for email OTP + custom message trigger..." -ForegroundColor Cyan
$lambdaConfigFile = New-AwsJsonFile -Json $lambdaConfigJson
$emailConfigFile = New-AwsJsonFile -Json $emailConfigJson
$verificationTemplateFile = New-AwsJsonFile -Json $verificationTemplateJson

try {
    aws cognito-idp update-user-pool `
        --user-pool-id $UserPoolId `
        --region $Region `
        --auto-verified-attributes email `
        --verification-message-template (To-FileUri -Path $verificationTemplateFile) `
        --lambda-config (To-FileUri -Path $lambdaConfigFile) `
        --email-configuration (To-FileUri -Path $emailConfigFile) | Out-Null

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to update Cognito user pool."
    }
} finally {
    Remove-Item -ErrorAction SilentlyContinue $lambdaConfigFile, $emailConfigFile, $verificationTemplateFile
}

Write-Host "Verifying final user pool settings..." -ForegroundColor Cyan
$finalSummary = aws cognito-idp describe-user-pool `
    --user-pool-id $UserPoolId `
    --region $Region `
    --query "UserPool.{UserPoolId:Id,AutoVerified:AutoVerifiedAttributes,EmailSendingAccount:EmailConfiguration.EmailSendingAccount,SourceArn:EmailConfiguration.SourceArn,CustomMessage:LambdaConfig.CustomMessage,VerificationTemplate:VerificationMessageTemplate.DefaultEmailOption}" `
    --output json

Write-Host "`nSetup completed successfully." -ForegroundColor Green
Write-Host "Applied email mode: $resolvedMode" -ForegroundColor Green
Write-Host "SES production access: $($sesStatus.ProductionAccessEnabled)" -ForegroundColor Green
Write-Host "Sender verified: $($sesStatus.SenderVerified)" -ForegroundColor Green
Write-Host "`nFinal Cognito summary:" -ForegroundColor Cyan
Write-Host $finalSummary

if (-not $sesStatus.ProductionAccessEnabled -and $resolvedMode -eq "ses") {
    Write-Host "`nIMPORTANT: SES is in sandbox. Verify recipient emails or request SES production access." -ForegroundColor Yellow
}
