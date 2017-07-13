/*
*Theme Manager will be used to keep UGSM themes(mostly css file paths)
*Also a default theme might be set
*
***/
class ThemeManager{
    constructor(options){
        this.themes =[];
        this.selectedTheme = null;
        if(options){
            this.themes = options.themes;
            this.selectedTheme = options.selectedTheme;
        }
    }
    addTheme(theme){
        this.themes.push(theme);
    }
    getThemes(){
        return this.themes;
    }
    setSelectedTheme(theme){
        this.selectedTheme = theme;
    }
    getSelectedTheme(){
        return this.selectedTheme;
    }
    saveThemes(){
        let info = {
            themes:this.themes,
            selectedTheme:this.selectedTheme
        };
        localStorage.setItem('theme-manager-files',JSON.stringify(info));
    }
    clear(){
        this.themes = [];
        this.setSelectedTheme = null;
        localStorage.removeItem('theme-manager-files');
    }
    //Creates a link tag and attaches it to head
    //@param head document.head tag
    applySelectedTheme(head){
        if(this.setSelectedTheme){
            let link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.selectedTheme;
            head.appendChild(link);
        }
    }
}
console.log()
module.exports = ThemeManager;