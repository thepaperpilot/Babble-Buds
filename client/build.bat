move popout-build\index.html build\popout-index.html
robocopy popout-build\static\js build\static\js > NUL
del /q/s popout-build > NUL
rmdir /q/s popout-build
setlocal
cd build && call npm install
endlocal
md build\.public
move build\* build\.public\
move build\icons build\.public\
move build\static build\.public\
rename build\.public public
move build\public\package.json build\
robocopy src build\public\ electron-starter.js > NUL
robocopy src\main-process build\public\main-process /E > NUL
robocopy src\background build\public\background /E > NUL
robocopy src\data build\public\data /E > NUL
robocopy src\empty-project build\public\empty-project /E > NUL
robocopy src\sample-project build\public\sample-project /E > NUL
robocopy node_modules build\node_modules /E > NUL
exit 0
