const {
    Tray,
    Menu
} = require('electron');
const {
    join
} = require('path');
let trayIcon = null;
/** @module tray */

/**
* Create a tray menu
*@param {BrowserWindow} mainWindow The main window of our application
*@param {BrowserWindow} settingsWindow The window that we will use to change our application settings
*/
function createTray(mainWindow,settingsWindow) {
    trayIcon = new Tray(join(__dirname, '../../../icons/ugsm256x256.png'));
    const template =  [{
        label: 'UI settings',
        click: () => {
            settingsWindow.show();
        }
    }, {
        type: 'separator'
    }, {
        label: 'Maximize',
        click: (_, window) => {
            mainWindow.maximize();
        }
    }, {
        label: 'Minimize',
        click: (_, window) => {
            mainWindow.minimize();
        }
    }, {
        label: 'Restart UGSM',
        click: (_, window) => {
            if (settingsWindow.isVisible()) {
                settingsWindow.hide();
            }
            mainWindow.reload();
        }
    }, {
        type: 'separator'
    }, {
        label: 'Quit UGSM',
        role: 'quit'
    }];
    const trayMenu = Menu.buildFromTemplate(template);
    trayIcon.setContextMenu(trayMenu);
}
module.exports = {
    createTray
};