Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    GitHub Account Switcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Choose your account:" -ForegroundColor Yellow
Write-Host "1. Personal Account (anuparashar0507)" -ForegroundColor White
Write-Host "2. Work Account (anupam@lyzr.ai)" -ForegroundColor White
Write-Host "3. Show Current Config" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-3)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Switching to Personal Account..." -ForegroundColor Green
        git config --local user.name "anuparashar0507"
        git config --local user.email "anuparashar0507@gmail.com"
        Write-Host "✓ Switched to Personal Account" -ForegroundColor Green
        Write-Host ""
        Write-Host "Current config:" -ForegroundColor Yellow
        git config --local user.name
        git config --local user.email
    }
    "2" {
        Write-Host ""
        Write-Host "Switching to Work Account..." -ForegroundColor Green
        git config --local user.name "Anupam Parashar"
        git config --local user.email "anupam@lyzr.ai"
        Write-Host "✓ Switched to Work Account" -ForegroundColor Green
        Write-Host ""
        Write-Host "Current config:" -ForegroundColor Yellow
        git config --local user.name
        git config --local user.email
    }
    "3" {
        Write-Host ""
        Write-Host "Current Git Configuration:" -ForegroundColor Yellow
        Write-Host "=========================" -ForegroundColor Yellow
        Write-Host "User Name: " -NoNewline
        git config --local user.name
        Write-Host "User Email: " -NoNewline
        git config --local user.email
        Write-Host ""
        Write-Host "Global Git Configuration:" -ForegroundColor Yellow
        Write-Host "========================" -ForegroundColor Yellow
        Write-Host "User Name: " -NoNewline
        git config --global user.name
        Write-Host "User Email: " -NoNewline
        git config --global user.email
    }
    default {
        Write-Host "Invalid choice! Please run the script again." -ForegroundColor Red
    }
}

Write-Host ""
Read-Host "Press Enter to continue"
