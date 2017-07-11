let info = message => {
    bootbox.alert({
        title: 'Info',
        className: 'dialog-info',
        message
    });
};
let success = message => {
    bootbox.alert({
        title: 'Success',
        className: 'dialog-success',
        message
    });
};
let warning = message => {
    bootbox.alert({
        title: 'Warning',
        className: 'dialog-warning',
        message
    });
};
let error = message => {
    bootbox.alert({
        title: 'Error',
        className: 'dialog-error',
        message
    })
};
//@TODO
//rewrite arguments as destructured object
let confirm = options => {
    options = Object.assign({}, {
        title: 'Confirm',
        className: 'dialog-warning'
    }, options);
    bootbox.confirm(options);
};
window.confirm = confirm;
let rgb2hex = color => {
    var rgbValues = color.split("(")[1].split(")")[0].split(",");
    return `#` + rgbValues.map(col => {
        //Covnvert each rgb value to hex format
        //E.g. 255 --> ff
        col = parseInt(col).toString(16);
        //make sure that hex value is not single character
        //e.g. a becomes 09
        return (col.length == 1) ? `${0}col` : col;
    }).join('');
};
module.exports = {
    info,
    success,
    warning,
    error,
    confirm,
    rgb2hex
};