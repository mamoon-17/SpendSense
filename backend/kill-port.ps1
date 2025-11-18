# Kill any process using port 3000
$port = 3000
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    # Get unique process IDs
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    
    foreach ($processId in $processIds) {
        if ($processId -gt 0) {
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).Name
            Write-Host "Killing process $processName (PID: $processId) on port $port..."
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
    
    Start-Sleep -Seconds 1
    Write-Host "Port $port is now free!"
} else {
    Write-Host "Port $port is already free!"
}
