@echo off
echo.
echo ============================================
echo  PUBLISH FIRESTORE RULES - TwoFrames
echo ============================================
echo.
echo 1. Open this link in your browser:
echo    https://console.firebase.google.com/project/twoframes/firestore/rules
echo.
echo 2. Select ALL existing rules and DELETE them
echo.
echo 3. Open the file: firebase\firestore.rules
echo    Copy ALL contents and paste into the editor
echo.
echo 4. Click PUBLISH
echo.
echo 5. Refresh the app and try connecting again
echo.
echo Or run from terminal (after: firebase login):
echo    firebase deploy --only firestore:rules --project twoframes
echo.
pause
