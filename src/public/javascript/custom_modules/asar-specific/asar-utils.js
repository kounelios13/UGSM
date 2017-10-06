/**
 * @module asar-utils
 */

/**
 * @file A set of methods for solving asar specific issues
 * @author Manos Kounelakis
 */

const fs = require('fs');
const {
    readFileSync
} = fs;

const cssParser = require('css');

/**
 * Convert an image to a base64 string representation
 * @param {String} url The url of the image
 * @returns {String} base64 The base64 string encoding of the image 
 */
function imageToBase64uri(url) {
    let base64 = readFileSync(url,{encoding:"base64"});
    let fileExtension = url.split(".").pop().toLowerCase();
    base64 = `data:image/${fileExtension};base64,${base64}`;
    return base64;
}

/**
* Take the AST representation of a css string
* using the css module and extract the stylesheet
* @param {String} cssTheme The css string we will extract the stylesheet from
* @returns {Object} stylesheet The extracted stylesheet
*/
function extractStylesheet(cssTheme){
    const {stylesheet} = cssParser.parse(cssTheme);
    return stylesheet;
}

/**
* Change all urls to base64 encoded strings inside a stylesheet
* @param {Object} stylesheet The stylesheet which contains the urls to change
*/
function changeUrls(stylesheet) {
    const declarations = [];
    stylesheet.rules.forEach(rule => {
        rule.declarations.filter(declaration => {
            //Make sure that the value contains a url and that this url is not base64 encoded already
            return declaration.value.includes('url') && !declaration.value.includes('data:image');
        }).forEach(declaration => {
            const {
                property,
                value
            } = declaration;
            declarations.push({
                property,
                value
            });
        });
    });
    declarations.forEach(declaration => {
        let partsAfterUrl = declaration.value.split(")")[1];
        let imagePath = declaration.value.split("url(")[1].split(")")[0];
        let base64 = imageToBase64uri(imagePath);
        let fileExtension = imagePath.split(".").pop().toLowerCase();
        let value = `url(${base64}) ${partsAfterUrl}`;
        declaration.value = value;
    });
}

let themesInjected = false;

/**
 * Detect whether the app is running inside an asar archive
 * @returns {Boolean} isAsar whether app is running inside an asar archive or not
 */
function appIsInAsar() {
    const isAsar = process.mainModule.filename.includes('app.asar');
    return isAsar;
}

/**
 * Inject a style tag dedicated to user themes
 * @param {String} id The id of the style tag we want to inject
 * @returns {Object} themeStyleTag The styletag that was created
 */
function injectThemeStyleTag(id) {
    /**
    * @TODO
    * Maybe this function has nothing to do with that module
    * Maybe I should create another module just for functions relevant
    * to ui-settings renderer?(Or should I move that function inside that renderer?)
    */
    themesInjected = true;
    let themeStyleTag = document.getElementById(id);
    if (!themeStyleTag) {
        themeStyleTag = document.createElement('style');
        head.appendChild(themeStyleTag);
    }
    return styleTag;
}

/**
 * Inject a settings specific style tag if it doesn't exist
 * @param {String} id The id of the style tag we want to inject
 */

function injectSettingsStyleTag(id) {
    if (themesInjected) {
        throw new Error('Settings must be injected before user themes');
    }
    let settingsStyleTag = document.getElementById(id);
    if (!settingsStyleTag) {
        settingsStyleTag = document.createElement('style');
        settingsStyleTag.id = id;
        head.appendChild(settingsStyleTag);
    }
}

/**
 * Read the contents of a css file
 * @param {String} file The css file path
 * @returns {String} contents Contentes of the file
 */
function readThemeContents(file) {
    /**
    * @TODO
    * Maybe I should use the async version of readFileSync 
    * and pass a callback function to readThemeContents?
    */
    let contents = readFileSync(file, {
        encoding: 'utf-8'
    });
    return contents;
}

/**
 * Make sure that a css string is asar compatible(images have been base64 encoded)
 * @param {String} css The css string
 * @returns {String} asarStylesheet A css string that is asar compatible
 */
function asarCompatibleStylesheet(css) {

/*    if(!appIsInAsar()){
        return css;
    }*/
    /**
    * For some reason file url coming from background image comes like this ->'"file://foo.jpg"' so the single
    * quotes around double quotes fuck my program :(
    *
    */
    //css = css.replace(/'/g,"");
    //css = css.trim().replace(/"/g,"'").replace(/'/g,"");
    let filePath =css.replace(/"/g,"");// path.join(__dirname,css);
    const stylesheet = extractStylesheet(filePath);
    changeUrls(stylesheet);
    const asarStylesheet = cssParser.stringify(stylesheet);
    return asarStylesheet;
}

/**
 * This function reads a css file and outputs its contents in a new styletag that is injected on the fly
 * @param {String} theme The css file we want to read
 * @param {String} id A unique id that we will use for our new styletag
 * @throws Throws an error if no theme file path is provided
 * @throws Throws an error if no styletag id is provided
 */
function convertThemeToStyleTag(theme, id) {
    if (!arguments.length) {
        throw new Error('Please provide a css file path and an id for the new styletag');
    }
    if (!theme) {
        throw new Error('Please provide a file path');
    }
    if (!id) {
        throw new Error('Please provide an id for the styletag');
    }
    let styleTag = injectThemeStyleTag(id);
    let themeContents = readThemeContents(theme);
    let themeContainsBgImage = themeContents.contains('url');
    if (themeContainsBgImage) {
        themeContents = asarCompatibleStylesheet(themeContents);
    }
    styleTag.innerHTML = themeContents;
}

module.exports = {
    appIsInAsar,
    injectSettingsStyleTag,
    asarCompatibleStylesheet,
    convertThemeToStyleTag
};