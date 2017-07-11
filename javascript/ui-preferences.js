const {
    ipcRenderer
} = require('electron');
const {success,warning,rgb2hex} = require('../custom_modules/utils.js');
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
    var cellFontSizeSlider = document.getElementById('cell-font-size');
    //Check if there are any user preferences to load
    let userPrefs = JSON.parse(localStorage.getItem('ui-preferences'));
    if(userPrefs){
        //Good 
        //Loaded user preferences.Now apply them
        //@TODO
        //Load font and change the corresponding
        //select box
        let tableCellSize = userPrefs['table-cell-size'] || 14;
        let textColor = userPrefs['color'];
        console.log(textColor)
        cellFontSizeSlider.value = tableCellSize;
        $("html,body").css(userPrefs);
        $("table").css("font-size",`${tableCellSize}px`);
        //This fails
        //Reason textColor is in rgb format while 
        //color input type accepts hex format colors(e.g. #aabbcc)
        $("#color-selection").val(rgb2hex(textColor));
    }
    fonts.forEach(f => {
        let option = document.createElement('option');
        option.innerText = f;
        fragment.appendChild(option);
    });
    fontList.appendChild(fragment);
    $("#select-bg").on("click",function(){
        ipcRenderer.send('show-open-dialog')
    });
    $(fontList).on("change",function(){
        let font = $(this).val();
        $("html,body").css("font-family", font);
    });
    $(cellFontSizeSlider).on('mousemove input',function(){
        let size = `${$(this).val()}px`;
        $("td").css('font-size',size);
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
            "color":$("body,html").css("color"),
            "table-cell-size":$(cellFontSizeSlider).val()
        };
        ipcRenderer.send('apply-ui-settings',cssData);
        //Let's save our css properties to localStorage
        localStorage.setItem('ui-preferences',JSON.stringify(cssData));
    });
    $("#delete-settings").on("click",function(){
        confirm({
            message:'Are you sure you want to clear your ui preferences?',
            callback:(answer)=>{
                if(answer){
                    localStorage.removeItem('ui-preferences');
                    success('UI preferences cleared.Please restart application');
                }
            }
        });
    });
})
