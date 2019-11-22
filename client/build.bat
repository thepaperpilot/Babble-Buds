setlocal
cd build && call npm install
endlocal
md build\.public
move build\* build\.public\
move build\icons build\.public\
move build\static build\.public\
rename build\.public public
move build\public\package.json build\
robocopy src build\public\ electron-starter.js
robocopy src\main-process build\public\main-process /E
robocopy src\background build\public\background /E
robocopy src\data build\public\data /E
robocopy src\empty-project build\public\empty-project /E
robocopy src\sample-project build\public\sample-project /E
robocopy node_modules build\node_modules /E
exit 0
