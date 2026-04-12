# Stop All Services Script
# Stops frontend, backend, and database services

Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow

# Stop Docker containers
Write-Host "`n📦 Stopping Docker containers..." -ForegroundColor Cyan
docker-compose down 2>$null
docker stop test-db 2>$null
docker ps -a --filter "name=construction-pricing" --format "{{.Names}}" | ForEach-Object { 
    docker stop $_ 2>$null
    Write-Host "   Stopped: $_" -ForegroundColor Gray
}

# Stop processes on frontend port (3000)
Write-Host "`n🌐 Stopping processes on port 3000 (frontend)..." -ForegroundColor Cyan
$frontendProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($frontendProcesses) {
    $frontendProcesses | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process on port 3000 (PID: $($_.OwningProcess))" -ForegroundColor Gray
    }
} else {
    Write-Host "   No process running on port 3000" -ForegroundColor Gray
}

# Stop processes on backend port (8000)
Write-Host "`n🔧 Stopping processes on port 8000 (backend)..." -ForegroundColor Cyan
$backendProcesses = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($backendProcesses) {
    $backendProcesses | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process on port 8000 (PID: $($_.OwningProcess))" -ForegroundColor Gray
    }
} else {
    Write-Host "   No process running on port 8000" -ForegroundColor Gray
}

# Stop any Node.js processes related to this project
Write-Host "`n🟢 Stopping Node.js processes..." -ForegroundColor Cyan
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { 
    $_.Path -like "*friendly-umbrella*" 
}
if ($nodeProcesses) {
    $nodeProcesses | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped Node.js process (PID: $($_.Id))" -ForegroundColor Gray
    }
} else {
    Write-Host "   No project-related Node.js processes found" -ForegroundColor Gray
}

# Verify everything is stopped
Write-Host "`n✅ Verification:" -ForegroundColor Green
$runningContainers = docker ps --format "{{.Names}}" 2>$null
if ($runningContainers) {
    Write-Host "   ⚠️  Still running containers:" -ForegroundColor Yellow
    $runningContainers | ForEach-Object { Write-Host "      - $_" -ForegroundColor Yellow }
} else {
    Write-Host "   ✓ No Docker containers running" -ForegroundColor Green
}

$portsInUse = Get-NetTCPConnection -LocalPort 3000,8000,5432,5433 -ErrorAction SilentlyContinue
if ($portsInUse) {
    Write-Host "   ⚠️  Ports still in use:" -ForegroundColor Yellow
    $portsInUse | ForEach-Object { 
        Write-Host "      - Port $($_.LocalPort) (State: $($_.State))" -ForegroundColor Yellow 
    }
} else {
    Write-Host "   ✓ All ports (3000, 8000, 5432, 5433) are free" -ForegroundColor Green
}

Write-Host "`n✨ All services stopped!" -ForegroundColor Green


