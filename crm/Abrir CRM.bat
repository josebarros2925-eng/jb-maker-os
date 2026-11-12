@echo off
chcp 65001 >nul
title CRM JB Maker
cd /d "%~dp0app"
if not exist node_modules (
  echo Instalando o CRM pela primeira vez...
  call npm install --silent
)
node server.mjs --abrir
pause
