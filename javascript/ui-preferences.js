const {
    ipcRenderer
} = require('electron');
const Binder = require('../classes/binder.js');
const SystemFontManager = require('system-font-families').default;
const fonts = new SystemFontManager().getFontsSync();
var fragment = document.createDocumentFragment();
var ipcRendererBinder = new Binder(ipcRenderer,{
    'receive-selected-image':(event,data)=>{
        $("body").css({background:`url(${data}) no-repeat center center fixed`,"background-size":"cover"})
    }
});
$(document).ready(function() {
    var fontList = document.getElementById('font-list');
    fonts.forEach(f => {
        let option = document.createElement('option');
        option.innerText = f;
        fragment.appendChild(option);
    });
    fontList.appendChild(fragment)
    $("#select-bg").on("click",function(){
        ipcRenderer.send('show-open-dialog')
    })
    $(fontList).on("change",function(){
        let font = $(this).val();
        $("html,body").css("font-family", font);
    });
    $("#color-selection").on("input",function(){
        let c = $(this).val();
        $("html,body").css("color",c)
    });
    $("#apply").on("click",function(){
        let cssData = {
            background:$("body").css("background"),
            "background-size":"cover",
            "font-family":$("body,html").css("font-family"),
            "color":$("body,html").css("color")
        };
        ipcRenderer.send('apply-ui-settings',cssData);
        //Let's save our css properties to localStorage
        localStorage.setItem('ui-preferences',JSON.stringify(cssData));
    });
    $("#delete-settings").on("click",function(){
        bootbox.confirm({
            title:"Warning",
            message:"Are you sure you want to clear your ui preferences?",
            callback:(answer)=>{
                if(answer){
                    localStorage.removeItem("ui-preferences");
                    bootbox.alert({
                        title:"Success",
                        message:"UI preferences cleared.Please restart application",
                        className:"dialog-success"
                    });
                }
            },
            className:"dialog-warning"
        });
    });
})
