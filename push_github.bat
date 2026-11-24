@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo === GitHub に送信します ===
git push origin master > push_log.txt 2>&1
set RC=%ERRORLEVEL%
type push_log.txt
if not "%RC%"=="0" goto :err
echo.
echo 完了しました。この画面は閉じてかまいません。
pause
exit /b 0
:err
echo.
echo エラーで停止しました。この画面は閉じてかまいません。
pause
exit /b 1
