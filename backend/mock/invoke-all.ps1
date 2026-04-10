param(
  [string]$Stage = "dev",
  [switch]$CleanOutput
)

$ErrorActionPreference = "Continue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputDir = Join-Path $ScriptDir "outputs"

if ($CleanOutput -and (Test-Path $OutputDir)) {
  Remove-Item -Path (Join-Path $OutputDir "*") -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$tests = @(
  @{ Name = "custom-message-signup"; Function = "customMessageHandler"; Event = "events/custom-message/signup.json" },
  @{ Name = "users-signin-check"; Function = "userHandler"; Event = "events/users/get-users-me.json" },
  @{ Name = "notices-post-create"; Function = "noticeHandler"; Event = "events/notices/post-notice.json" },
  @{ Name = "notices-delete"; Function = "noticeHandler"; Event = "events/notices/delete-notice.json" }
)

$passed = 0
$failed = 0
$failedTests = @()

Write-Host "Running $($tests.Count) mock invoke tests (stage: $Stage)"

foreach ($test in $tests) {
  $eventPath = Join-Path $ScriptDir $test.Event
  $outputPath = Join-Path $OutputDir ($test.Name + ".json")

  if (-not (Test-Path $eventPath)) {
    Write-Host "[MISSING] $($test.Event)" -ForegroundColor Red
    $failed++
    $failedTests += $test.Name
    continue
  }

  Write-Host ""
  Write-Host "> $($test.Name)"

  $invokeArgs = @(
    "serverless",
    "invoke",
    "local",
    "-f", $test.Function,
    "-p", $eventPath,
    "--stage", $Stage
  )

  $invokeOutput = & npx.cmd $invokeArgs 2>&1
  $exitCode = $LASTEXITCODE

  if ($invokeOutput -is [System.Array]) {
    $invokeOutput | Out-File -FilePath $outputPath -Encoding utf8
  } else {
    "$invokeOutput" | Out-File -FilePath $outputPath -Encoding utf8
  }

  if ($exitCode -eq 0) {
    Write-Host "  PASS" -ForegroundColor Green
    $passed++
  } else {
    Write-Host "  FAIL (see $outputPath)" -ForegroundColor Red
    $failed++
    $failedTests += $test.Name
  }
}

Write-Host ""
Write-Host "Summary: $passed passed, $failed failed"

if ($failed -gt 0) {
  Write-Host "Failed tests: $($failedTests -join ', ')" -ForegroundColor Yellow
  exit 1
}

exit 0
