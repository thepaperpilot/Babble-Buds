// Taken from https://gist.github.com/EvidentlyCube/b30e97864824bcfcce3401a6c4c1e7f4

/**
 * Adapted from https://github.com/rstacruz/jsdom-global
 * Make sure this file is registered when running tests by adding this to the command with which you run mocha:
 * -r <path>/hookJsdom.js
 */
const JSDOM = require( 'jsdom' ).JSDOM;

const jsdomOptions = {
    url: 'http://localhost/'
};

const jsdomInstance = new JSDOM( '', jsdomOptions );
const { window } = jsdomInstance;

Object.getOwnPropertyNames( window )
    .filter( property => !property.startsWith( '_' ) )
    .forEach( key => global[key] = window[key] );

global.window = window;
window.console = global.console;
