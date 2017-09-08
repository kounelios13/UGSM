const fs = require('fs');
/**
 * @class
 * A class used to keep UGSM themes(mostly css file paths)
 */
class ThemeManager {
    /**
    *@constructor
    *@param {Object}options An object containing some UGSM theme paths and a selected theme
    */
    constructor(options) {
        this._themes = [];
        this._selectedTheme = null;
        if (options) {
            this._themes = options.themes;
            this._selectedTheme = options.selectedTheme;
        }
    }
    /**
    * Add a new css theme file path to the current instance of ThemeManager
    *@param {String} theme The new theme we want to add
    */
    addTheme(theme) {
        //Make sure we don't add a theme we already have
        if (this._themes.indexOf(theme) === -1) {
            this._themes.push(theme);
        }
    }
    /**
    *Remove a specified theme
    *@param {String} theme The theme we want to remove
    */
    removeTheme(theme) {
        let indexToRemove = this._themes.indexOf(theme);
        this._themes[indexToRemove] = null;
        //Now we need to remove null valus from our themes array
        this._themes = this._themes.filter(e => e != null);
        //Check if the theme we removed was the selectedTheme
        if (this._selectedTheme == theme) {
            this._selectedTheme = null;
        }
        //This is the only case we force saveThemes()
        //The reason is the following
        //User decides to delete a theme but before they close the relevant theme-selection modal
        //they decide to restart the application and they see that the theme they remove is still on their list
        //because saveThemes() was executed only after closing theme-selection-modal
        this.saveThemes();
    }
    /** Get all themes
    *@returns {Array}this._themes A list of all themes saved in the current ThemeManager instance
    */ 
    getThemes() {
        return this._themes;
    }
    /**
    * Set the selected theme for the current ThemeManager instance
    * @param {String} theme The theme to set as selected
    */
    setSelectedTheme(theme) {
        this._selectedTheme = theme;
        this._saveThemes();
    }
    /**
    * Get the selected theme for the current ThemeManager instance
    * @returns {String} this._selectedTheme The selected theme
    */
    getSelectedTheme() {
        return this._selectedTheme;
    }

    /**
    * Get the index of the selected theme
    *  @returns {Number} selectedIndex the index of the selectd theme
    */
    getSelectedThemeIndex() {
        let selectedIndex = this._themes.indexOf(this._selectedTheme);
        return selectedIndex;
    }
    /**
    * Save all themes to localStorage
    */
    saveThemes() {
        let info = {
            themes: this._themes,
            selectedTheme: this._selectedTheme
        };
        localStorage.setItem('theme-manager-files', JSON.stringify(info));
    }
    /** 
    * Clears the localStorage and the app from all UGSM theme settings
    */
    clear() {
        this._themes = [];
        this._setSelectedTheme = null;
        localStorage.removeItem('theme-manager-files');
    }

    /**
    * Applies the selected theme(if any) to the current UGSM instance
    */
    applySelectedTheme() {
        if (this._getSelectedTheme()) {
            //Find if we have created a link tag before so we can change its href attribute
            let styleTag  = document.getElementById('external-theme');
            if(!styleTag){
                styleTag = document.createElement('style');
                styleTag.id = 'external-theme'; 
                document.head.appendChild(styleTag);
            }
            //When applying a new theme we have to read its contents 
            //and the apply them to a new style tag.
            //The reason is that because the app is compiled any reference to an external file
            //will throw an error for the file not being precompiled
            //https://github.com/electron/electron-compile/issues/171
            const themeContents = fs.readFileSync(this._getSelectedTheme(),'utf-8');
            if(themeContents){
                styleTag.innerHTML = themeContents;
            }
        }
    }
}
module.exports = ThemeManager;
