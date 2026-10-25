param([string]$InstallRoot = $env:KODER_TUI_HOME, [string]$DownloadBase = $env:KODER_TUI_DOWNLOAD_BASE)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Version = '0.3.0'
if (!$InstallRoot) { $InstallRoot = Join-Path $env:LOCALAPPDATA 'koder-tui' }
if (!$DownloadBase) { $DownloadBase = 'https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.0' }
if (![Environment]::Is64BitOperatingSystem) { throw 'Koder TUI requires 64-bit Windows.' }
if ($env:KODER_TUI_EULA_ACCEPT -ne '1') {
  Write-Host 'Koder TUI is free for personal, noncommercial use under Koder-EULA-1.1.'
  Write-Host 'Read https://github.com/KarmenLoop/koder-tui/blob/main/EULA.md'
  Write-Host 'Commercial use requires separate permission. Installation does not authorize tools or accounts.'
  if ((Read-Host 'Type accept to install, or Enter to cancel') -cne 'accept') { throw 'Installation cancelled.' }
}
$File = "koder-tui-$Version-windows-x64.zip"
$Temp = Join-Path ([IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $Temp | Out-Null
try {
  Invoke-WebRequest -UseBasicParsing "$DownloadBase/$File" -OutFile (Join-Path $Temp $File) -TimeoutSec 600
  Invoke-WebRequest -UseBasicParsing "$DownloadBase/SHA256SUMS" -OutFile (Join-Path $Temp 'SHA256SUMS') -TimeoutSec 60
  $Rows = @(Get-Content (Join-Path $Temp 'SHA256SUMS') | Where-Object { $_ -match ('^[0-9a-f]{64}  ' + [regex]::Escape($File) + '$') })
  if ($Rows.Count -ne 1) { throw 'Missing or ambiguous checksum.' }
  $Expected = $Rows[0].Split(' ')[0]
  if ((Get-FileHash (Join-Path $Temp $File) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Expected) { throw 'Checksum mismatch.' }
  Expand-Archive -LiteralPath (Join-Path $Temp $File) -DestinationPath $Temp
  $Source = Join-Path $Temp 'koder-tui'
  & (Join-Path $Source 'runtime/node.exe') (Join-Path $Source 'packages/koder-tui/bin/koder-tui.mjs') --version
  if ($LASTEXITCODE -ne 0) { throw 'Runtime verification failed.' }
  $Dest = Join-Path $InstallRoot ("versions/$Version." + [Guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $Dest -Force | Out-Null
  Copy-Item "$Source/*" $Dest -Recurse
  $Bin = Join-Path $InstallRoot 'bin'
  New-Item -ItemType Directory -Path $Bin -Force | Out-Null
  $Launcher = Join-Path $Bin 'koder-tui.cmd'
  if ((Test-Path $Launcher) -and !((Get-Content $Launcher -Raw).Contains('KODER_TUI_MANAGED_LAUNCHER'))) { throw 'Refusing to replace an unmanaged launcher.' }
  $Relative = "..\versions\" + (Split-Path $Dest -Leaf) + "\koder-tui.cmd"
  $Content = "@echo off`r`nrem KODER_TUI_MANAGED_LAUNCHER`r`ncall `"%~dp0$Relative`" %*`r`nexit /b %errorlevel%`r`n"
  [IO.File]::WriteAllText("$Launcher.new", $Content, [Text.Encoding]::ASCII)
  Move-Item -LiteralPath "$Launcher.new" -Destination $Launcher -Force
  $UserPath = [string][Environment]::GetEnvironmentVariable('Path', 'User')
  if (@($UserPath -split ';') -notcontains $Bin) { [Environment]::SetEnvironmentVariable('Path', (($UserPath.TrimEnd(';') + ';' + $Bin).TrimStart(';')), 'User') }
  $env:Path = "$Bin;$env:Path"
  Write-Host "Installed: $Launcher"
  Write-Host 'Open a new terminal and run koder-tui. Your existing CLI and configuration are unchanged.'
} finally { Remove-Item -LiteralPath $Temp -Recurse -Force -ErrorAction SilentlyContinue }
