$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$backendCommand = "Set-Location '$projectRoot'; npm.cmd run backend:start"
$frontendCommand = "Set-Location '$projectRoot'; npm.cmd run frontend:dev"

Start-Process -FilePath "powershell.exe" -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "`$Host.UI.RawUI.WindowTitle = 'AI Student Management - Backend'; $backendCommand"
)

Start-Process -FilePath "powershell.exe" -ArgumentList @(
  "-NoExit",
  "-ExecutionPolicy",
  "Bypass",
  "-Command",
  "`$Host.UI.RawUI.WindowTitle = 'AI Student Management - Frontend'; $frontendCommand"
)
