@echo off
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  py -3 download_wikimedia_images.py
) else (
  where python >nul 2>&1
  if %errorlevel%==0 (
    python download_wikimedia_images.py
  ) else (
    echo Python 3 is required. Install Python and run again.
  )
)
echo.
echo If all 13 images downloaded, upload the files to your website.
pause
