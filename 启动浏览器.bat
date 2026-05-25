@echo off
chcp 65001 >nul
title SQLite 数据库浏览器
echo 正在启动 SQLite 数据库浏览器...
echo.
node "%~dp0server.cjs" %*
pause
