/** 
*Display message using an info bootstrap modal
*@param {String} message The message to display
*/
let info = message => {
    bootbox.alert({
        title: 'Info',
        className: 'dialog-info',
        message
    });
};

/** 
* Dispay a message using a success bootstrap modal
*@param {Sting} message The message to display
*/

let success = message => {
    bootbox.alert({
        title: 'Success',
        className: 'dialog-success',
        message
    });
};
/**
* Display a message using warning bootstrap modal
*@param {String} message The message to display
*/
let warning = message => {
    bootbox.alert({
        title: 'Warning',
        className: 'dialog-warning',
        message
    });
};
/**
* Display a message using error bootstrap modal
*@param {String} message The message to display
*/
let error = message => {
    bootbox.alert({
        title: 'Error',
        className: 'dialog-error',
        message
    });
};
/**
* Display a confirmation dialog 
* @param {Object} options An object containing the the title of the dialog
* the message of the dialog and a callback to execute after the dialog is closed
*/
let confirm = options => {
    options = Object.assign({}, {
        title: 'Confirm',
        className: 'dialog-warning'
    }, options);
    bootbox.confirm(options);
};
/**
*Replace native confirm with the bootbox one
*/
window.confirm = confirm;
/**
* Convert an rgb color to hex format
*@param {String}color The rgb color
*@returns {String}hexColor The rgb color in hex format
*/
let rgb2hex = color => {
    let hexColor = null;
    if(!color){
        //In case user pass no color
        //return black color
        console.warn(`Be careful.You got the default color because no argument was passed`);
        return `#000000`;
    }
    var rgbValues = color.split("(")[1].split(")")[0].split(",");
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