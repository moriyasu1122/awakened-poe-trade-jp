@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo === 部品のインストール ===
call npm install || goto :err
echo === Modの説明文を取得 (ログは export_log.txt) ===
node export-stat-descriptions.mjs > export_log.txt 2>&1
set RC=%ERRORLEVEL%
type export_log.txt
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
