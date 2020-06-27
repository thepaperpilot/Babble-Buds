mv popout-build/index.html build/popout-index.html
cp -r popout-build/static/js build/static/js
rm -R popout-build
(cd build; npm install)
mkdir build/.public
mv build/* build/.public
mv build/.public build/public
mv build/public/package.json build
cp src/electron-starter.js build/public
cp -r src/main-process build/public
cp -r src/background build/public
cp -r src/data build/public
cp -r src/empty-project build/public
cp -r src/sample-project build/public
cp -r node_modules build
