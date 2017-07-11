let info = message =>{
    bootbox.alert({
        title:'Info',
        className:'dialog-info',
        message
    });
};
let success = message =>{
    bootbox.alert({
        title:'Success',
        className:'dialog-success',
        message
    });
};
let warning = message =>{
    bootbox.alert({
        title:'Warning',
        className:'dialog-warning',
        message
    });
};
let error = message =>{
    bootbox.alert({
        title:'Error',
        className:'dialog-error',
        message
    })
};
//@TODO
//rewrite arguments asdestructured object
let confirm = (options)=>{
    options = Object.assign({},{
        title:'Confirm',
        className:'dialog-warning'
    },options);
    bootbox.confirm(options);
};
let rgb2hex = color =>{
    return color;
};
module.exports = {
    info,
    success,
    warning,
    error,
    confirm,
    rgb2hex
};
