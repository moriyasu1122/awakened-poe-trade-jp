@echo off
setlocal enabledelayedexpansion

rem =====================================================================
rem  Awakened PoE Trade - Japanese localization patch tool
rem  Usage: apply_ja_patch.bat "path to the app folder"
rem  (the folder that contains a "resources" subfolder)
rem  Or just double-click and drag the folder into the window when asked.
rem =====================================================================

set BASE_DIR=%~dp0
set ASAR_CLI=%BASE_DIR%main\node_modules\.bin\asar.cmd
set JA_DATA=%BASE_DIR%renderer\public\data\ja

if not exist "%ASAR_CLI%" (
  echo [ERROR] asar tool not found: %ASAR_CLI%
  echo Please run "yarn install" in the main folder first.
  pause
  exit /b 1
)

if not exist "%JA_DATA%" (
  echo [ERROR] Japanese data folder not found: %JA_DATA%
  pause
  exit /b 1
)

set TARGET=%~1

if not defined TARGET (
  echo Please drag and drop the Awakened PoE Trade folder onto this window
  echo (the folder that contains a "resources" subfolder), then press Enter.
  echo.
  set /p TARGET=Folder path:
  set TARGET=!TARGET:"=!
)

if not defined TARGET (
  echo No path was given. Exiting.
  pause
  exit /b 1
)

echo.
echo Target folder: %TARGET%
echo.
set ASAR_FILE=%TARGET%\resources\app.asar
set BACKUP_FILE=%TARGET%\resources\app.asar.original-backup

if not exist "%ASAR_FILE%" (
  echo [ERROR] Not found: %ASAR_FILE%
  echo Please check that the folder contains resources\app.asar
  pause
  exit /b 1
)

if exist "%BACKUP_FILE%" goto :skip_backup
echo Backing up the original file...
copy "%ASAR_FILE%" "%BACKUP_FILE%" >nul
goto :after_backup
:skip_backup
echo Backup already exists, skipping.
:after_backup

set WORKDIR=%TEMP%\apt_ja_patch_work
if exist "%WORKDIR%" rmdir /s /q "%WORKDIR%"

echo Extracting the app...
call "%ASAR_CLI%" extract "%ASAR_FILE%" "%WORKDIR%"
if errorlevel 1 goto :error

echo Applying Japanese data...
xcopy /s /y /i "%JA_DATA%" "%WORKDIR%\data\ja" >nul
if errorlevel 1 goto :error

echo Repacking the app...
del "%ASAR_FILE%"
call "%ASAR_CLI%" pack "%WORKDIR%" "%ASAR_FILE%"
if errorlevel 1 goto :error

rmdir /s /q "%WORKDIR%"

echo.
echo ================================
echo   Done!
echo   Please launch the app to check.
echo   Target: %TARGET%
echo   (To restore the original English version, rename
echo    app.asar.original-backup back to app.asar
echo    inside the resources folder)
echo ================================
pause
exit /b 0

:error
echo.
echo [ERROR] Something went wrong. See the messages above.
pause
exit /b 1
