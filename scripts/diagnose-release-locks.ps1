# Lists processes that often hold locks on release\ (Windows).
# Does not require admin. For file-handle level detail, use Sysinternals Handle (see footer).
$ErrorActionPreference = "Stop"

$release = Join-Path (Split-Path $PSScriptRoot -Parent) "release"
$releaseFull = if (Test-Path -LiteralPath $release) {
  (Get-Item -LiteralPath $release).FullName.TrimEnd("\")
} else {
  Write-Host "No release folder at:`n  $release`nNothing to diagnose."
  exit 0
}

Write-Host ""
Write-Host "=== Release folder ===" -ForegroundColor Cyan
Write-Host $releaseFull
Write-Host ""

$matches = New-Object System.Collections.Generic.List[object]

Get-CimInstance Win32_Process |
  ForEach-Object {
    $procId = [int]$_.ProcessId
    $name = $_.Name
    $exe = $_.ExecutablePath
    $cl = $_.CommandLine

    if ($exe -and $exe.StartsWith($releaseFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      [void]$matches.Add([pscustomobject]@{
          Reason = "Executable under release"
          Id     = $procId
          Name   = $name
          Path   = $exe
          Detail = $null
        })
    }
    elseif ($cl -and $cl.IndexOf($releaseFull, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
      $short = if ($cl.Length -gt 140) { $cl.Substring(0, 137) + "..." } else { $cl }
      [void]$matches.Add([pscustomobject]@{
          Reason = "CommandLine references release"
          Id     = $procId
          Name   = $name
          Path   = $exe
          Detail = $short
        })
    }
  }

if ($matches.Count -eq 0) {
  Write-Host "No processes found with EXE or CommandLine under that path." -ForegroundColor Yellow
  Write-Host "(Explorer, search indexer, or AV may still hold the directory without showing up here.)"
} else {
  Write-Host "=== Matching processes ($($matches.Count)) ===" -ForegroundColor Cyan
  $matches | Sort-Object Id -Unique | Format-Table -AutoSize Reason, Id, Name, Path, Detail
  Write-Host "To stop a process (example):  Stop-Process -Id <Id> -Force" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "=== If the list is empty but delete still fails ===" -ForegroundColor Cyan
Write-Host " 1) Close any File Explorer window showing the project or release folder."
Write-Host " 2) Close BAT Living Docs if it was started from release\win-unpacked."
Write-Host " 3) Temporarily pause real-time protection for this folder in Windows Security."
Write-Host " 4) Run Sysinternals Handle as Admin, then:" -ForegroundColor Yellow
Write-Host "      handle.exe `"$releaseFull`""
Write-Host "    Download: https://learn.microsoft.com/en-us/sysinternals/downloads/handle"
Write-Host " 5) Restart Windows (releases stray locks)."
Write-Host ""
