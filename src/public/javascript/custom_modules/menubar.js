/** @module menubar*/

const {Menu} = require('electron');
/**
*Create the menu bar of UGSM
*@param {BrowserWindow} mainWindow The main window of the application
*@param {BrowserWindow} settingsWindow The preferences window of the application
*/

function createMenuBar(mainWindow,settingsWindow){
    const template = [{
        label: 'File',
        submenu: [{
            label: 'Exit UGSM',
            accelerator: 'CmdOrCtrl+Q',
            role: 'quit'
        }]
    }, {
        label: 'Edit',
        submenu: [{
            role: 'copy'
        }, {
            role: 'paste'
        }, {
            role: 'selectall'
        }, {
            role: 'delete'
        }]
    }, {
        label: 'View',
        submenu: [{
            label: 'Show only active services',
            accelerator: 'Ctrl+Shift+1',
            click: (_, window) => {
                mainWindow.webContents.send('filter-services', {
                    //View 0 means
                    //Show only active services
                    view: 0
                });
            }
        }, {
            label: 'Show only inactive services',
            accelerator: 'Ctrl+Shift+2',
            click: (_, window) => {
                mainWindow.webContents.send('filter-services', {
                    //View 1 means show only 
                    //inactive services
                    view: 1
                })
            }
        }, {
            label: 'Show all services',
            accelerator: 'Ctrl+Shift+3',
            click: (_, window) => {
                mainWindow.webContents.send('filter-services', {
                    //Show everything like
                    //there is no tomorrow :p
                    view: 2
                });
            }
        }, {
            type: 'separator'
        }, {
            label: 'Toggle Developer Tools',
            accelerator: 'CmdOrCtrl+Shift+I',
            click: (_, window) => {
                if (mainWindow) {
                    mainWindow.webContents.openDevTools();
                }
            }
        }, {
            type: 'separator'
        }, {
            label: 'Restart UGSM',
            accelerator: 'CmdOrCtrl+R',
            click: (_, window) => {
                if (settingsWindow.isVisible()) {
                    //When soft restarting application
                    //hide ui preferences window
                    //but don't destroy it
                    settingsWindow.hide();
                }
                mainWindow.reload();
                settingsWindow.reload();
            }
        }, {
            type: 'separator'
        }, {
            role: 'togglefullscreen'
        }]
    }, {
        label: 'Preferences',
        submenu: [{
            label: 'UI settings',
            accelerator: 'CmdOrCtrl+U',
            click: () => {
                if (!settingsWindow.isVisible()) {
                    settingsWindow.show();
                }
            }
        }, {
            label: 'Select Theme',
            accelerator: 'CmdOrCtrl+T',
            click: (_, mainWindow) => {
                mainWindow.webContents.send('select-theme');
            }
        }]
    }];
    const menu = Menu.buildFromTemplate(template);
    mainWindow.setMenu(menu);
}
module.exports = {
    createMenuBar
};