/**
 * @file A set of methods for solving asar specific issues
 * @author Manos Kounelakis
 */

/**
 * @module asar-detect
 */


const {
    getElementById,
    createElement,
    head,
    body
} = document;

/**
 * Detect whether the app is running inside an asar archive
 * @returns {Boolean}isAsar whether app is running inside an asar archive or not
 */
function appIsInAsar() {
    const isAsar = process.mainModule.filename.includes('app.asar');
    return isAsar;
}

/**
* Inject a style tag dedicated to user themes
* @param {String}id The id of the style tag we want to inject
*/
function injectThemeStyleTag(id){
    let themeStyleTag = document.getElementById(id);
    if(!themeStyleTag){
        themeStyleTag = createElement('style')
    }
}

/**
* Inject a settings specific style tag if it doesn't exist
* @param {String}id The id of the style tag we want to inject
*/

function injectSettingsStyleTag(id) {
    let settingsStyleTag = getElementById(id);
    if(!settingsStyleTag){
        settingsStyleTag = createElement('style');
        settingsStyleTag.id = id;
        head.appendChild(settingsStyleTag);
    }
}
module.exports = {
    appIsInAsar,
    injectSettingsStyleTag
};