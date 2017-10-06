/**
 * @module utils
 */

/**
 * @file A set of ui and color utilities
 * @author Manos Kounelakis
 */

//@TODO
//All functions related to Bootstrap should accept an option callback as 2nd argument 
/** 
 * @memberof utils
 *Display message using an info bootstrap modal
 *@example <caption> Displaya hello folks message </caption>
 *info('Hello folks');
 *@param {String} message The message to display
 */
const info = message => {
    bootbox.alert({
        title: 'Info',
        className: 'dialog-info',
        message
    });
};

/** 
 * Dispay a message using a success bootstrap modal
 *@example <caption> Display 'Download completed' </caption>
 *success('Download completed');
 *@param {Sting} message The message to display
 */

const success = message => {
    bootbox.alert({
        title: 'Success',
        className: 'dialog-success',
        message
    });
};

/**
 * Display a message using warning bootstrap modal
 *@example <caption> Display `Your OS won't get any updates after 2020.`</caption>
 *warning(`Your OS won't get any updates after 2020.`);
 *@param {String} message The message to display
 */

const warning = message => {
    bootbox.alert({
        title: 'Warning',
        className: 'dialog-warning',
        message
    });
};

/**
 * Display a message using error bootstrap modal
 *@example <caption>Display 'Failed to update your system'</caption>
 *error('Failed to update your system');
 *@param {String} message The message to display
 */

const error = message => {
    bootbox.alert({
        title: 'Error',
        className: 'dialog-error',
        message
    });
};

/**
 * Display a confirmation dialog 
 * @example <caption> Simple exit confirmation dialog</caption>
 * confirm({
 *   title: 'Warning',
 *    message: 'Are you sure you want to exit?',
 *    callback: (answer) => { 
 *        if (answer) { 
 *           //Handle exit
 *            
 *        } else {
 *           //Handle rejection
 *        } 
 *    }
 *});
 * @param {Object} options An object containing the the title of the dialog
 * the message of the dialog and a callback to execute after the dialog is closed
 */

const confirm = options => {
    options = Object.assign({}, {
        title: 'Confirm',
        className: 'dialog-warning'
    }, options);
    bootbox.confirm(options);
};

/**
 * Convert an rgb color to hex format
 * @example <caption> Convert rgb(255,255,255) to hex </caption>
 * var hexColor = rgb2hex('rgb(255,255,255)'); 
 * console.log(hexColor); //Logs '#ffffff'
 *@param {String} color The rgb color
 *@returns {String} hexColor The rgb color in hex format
 */

const rgb2hex = color => {
    let hexColor = null;
    if (color === undefined || color === null || !color.includes('rgb(')) {
        throw new Error('Please pass a valid rgb color');
    }
    const rgbValues = color.split("(")[1].split(")")[0].split(",");
    hexColor = `#` + rgbValues.map(col => {
        //Covnvert each rgb value to hex format
        //E.g. 255 --> ff
        col = parseInt(col).toString(16);
        //make sure that hex value is not single character
        //e.g. 9 becomes 09
        return (col.length == 1) ? `0${col}` : col;
    }).join('');
    return hexColor;
};

module.exports = {
    info,
    success,
    warning,
    error,
    confirm,
    rgb2hex
};