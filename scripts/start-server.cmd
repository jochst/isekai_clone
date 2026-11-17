@echo off
rem Runs the app in production mode for the Cloudflare Tunnel (docs/DEPLOY.md), started at logon by Task Scheduler.
rem It listens on 127.0.0.1:3000 only: other machines reach it through the tunnel and Cloudflare Access, never directly.
rem Output goes to data\server.log. After pulling new code, run "npm run build" once, then restart this task.
cd /d "%~dp0.."
if not exist data mkdir data
if not exist .next\BUILD_ID call npm run build >> data\server.log 2>&1
rem Stopping the task leaves the old node process holding port 3000 (it runs in session 0), so end it here before serving.
rem The old process also holds server.log open, so this cannot log there; the ping is a short wait for it to let go.
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":3000 .*LISTENING"') do (taskkill /PID %%p /T /F >nul 2>&1 & ping -n 4 127.0.0.1 >nul)
call npm run serve >> data\server.log 2>&1
