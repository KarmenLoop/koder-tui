@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p=Join-Path $env:TEMP ('koder-tui-install-'+[guid]::NewGuid().ToString('N')+'.ps1'); try { [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -UseBasicParsing 'https://github.com/KarmenLoop/koder-tui/releases/download/tui-0.3.0/koder-tui.ps1' -OutFile $p; & $p } finally { Remove-Item -LiteralPath $p -ErrorAction SilentlyContinue }"
exit /b %errorlevel%
