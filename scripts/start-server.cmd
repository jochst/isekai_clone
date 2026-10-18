@echo off
rem Runs the app in production mode for the Cloudflare Tunnel (docs/DEPLOY.md), started at logon by Task Scheduler.
rem It listens on 127.0.0.1:3000 only: other machines reach it through the tunnel and Cloudflare Access, never directly.
rem Output goes to data\server.log. After pulling new code, run "npm run build" once, then restart this task.
cd /d "%~dp0.."
if not exist data mkdir data
if not exist .next\BUILD_ID call npm run build >> data\server.log 2>&1
call npm run serve >> data\server.log 2>&1
