const {
    ipcRenderer
} = require('electron');
const {
    success,
    warning,
    rgb2hex
} = require('../custom_modules/utils.js');
const Binder = require('../classes/binder.js');
const SystemFontManager = require('system-font-families').default;
const fonts = new SystemFontManager().getFontsSync();
var fragment = document.createDocumentFragment();
var ipcRendererBinder = new Binder(ipcRenderer, {
    'receive-selected-image': (event, data) => {
        $("body").css({
            background: `url(${data}) no-repeat center center fixed`,
            "background-size": "cover"
        });
    }
});
$(document).ready(function() {
    var fontList = document.getElementById('font-list');
    var cellFontSizeSlider = document.getElementById('cell-font-size');
    //Check if there are any user preferences to load
    let userPrefs = JSON.parse(localStorage.getItem('ui-preferences'));
    //First create the select box
    fonts.forEach(f => {
        let option = document.createElement('option');
        option.innerText = f;
        fragment.appendChild(option);
    });
    fontList.appendChild(fragment);
    //Now you can check for preferences and select  saved font from font-list
    if (userPrefs) {
        //Good 
        //Loaded user preferences.Now apply them
        let tableCellSize = userPrefs['table-cell-size'] || 14;
        let textColor = userPrefs['color'];
        let bgColor = userPrefs['background-color'];
        let fontName = userPrefs['font-family'];
        let fontIndex = fonts.indexOf(fontName);
        if (fontIndex != -1) {
            fontList[fontIndex].selected = true;
        }
        cellFontSizeSlider.value = tableCellSize;
        $("body").css(userPrefs);
        $("table").css("font-size", `${tableCellSize}px`);
        //Use only hex colors
        $("#text-color-selection").val(rgb2hex(textColor));
        $("#bg-color-selection").val(rgb2hex(bgColor));
    }
    $("#select-bg-image").on("click", function() {
        ipcRenderer.send('show-open-dialog')
    });
    $(fontList).on("change", function() {
        let font = $(this).val();
        $("body").css("font-family", font);
    });
    $(cellFontSizeSlider).on('mousemove input', function() {
        let size = `${$(this).val()}px`;
        $("td").css('font-size', size);
    });
    $("#text-color-selection").on("input", function() {
        let c = $(this).val();
        $("body").css("color", c);
    });
    $('#bg-color-selection').on("input",function(){
        let c = $(this).val();
        $("body").css("background-color",c);
    });
    $("#apply").on("click", function() {
        let cssData = {
            background: $("body").css("background"),
            "background-size": "cover",
            "font-family": $("body").css("font-family"),
            "color": $("body").css("color"),
            "background-color":$("body").css("background-color"),
            "table-cell-size": $(cellFontSizeSlider).val()
        };
        ipcRenderer.send('apply-ui-settings', cssData);
        //Let's save our css properties to localStorage
        localStorage.setItem('ui-preferences', JSON.stringify(cssData));
        success('User preferences have been saved');
    });
    $("#delete-settings").on("click", function() {
        confirm({
            message: 'Are you sure you want to clear your ui preferences?',
            callback: (answer) => {
                if (answer) {
                    localStorage.removeItem('ui-preferences');
                    success('UI preferences cleared.Please restart application');
                }
            }
        });
    });
});