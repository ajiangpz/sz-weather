param(
    [string]$RepositoryPath = 'E:\sz-weather'
)

$ErrorActionPreference = 'Stop'
$taskName = 'RainScope daily optimization'
$runDirectory = Join-Path $RepositoryPath '.agent\daily-runs'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $runDirectory "$timestamp.log"
$reportPath = Join-Path $runDirectory "$timestamp-report.md"

New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null

$mutex = [Threading.Mutex]::new($false, 'Local\RainScopeDailyOptimization')
$hasMutex = $false

try {
    $hasMutex = $mutex.WaitOne(0)
    if (-not $hasMutex) {
        Add-Content -LiteralPath $logPath -Value 'Skipped: another daily optimization is still running.'
        & msg.exe $env:USERNAME "$taskName skipped because another run is active."
        exit 2
    }

    $codexCommand = Get-Command codex.exe -ErrorAction Stop
    $prompt = @'
Perform one small, complete, high-value improvement to the RainScope project.

Follow AGENTS.md and the autonomous development loop exactly. Resume from .agent/state.json, inspect the repository and current git diff before editing, and preserve all existing user changes. Select only one bounded improvement supported by the project requirements or an existing open issue. Do not handle AGENT-001 unless explicitly authorized by the user. Do not introduce real weather APIs or unrelated dependencies.

Run every applicable validation command declared by the repository. Record unavailable commands and every test or review finding in .agent/issues.md. Perform the required test-review-repair cycles, update .agent/state.json after every stage, and write a final completion or blocked report.

This is an unattended scheduled run. Never commit, push, open a pull request, publish, deploy, access external accounts, or modify files outside this repository. If a safe improvement cannot be completed without user input, set the state to BLOCKED and explain why instead of guessing.
'@

    Push-Location $RepositoryPath
    try {
        $prompt | & $codexCommand.Source exec --cd $RepositoryPath --sandbox workspace-write --ask-for-approval never --color never --output-last-message $reportPath - 2>&1 |
            Tee-Object -FilePath $logPath
        $exitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }

    if ($exitCode -eq 0) {
        & msg.exe $env:USERNAME "$taskName completed. Report: $reportPath"
    }
    else {
        & msg.exe $env:USERNAME "$taskName failed with exit code $exitCode. Log: $logPath"
    }

    exit $exitCode
}
catch {
    Add-Content -LiteralPath $logPath -Value ($_ | Out-String)
    try {
        & msg.exe $env:USERNAME "$taskName failed. Log: $logPath"
    }
    catch {
        # The log remains the fallback when no interactive Windows session exists.
    }
    exit 1
}
finally {
    if ($hasMutex) {
        $mutex.ReleaseMutex()
    }
    $mutex.Dispose()
}
