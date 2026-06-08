# 刷新当前 PowerShell 会话的 PATH（改环境变量后需执行）
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
Write-Host "PATH 已刷新。" -ForegroundColor Green
mvn -version
