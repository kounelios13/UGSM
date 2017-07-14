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
        this.themes.push(theme);
    }
    removeTheme(theme) {
        let indexToRemove = this.themes.indexOf(theme);
        this.themes[indexToRemove] = null;
        //Now we need to remove null valus from our themes array
        this.themes = this.themes.filter(e => e != null);
        //Save changes back to localStorage
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
        //Here comes an intesave resting idea
        //Don't saveThemes() any time you add or remove themes
        //saveThemes() only when the boostrap modal that shows the themes closes
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
        //Creates a link tag and attaches it to head
    applySelectedTheme() {
        if (this.setSelectedTheme) {
            //Find if we have recreated a link tag before so we can change its href attribute
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
