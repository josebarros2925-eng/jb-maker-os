@echo off
chcp 65001 >nul
title Instalar JB Maker
echo Instalando as dependencias do CRM...
cd /d "%~dp0crm\app" && call npm install
echo.
echo Instalando o render (Playwright) para carrosseis e videos...
cd /d "%~dp0scripts\render" && call npm install && call npx playwright install chromium
echo.
echo Pronto. Abra a pasta no VS Code, abra o Claude Code e digite /instalar
pause
