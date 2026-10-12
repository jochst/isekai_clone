@echo off
rem Nightly Isekai Zero update, run by Windows Task Scheduler. Output goes to data\isekaizero\nightly.log.
cd /d "%~dp0.."
if not exist data\isekaizero mkdir data\isekaizero
call npm run update:isekaizero >> data\isekaizero\nightly.log 2>&1
