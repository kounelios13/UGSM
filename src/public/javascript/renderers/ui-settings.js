const {
    ipcRenderer
} = require('electron');
const {
    success,
    warning,
    error,
    confirm,
    rgb2hex
    //Path must be relative to views folder
} = require('../javascript/custom_modules/utils.js');

const SystemFontManager = require('system-font-families').default;
const ThemeManagerBuilder = require('../javascript/classes/theme-manager.js');
const themeManager = new ThemeManagerBuilder(JSON.parse(localStorage.getItem('theme-manager-files')));
const fonts = new SystemFontManager().getFontsSync();
const fragment = document.createDocumentFragment();

ipcRenderer.on('receive-selected-image', (event, data) => {
    //We need to make sure that image path does not contain
    //spaces .Spaces in file path do break css code
    //Also in css() use "background" instead of "background-image"
    //Because if image path contains spaces even after replacing them 
    //the code won't work
    data = data.replace(/ /g, '%20');
    $("body").css({
        "background": `url(${data}) no-repeat center center fixed`,
        "background-size": "cover"
    });
});

ipcRenderer.on('export-status', (event, data) => {
    //Time to see whether we succeed 
    //to export our ui settings as a theme or not
    if (data.fileExported) {
        if (data.permissionsChanged) {
            success('Your ui settings have been exported as a UGSM theme');
        } else {
            warning('Your ui settings have been exported as a UGSM theme.However this theme will be read only which means no editable');
        }
    } else {
        let message = `
                Couldn't export your ui settings as a UGSM theme.See error log below
                <textarea class='form-control text-danger'>${data.error}</textarea>
            `;
        error(message);
    }
});

ipcRenderer.on('update-ui-settings-theme', (event, data) => {
    themeManager.setSelectedTheme(data);
    themeManager.applySelectedTheme();
});

$(document).ready(function() {
    themeManager.applySelectedTheme();
    const fontList = document.getElementById('font-list');
    const cellFontSizeSlider = document.getElementById('cell-font-size');
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
        try {
            $("#text-color-selection").val(rgb2hex(textColor));
            $("#bg-color-selection").val(rgb2hex(bgColor));
        } catch (e) {
            if (e.message != 'Please pass a valid rgb color') {
                throw e;
            }
        }

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
    $('#bg-color-selection').on("input", function() {
        let c = $(this).val();
        $("body").css("background-color", c);
    });
    $("#apply").on("click", function() {
        let cssData = {
            background: $("body").css("background"),
            "background-size": "cover",
            "font-family": $("body").css("font-family"),
            "color": $("body").css("color"),
            "background-color": $("body").css("background-color"),
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
                    confirm({
                        message: 'Do you want to reset UGSM to its default settings(Default theme and no custom configurations)?',
                        callback: (answer) => {
                            if (answer) {
                                localStorage.removeItem('theme-manager-files');
                                success('UGSM reseted to default configuration.Please restart application');
                            } else {
                                success('UI preferences cleared.Please restart application');
                            }
                        }
                    });
                }
            }
        });
    });
    $("#save-as-theme").on("click", function() {
        //Time to convert our ui preferences into
        //a css string 
        let prefs = JSON.parse(localStorage.getItem('ui-preferences'));
        if (!prefs) {
            error("You don't have any saved settings saved");
            return;
        }
        let cssString = `
body{
    color:${prefs.color};
    background:${prefs.background};
    background-size:cover;
    font-family:${prefs['font-family']};
}
#service-table{
    font-size:${prefs['table-cell-size']}px;
}
            `;
        ipcRenderer.send('export-settings-as-theme', cssString);
    });
});