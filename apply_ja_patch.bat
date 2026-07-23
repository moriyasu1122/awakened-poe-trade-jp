@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul

rem =====================================================================
rem  Awakened PoE Trade 日本語化パッチ適用ツール
rem  使い方: apply_ja_patch.bat "パッチを当てたいアプリのフォルダ"
rem  (resources フォルダがある場所を指定してください)
rem =====================================================================

set BASE_DIR=%~dp0
set ASAR_CLI=%BASE_DIR%main\node_modules\.bin\asar.cmd
set JA_DATA=%BASE_DIR%renderer\public\data\ja

if not exist "%ASAR_CLI%" (
  echo [エラー] asarツールが見つかりません: %ASAR_CLI%
  echo main フォルダで一度 "yarn install" を実行してから、このツールを使ってください。
  pause
  exit /b 1
)

if not exist "%JA_DATA%" (
  echo [エラー] 日本語データフォルダが見つかりません: %JA_DATA%
  pause
  exit /b 1
)

set TARGET=%~1

if "%TARGET%"=="" (
  echo インストール先を自動検索しています...

  for %%P in (
    "%LOCALAPPDATA%\Programs\awakened-poe-trade"
    "%LOCALAPPDATA%\Programs\Awakened PoE Trade"
    "%ProgramFiles%\Awakened PoE Trade"
    "%ProgramFiles(x86)%\Awakened PoE Trade"
  ) do (
    if exist "%%~P\resources\app.asar" (
      set TARGET=%%~P
    )
  )
)

if "%TARGET%"=="" (
  echo 自動検出できませんでした。
  echo.
  echo Awakened PoE Trade がインストールされている^(または展開されている^)
  echo フォルダをこのウィンドウにドラッグ^&ドロップして Enter を押してください。
  echo ^(フォルダの中に resources フォルダがある場所です^)
  echo.
  set /p TARGET=フォルダのパス:
  set TARGET=!TARGET:"=!
)

if "%TARGET%"=="" (
  echo パスが入力されなかったため終了します。
  pause
  exit /b 1
)

echo.
echo 対象フォルダ: %TARGET%
echo.
set ASAR_FILE=%TARGET%\resources\app.asar
set BACKUP_FILE=%TARGET%\resources\app.asar.original-backup

if not exist "%ASAR_FILE%" (
  echo [エラー] %ASAR_FILE% が見つかりません。
  echo 指定したフォルダの中に resources\app.asar があるか確認してください。
  pause
  exit /b 1
)

if not exist "%BACKUP_FILE%" (
  echo オリジナルファイルをバックアップしています...
  copy "%ASAR_FILE%" "%BACKUP_FILE%" >nul
) else (
  echo ^(オリジナルのバックアップは既に存在するのでスキップします^)
)

set WORKDIR=%TEMP%\apt_ja_patch_work
if exist "%WORKDIR%" rmdir /s /q "%WORKDIR%"

echo アプリを展開しています...
call "%ASAR_CLI%" extract "%ASAR_FILE%" "%WORKDIR%"
if errorlevel 1 goto :error

echo 日本語データを適用しています...
xcopy /s /y /i "%JA_DATA%" "%WORKDIR%\data\ja" >nul
if errorlevel 1 goto :error

echo パッケージを再構築しています...
del "%ASAR_FILE%"
call "%ASAR_CLI%" pack "%WORKDIR%" "%ASAR_FILE%"
if errorlevel 1 goto :error

rmdir /s /q "%WORKDIR%"

echo.
echo ================================
echo   完了しました！
echo   "%TARGET%" のアプリを起動して確認してください。
echo   (元の英語版に戻したい場合は、resources フォルダ内の
echo    app.asar.original-backup を app.asar にリネームし直してください)
echo ================================
pause
exit /b 0

:error
echo.
echo [エラー] 処理中に問題が発生しました。上のメッセージを確認してください。
pause
exit /b 1
