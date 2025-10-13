# Kill any process using port 3000
$port = 3000
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($process) {
    $processId = $process.OwningProcess | Select-Object -First 1
    Write-Host "Killing process $processId on port $port..."
    Stop-Process -Id $processId -Force
    Start-Sleep -Seconds 1
    Write-Host "Port $port is now free!"
} else {
    Write-Host "Port $port is already free!"
}
