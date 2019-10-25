// Taken from https://gist.github.com/EvidentlyCube/b30e97864824bcfcce3401a6c4c1e7f4
// Modified to allow it to run outside scripts, because otherwise
//  setTimeout would cause a stack overflow
// Adding that option then made me have to remove the part with the filter
//  and forEach because it was trying to assign read-only properties,
//  and removing it didn't seem to break anything anyways

/**
 * Adapted from https://github.com/rstacruz/jsdom-global
 * Make sure this file is registered when running tests by adding this to the command with which you run mocha:
 * -r <path>/hookJsdom.js
 */
const JSDOM = require( 'jsdom' ).JSDOM;

const jsdomOptions = {
    url: 'http://localhost/',
    runScripts: "outside-only"
};

const jsdomInstance = new JSDOM( '', jsdomOptions );
const { window } = jsdomInstance;

/*
Object.getOwnPropertyNames( window )
    .filter( property => !property.startsWith( '_' ) )
    .forEach( key => global[key] = window[key] );
*/

global.window = window;
window.console = global.console;
