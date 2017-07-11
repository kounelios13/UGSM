const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    dialog
} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const Binder = require('./classes/binder.js');
const ServiceManagerBuilder = require('./classes/service-manager.js');
let win = null;
let uiPreferencesWin = null;
let serviceManager = new ServiceManagerBuilder();
function createMainWindowMenuBar() {
    const menuTemplate = [{
        label: 'File',
        submenu: [{
            label: 'Exit UGSM',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
                win.webContents.send('request-exit-confirmation');
            }
        }]
    },{
        label:'Edit',
        submenu:[{
            role:'copy'
        },{
            role:'paste'
        },{
            role:'selectall'
        },{
            role:'delete'
        }]
    }, {
        label: 'View',
        submenu: [{
            label: 'Show only active services',
            accelerator:'Ctrl+Shift+1',
            click: () => {
                win.webContents.send('filter-services', {
                    //View 0 means
                    //Show only active services
                    view: 0
                });
            }
        }, {
            label: 'Show only inactive services',
            accelerator:'Ctrl+Shift+2',
            click: () => {
                win.webContents.send('filter-services', {
                    //View 1 means show only 
                    //inactive services
                    view: 1
                })
            }
        }, {
            label: 'Show all services',
            accelerator:'Ctrl+Shift+3',
            click: () => {
                win.webContents.send('filter-services', {
                    //Show everything like
                    //there is no tomorrow :p
                    view: 2
                });
            }
        }, {
            type: 'separator'
        }, {
            label: 'Restart UGSM',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
                if(uiPreferencesWin.isVisible()){
                    //When soft restarting apprelication
                    //hide ui preferences window
                    //but don't destroy it
                    uiPreferencesWin.hide();
                    //If in a future version I decide to switch
                    //to hard reset I will have to restart ui preferences window()
                }
                win.reload();
            }
        },{
            type: 'separator'
        },{
            role:'togglefullscreen'
        }]
    }, {
        label: 'Preferences',
        submenu: [{
            label: 'UI settings',
            click: () => {
                if (!uiPreferencesWin.isVisible()) {
                    uiPreferencesWin.show();
                }
            }
        }, {
            label: 'Application settings',
            enabled: false
        }]
    }];
    const menu = Menu.buildFromTemplate(menuTemplate);
    win.setMenu(menu);
}
//This function will hide a window instead of destroying it
function preserveWindow(window) {
    window.on('close', (e) => {
        e.preventDefault();
        window.hide();
    });
}
function createWindow() {
    win = new BrowserWindow({
        height: 800,
        width: 1200,
        title: "UGSM v1.0.2",
        icon: `${__dirname}/icons/ugsm256x256.png`
    });
    win.loadURL(url.format({
        pathname: path.join(__dirname, './services.html'),
        protocol: 'file:',
        slashes: true
    }));
    uiPreferencesWin = new BrowserWindow({
        height: 800,
        width: 1200,
        title: "UI settings",
        show: false,
        parent: win,
        icon: `${__dirname}/icons/ugsm256x256.png`
    });
    uiPreferencesWin.loadURL(url.format({
        pathname: path.join(__dirname, 'pages/ui-settings.html'),
        protocol: 'file:',
        slashes: true
    }));
    preserveWindow(uiPreferencesWin);
    createMainWindowMenuBar();
}
const appBinder = new Binder(app, {
    ready: createWindow,
    'window-all-closed': () => {
        // On macOS it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    },
    activate: () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (win === null) {
            createWindow();
        }
    }
});
const ipcMainBinder = new Binder(ipcMain, {
    'request-services':(event,data)=>{
        serviceManager.requestServices(event,data);
    },
    'start-service': (event, service) => {
        serviceManager.startService(event,service);
    },
    'stop-service': (event, service) => {
        serviceManager.stopService(event,service);
    },
    'restart-service': (event, service) => {
        serviceManager.restartService(event,service);
    },
    'exit-confirmation-answer': (_, answer) => {
        if (answer === true) {
            app.quit();
        }
    }
});
ipcMainBinder.addEvents({
    'show-open-dialog': (event,_) => {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters:[{name: 'Images', extensions: ['jpg', 'png', 'bmp']}]
        },(data)=>{
            if(data && data.length){
                //data is an array containing a single item
                //which is the path of the selected image
                event.sender.send('receive-selected-image',data[0]);
            }
        })
    },
    'apply-ui-settings':(event,data)=>{
        //Apply new css
        win.webContents.send('apply-new-ui-settings',data);
    }
});
