/*
 *Theme Manager will be used to keep UGSM themes(mostly css file paths)
 *Also a default theme might be set
 *
 ***/
class ThemeManager {
    constructor(options) {
        this.themes = [];
        this.selectedTheme = null;
        if (options) {
            this.themes = options.themes;
            this.selectedTheme = options.selectedTheme;
        }
    }
    addTheme(theme) {
        //Make sure we don't add a theme we already have
        if (this.themes.indexOf(theme) === -1) {
            this.themes.push(theme);
        }
    }
    removeTheme(theme) {
        let indexToRemove = this.themes.indexOf(theme);
        this.themes[indexToRemove] = null;
        //Now we need to remove null valus from our themes array
        this.themes = this.themes.filter(e => e != null);
        //Check if the theme we removed was the selectedTheme
        if (this.selectedTheme == theme) {
            this.selectedTheme = null;
        }
        //This is the only case we force saveThemes()
        //The reason is the following
        //User decides to delete a theme but before they close the relevant theme-selection modal
        //they decide to restart the application and they see that the theme they remove is still on their list
        //because saveThemes() was executed only after closing theme-selection-modal
        this.saveThemes();
    }
    getThemes() {
        return this.themes;
    }
    setSelectedTheme(theme) {
        this.selectedTheme = theme;
    }
    getSelectedTheme() {
        return this.selectedTheme;
    }
    getSelectedThemeIndex() {
        return this.themes.indexOf(this.selectedTheme);
    }
    saveThemes() {
        let info = {
            themes: this.themes,
            selectedTheme: this.selectedTheme
        };
        localStorage.setItem('theme-manager-files', JSON.stringify(info));
    }
    clear() {
        this.themes = [];
        this.setSelectedTheme = null;
        localStorage.removeItem('theme-manager-files');
    }
    applySelectedTheme() {
        if (this.selectedTheme) {
            //Find if we have created a link tag before so we can change its href attribute
            if (document.getElementById('external-theme')) {
                document.getElementById('external-theme').href = this.selectedTheme;
            } else {
                let link = document.createElement('link');
                link.id = 'external-theme';
                link.rel = 'stylesheet';
                link.href = this.selectedTheme;
                document.head.appendChild(link);
            }
        }
    }
}
module.exports = ThemeManager;
