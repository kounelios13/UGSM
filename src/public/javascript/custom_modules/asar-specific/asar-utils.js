/**
 * @module asar-utils
 */

/**
 * @file A set of methods for solving asar specific issues
 * @author Manos Kounelakis
 */

const fs = require('fs');
const path = require('path');
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
    let base64 = null;

    try {
        base64 = readFileSync(url, {
            encoding: "base64"
        });
    } catch (e) {
        console.warn(e.message);
        return base64;
    }
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
function extractStylesheet(cssTheme) {
    const {
        stylesheet
    } = cssParser.parse(cssTheme);
    return stylesheet;
}

/**
 * Change all urls to base64 encoded strings inside a stylesheet
 * @param {Object} stylesheet The stylesheet which contains the urls to change
 * @param {String} stylesheetFilePath This is the full path to the css file that contains our stylesheet
 */
function changeUrls(stylesheet, stylesheetFilePath) {
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
        imagePath = convertRelativeToAbsoluteUrl(imagePath, stylesheetFilePath);
        let base64 = imageToBase64uri(imagePath);
        let fileExtension = imagePath.split(".").pop().toLowerCase();
        let value = `url(${base64}) ${partsAfterUrl}`;
        declaration.value = value;
    });
}

/**
 * Detect whether the app is running inside an asar archive
 * @returns {Boolean} isAsar whether app is running inside an asar archive or not
 */
function appIsInAsar() {
    const {filename} = process.mainModule;
    const isAsar = filename.includes('app.asar');
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
    let themeStyleTag = document.getElementById(id);
    if (!themeStyleTag) {
        themeStyleTag = document.createElement('style');
        //Assign a unique data attribute 
        //This will help us when injecting user settings
        themeStyleTag.setAttribute('theme-style-tag-injected', true);
        document.head.appendChild(themeStyleTag);

    }
    return themeStyleTag;
}

/**
 * Inject a settings specific style tag if it doesn't exist
 * @param {String} id The id of the style tag we want to inject
 */

function injectSettingsStyleTag(id) {
    let themeStyleTag = document.querySelector('[data-theme-style-tag-injected]');

    let settingsStyleTag = document.getElementById(id);
    if (!settingsStyleTag) {
        settingsStyleTag = document.createElement('style');
        settingsStyleTag.id = id;
        if (themeStyleTag) {
            //We always want to load user settings before themes
            document.head.insertBefore(themeStyleTag, settingsStyleTag);
        } else {
            document.head.appendChild(settingsStyleTag);
        }
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
    let contents = null;
    try {
        contents = readFileSync(file, {
            encoding: 'utf-8'
        });
    } catch (e) {
        console.log('Failed to parse theme:', e.message);
    }
    return contents;
}

/**
 * Make sure that a css string is asar compatible(images have been base64 encoded)
 * @param {String} css The css string
 * @param [String] themeFullPath A full path to a css file
 * @returns {String} asarStylesheet A css string that is asar compatible
 */
function asarCompatibleStylesheet(css, themeFullPath) {
    if (!appIsInAsar()) {
        //No need to procceed .
        return css;
    }
    const stylesheet = extractStylesheet(css);
    changeUrls(stylesheet, themeFullPath);
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
    //@TODO 
    //I think that using themeContents.includes() break the app in production
    //Investigate more
    let themeContainsBgImage = themeContents.indexOf('url') != -1;
    if (themeContainsBgImage) {
        //Pass the full path of the theme.We might need it
        //to be able to use the full path of the background images 
        //we want to encode
        themeContents = asarCompatibleStylesheet(themeContents, theme);
    }
    styleTag.innerHTML = themeContents;
}
/**
 * Convert a file path from relative to absolute
 * When we import a css file that might have a url
 * that url wil not work since it might be relative to the location 
 * of the css file .So trying to use it from our app will 
 * throw a file not found error
 * @param {String} filePath The filepath we want to convert 
 * @param {String} cssDir A directory which contaings our css file
 * @returns {String} absolutePath 
 */
function convertRelativeToAbsoluteUrl(filePath, cssDir) {
    let absolutePath = null;
    let urlRegex = new RegExp("(http|ftp|https)://[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?");
    if (urlRegex.test(filePath)) {
        absolutePath = filepath;
    } else if (path.isAbsolutePath(filePath) && fs.existsSync(filePath)) {
        absolutePath = filePath;
    } else {
        absolutePath = path.join(cssDir, filePath);
    }
    return absolutePath;
}

module.exports = {
    appIsInAsar,
    injectSettingsStyleTag,
    asarCompatibleStylesheet,
    convertThemeToStyleTag
};