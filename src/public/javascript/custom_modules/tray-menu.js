const {
    Tray
} = require('electron');

function buildTray(tray, settingsWindow) {
    tray = new Tray(`${__dirname}/icons/ugsm256x256.png`);
    const trayMenuTemplate = [{
        label: 'UI settings',
        click: () => {
            settingsWindow.show();
        }
    }, {
        type: 'separator'
    }, {
        label: 'Maximize',
        click: (_, win) => {
            win.maximize();
        }
    }, {
        label: 'Minimize',
        click: (_, win) => {
            win.minimize();
        }
    }, {
        label: 'Restart UGSM',
        click: (_, win) => {
            if (settingsWindow.isVisible()) {
                settingsWindow.hide();
            }
            win.reload();
        }
    }, {
        type: 'separator'
    }, {
        label: 'Quit UGSM',
        role: 'quit'
    }];
    const trayMenu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setContextMenu(trayMenu);
}
module.exports = {
    buildTray
};