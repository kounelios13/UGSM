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

const jcache = require('../javascript/custom_modules/jquery-cache.js')($);
const lockr = require('lockr');
const SystemFontManager = require('system-font-families').default;
const ThemeManagerBuilder = require('../javascript/classes/theme-manager.js');
const themeManager = new ThemeManagerBuilder(lockr.get('theme-manager-files'));
const fonts = new SystemFontManager().getFontsSync();

ipcRenderer.on('receive-selected-image', (event, data) => {
    //We need to make sure that image path does not contain
    //spaces .Spaces in file path do break css code
    //Also in css() use "background" instead of "background-image"
    //Because if image path contains spaces even after replacing them 
    //the code won't work
    /*data = data.replace(/ /g, '%20');
    imagePath = data;*/
    if(!data){
        warning(`The image you selected couldn't be used.Please try another one`);
        return;
    }
    $("body").css({
        "background": `url(${data}) no-repeat center center fixed`,
        "background-size": "cover"
    });
});

ipcRenderer.on('export-status', (event, data) => {
    //Time to see whether we succeed 
    //to export our ui settings as a theme or not
    //Don't destructure error property from data
    //Since it will interfere with the error() function
    const {
        fileExported,
        permissionsChanged
    } = data;
    if (fileExported) {
        if (permissionsChanged) {
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

/**
 * Generate a css strings from settings saved to localStorage
 * @param settings The settings to get the css from
 * @returns css The generated css string
 */
function generateCSSFromSettings(settings) {
    //console.log(settings)
    let css = `
        body{
            background:${settings.background};
            background-size:cover;
            background-color:${settings['background-color']};
            font-family:${settings['font-family']};
            color:${settings.color};
        }
    `;
    if (settings['table-cell-size']) {
        css += `table{font-size:${settings['table-cell-size']}px;}`;
    }
    return css;
}

/**
 * Create a settings styletag and append it to head 
 * @param id The id of the settings styletag
 * @returns settings The settings styletag
 * @throws Error if no id is passed
 * @throws Error if an element with given id exists
 */
function createSettingsStyleTag(id) {
    if (!id) {
        throw new Error('Please provide an id');
    }
    if (document.getElementById(id)) {
        throw new Error(`Element with ${id} already exists`);
    }
    const settings = document.createElement('style');
    settings.id = id;
    document.head.appendChild(settings);
    return settings;
}
$(document).ready(function() {
    const settingsId = 'settings-style';
    const fragment = document.createDocumentFragment();
    themeManager.applySelectedTheme();
    const fontList = document.getElementById('font-list');
    const cellFontSizeSlider = document.getElementById('cell-font-size');
    //Check if there are any user preferences to load
    let userPrefs = lockr.get('ui-preferences');

    //First create the select box
    fonts.forEach(f => {
        let option = document.createElement('option');
        option.innerText = f;
        fragment.appendChild(option);
    })
    fontList.appendChild(fragment);
    //Now you can check for preferences and select  saved font from font-list
    if (userPrefs) {
        //Good 
        //Loaded user preferences.Now apply them
        const settingsStyleTag = createSettingsStyleTag(settingsId);
        settingsStyleTag.innerHTML = generateCSSFromSettings(userPrefs);
        let tableCellSize = userPrefs['table-cell-size'] || 14;
        let textColor = userPrefs['color'];
        let bgColor = userPrefs['background-color'];
        let fontName = userPrefs['font-family'];
        let fontIndex = fonts.indexOf(fontName);
        if (fontIndex != -1) {
            fontList[fontIndex].selected = true;
        }
        cellFontSizeSlider.value = tableCellSize;
        //@TODO
        //Add specific ids to settings view so we apply settings to specific ids intead of a general name 
        //like this -> $("body.settings").css() or $("table.settings").css()
        jcache.get("body").css(userPrefs);
        jcache.get("table").css("font-size", `${tableCellSize}px`);
        //Use only hex colors
        try {
            jcache.get("#text-color-selection").val(rgb2hex(textColor));
            jcache.get("#bg-color-selection").val(rgb2hex(bgColor));
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
        jcache.get("body").css("font-family", font);
    });
    $(cellFontSizeSlider).on('mousemove input', function() {
        let size = `${$(this).val()}px`;
        jcache.get("td").css('font-size', size);
    });
    $("#text-color-selection").on("input", function() {
        let c = $(this).val();
        jcache.get("body").css("color", c);
    });
    $('#bg-color-selection').on("input", function() {
        let c = $(this).val();
        jcache.get("body").css("background-color", c);
    });
    $("#apply").on("click", function() {
        const body = jcache.get("body");
        let cssData = {
            background: body.css("background"),
            "background-size": "cover",
            "font-family": body.css("font-family"),
            "color": body.css("color"),
            "background-color": body.css("background-color"),
            "table-cell-size": $(cellFontSizeSlider).val()
        };
        ipcRenderer.send('apply-ui-settings', cssData);
        //Let's save our css properties to localStorage
        lockr.set('ui-preferences', cssData);
        success('User preferences have been saved');
    });
    $("#delete-settings").on("click", function() {
        /**
         * @TODO
         * Add or use logic here to use ugsm default themes and settings 
         * without reloading the app
         */
        confirm({
            message: 'Are you sure you want to clear your ui preferences?',
            callback: (answer) => {
                if (answer) {
                    //rm stands for remove
                    lockr.rm('ui-preferences');
                    confirm({
                        message: 'Do you want to reset UGSM to its default settings(Default theme and no custom configurations)?',
                        callback: (answer) => {
                            if (answer) {
                                lockr.rm('theme-manager-files');
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
        let prefs = lockr.get('ui-preferences');
        if (!prefs) {
            error("You don't have any saved settings saved");
            return;
        }
        //@TODO
        //Maybe I should the following for background images and convert theme
        //to base64 strings before saving them
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