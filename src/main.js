const {
    app,
    BrowserWindow,
    Menu,
    ipcMain,
    dialog,
    Tray
} = require('electron');
const fs = require('fs');
const exec = require('child_process').exec;
const url = require('url');
const path = require('path');
const Binder = require('./public/javascript/classes/binder.js');
const {createTray} = require('./public/javascript/custom_modules/tray.js');
//This will be used to quit app in case something happens due to bad code if not in production mode
//First command line arg is node 2nd is the name of the script and the third one is our production
/*let production = process.argv[2] == 'true';*/
let production = true;
let win = null;
let uiPreferencesWin = null;
var allowAppTermination = false;
let trayIcon = null;

function createMainWindowMenuBar() {
    const menuTemplate = [{
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
                window.webContents.send('filter-services', {
                    //View 0 means
                    //Show only active services
                    view: 0
                });
            }
        }, {
            label: 'Show only inactive services',
            accelerator: 'Ctrl+Shift+2',
            click: (_, window) => {
                window.webContents.send('filter-services', {
                    //View 1 means show only 
                    //inactive services
                    view: 1
                })
            }
        }, {
            label: 'Show all services',
            accelerator: 'Ctrl+Shift+3',
            click: (_, window) => {
                window.webContents.send('filter-services', {
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
                if (window) {
                    window.webContents.openDevTools();
                }
            }
        }, {
            type: 'separator'
        }, {
            label: 'Restart UGSM',
            accelerator: 'CmdOrCtrl+R',
            click: (_, window) => {
                if (uiPreferencesWin.isVisible()) {
                    //When soft restarting application
                    //hide ui preferences window
                    //but don't destroy it
                    uiPreferencesWin.hide();
                }
                window.reload();
                uiPreferencesWin.reload();
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
                if (!uiPreferencesWin.isVisible()) {
                    uiPreferencesWin.show();
                }
            }
        }, {
            label: 'Select Theme',
            accelerator: 'CmdOrCtrl+T',
            click: (_, window) => {
                window.webContents.send('select-theme');
            }
        }]
    }];
    const menu = Menu.buildFromTemplate(menuTemplate);
    win.setMenu(menu);
}
//This function will hide a window instead of destroying it
//@param {BrowserWindow} window The window we want to preserve
function preserveWindow(window) {
    window.on('close', (e) => {
        e.preventDefault();
        window.hide();
    });
}
//When dragging a file into an electron app
//electron will try to navigate to this file
//prevent it from happening
//@param {BrowserWindow} window The BrowserWindow instance which we want to prevent from navigating to a file
function preventNavigation(window){
    window.webContents.on('will-navigate',(e,_)=>{
        e.preventDefault();
    });
}
function createWindow() {
    win = new BrowserWindow({
        height: 800,
        width: 1200,
        title: "UGSM v1.0.4",
        icon: path.join(__dirname,'./icons/ugsm256x256')
    });
    win.loadURL(url.format({
        /*pathname: path.join(__dirname, './services.html'),*/
        pathname: path.join(__dirname, './public/views/index.jade'),
        protocol: 'file:',
        slashes: true
    }));
    //Prevent user from exiting UGSM
    //without confirming
    win.on('close', (e) => {
        if (!allowAppTermination && production) {
            //Means that close event hasn't been triggered again and we are in production mode
            e.preventDefault();
            win.webContents.send('request-exit-confirmation');
        } else {
            //close event has been triggered or we are not in production mode
            //now exit
            app.quit();
        }
    });
    uiPreferencesWin = new BrowserWindow({
        height: 800,
        width: 1200,
        title: "UI settings",
        show: false,
        parent:win
    });
    uiPreferencesWin.loadURL(url.format({
        pathname: path.join(__dirname, './public/views/ui-settings.jade'),
        protocol: 'file:',
        slashes: true
    }));
    createTray(win,uiPreferencesWin);
    preserveWindow(uiPreferencesWin);
    preventNavigation(win);
    preventNavigation(uiPreferencesWin);
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
    },
});
const ipcMainBinder = new Binder(ipcMain, {
    'show-application': () => {
        win.show();
    },
    'exit-confirmation-answer': (_, answer) => {
        if (answer === true) {
            //Important
            //If not set to true the app won't be able to exit
            //since close event will always be triggered without us being able to stop
            allowAppTermination = true;
            app.quit();
        }
    }
});
ipcMainBinder.addEvents({
    'show-open-dialog': (event, _) => {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{
                name: 'Images',
                extensions: ['jpg', 'png', 'bmp']
            }]
        }, (data) => {
            if (data && data.length) {
                //data is an array containing a single item
                //which is the path of the selected image
                event.sender.send('receive-selected-image', data[0]);
            }
        });
    },
    'open-theme-selection-dialog': (event, _) => {
        dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [{
                name: 'CSS(Stylesheets)',
                extensions: ['css']
            }]
        }, (data) => {
            if (data && data.length) {
                //data is an array containing a single item
                //which is the path of the selected theme(css file)
                event.sender.send('receive-selected-theme', data[0]);
            }
        });
    },
    'export-settings-as-theme': (event, settings) => {
        dialog.showSaveDialog({
            title: 'Export settings as theme',
            filters: [{
                name: 'UGSM theme(CSS)',
                extensions: ['css']
            }]
        }, (fileName) => {
            if (fileName) {
                fs.writeFile(fileName, settings, (error) => {
                    //Since this code executes as root the file being created is read only.
                    //chmod() it
                    let exportStatus = {
                        fileExported:error==undefined,
                        permissionsChanged:false,
                        //In case of error 
                        //Let the user know what happened
                        error 
                    };
                    fs.chmod(fileName, '0666', (error) => {
                        if(!error){
                            exportStatus.permissionsChanged = true;
                        }
                        //Now it's time to let the user know whether the theme has been created or not
                        event.sender.send('export-status',exportStatus);
                    });
                });
            }
        });
    },
    'edit-theme': (event, theme) => {
        console.log(`gedit ${theme}`);
        exec(`gedit ${theme}`, (error, stdout, stderr) => {
            //@TODO
            //handle errors
            if (error) {
                console.log(error);
            }
            if (stdout) {
                console.log(`stdout \n${stdout}`);
            }
            if (stderr) {
                console.log(`stderr \n${stderr}`);
            }
        });
    },
    'apply-ui-settings': (event, data) => {
        //Apply new css
        win.webContents.send('apply-new-ui-settings', data);
    },
    'update-ui-settings-theme':(event,theme)=>{
        uiPreferencesWin.webContents.send('update-ui-settings-theme',theme);
    }
});
