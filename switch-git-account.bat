@echo off
echo ========================================
echo    GitHub Account Switcher
echo ========================================
echo.
echo Choose your account:
echo 1. Personal Account (anuparashar0507)
echo 2. Work Account (anupam@lyzr.ai)
echo 3. Show Current Config
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Switching to Personal Account...
    git config --local user.name "anuparashar0507"
    git config --local user.email "anuparashar0507@gmail.com"
    echo ✓ Switched to Personal Account
    echo.
    echo Current config:
    git config --local user.name
    git config --local user.email
) else if "%choice%"=="2" (
    echo.
    echo Switching to Work Account...
    git config --local user.name "Anupam Parashar"
    git config --local user.email "anupam@lyzr.ai"
    echo ✓ Switched to Work Account
    echo.
    echo Current config:
    git config --local user.name
    git config --local user.email
) else if "%choice%"=="3" (
    echo.
    echo Current Git Configuration:
    echo =========================
    echo User Name: 
    git config --local user.name
    echo User Email: 
    git config --local user.email
    echo.
    echo Global Git Configuration:
    echo ========================
    echo User Name: 
    git config --global user.name
    echo User Email: 
    git config --global user.email
) else (
    echo Invalid choice! Please run the script again.
)

echo.
pause
