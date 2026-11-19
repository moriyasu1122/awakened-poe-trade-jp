@echo off
chcp 65001 > nul
cd /d "%~dp0renderer"
echo === renderer build ===
call yarn build || goto :err
cd /d "%~dp0main"
echo === main build ===
call yarn build || goto :err
echo === package ===
call yarn package || goto :err
echo.
echo 完了しました。exe は main\dist にあります。
explorer "%~dp0main\dist"
pause
exit /b 0
:err
echo.
echo エラーで停止しました。この画面をClaudeに見せてください。
pause
exit /b 1
