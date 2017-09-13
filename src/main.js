const {
    app,
    BrowserWindow,
    ipcMain,
    dialog,
    Tray
} = require('electron');
const fs = require('fs');
const {
    exec
} = require('child_process');
const url = require('url');
const path = require('path');

const {
    createTray
} = require('./public/javascript/custom_modules/tray.js');
const {
    createMenuBar
} = require('./public/javascript/custom_modules/menubar.js');
//This will be used to quit app in case something happens due to bad code if not in production mode
//First command line arg is node 2nd is the name of the script and the third one is our production
/*let production = process.argv[2] == 'true';*/
let production = true;
let win = null;
let uiPreferencesWin = null;
let allowAppTermination = false;

/**
 * Hide a window instead of destroying it when a user closes it
 *@param {BrowserWindow} window The window we want to hide
 */
function preserveWindow(window) {
    window.on('close', (e) => {
        e.preventDefault();
        window.hide();
    });
}

/*
 * Prevent a window from navigating to a file when a user drags a file into a browser window
 *@param {BrowserWindow} window The BrowserWindow instance which we want to prevent from navigating to a file
 */
function preventNavigation(window) {
    window.webContents.on('will-navigate', (e, _) => {
        e.preventDefault();
    });
}
/**
 * Creates the windows of the application
 */
function createWindows() {
    win = new BrowserWindow({
        height: 800,
        width: 1200,
        title: "UGSM v1.0.6",
        icon: path.join(__dirname, './icons/ugsmv2.png'),
        show: false,
        backgroundColor: 'rgba(190,70,9,.8)'
    });
    win.loadURL(url.format({
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
        parent: win,
        backgroundColor: 'rgba(190,70,9,.8)'
    });
    uiPreferencesWin.loadURL(url.format({
        pathname: path.join(__dirname, './public/views/ui-settings.jade'),
        protocol: 'file:',
        slashes: true
    }));
    createTray(win, uiPreferencesWin);
    preserveWindow(uiPreferencesWin);
    preventNavigation(win);
    preventNavigation(uiPreferencesWin);
    createMenuBar(win, uiPreferencesWin);
}

app.on('ready', createWindows);

ipcMain.on('show-application', () => {
    win.show();
});

ipcMain.on('exit-confirmation-answer', (_, answer) => {
    if (answer === true) {
        //Important
        //If not set to true the app won't be able to exit
        //since close event will always be triggered without us being able to stop
        allowAppTermination = true;
        app.quit();
    }
});

ipcMain.on('show-open-dialog', (event, _) => {
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
});

ipcMain.on('open-theme-selection-dialog', (event, _) => {
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
});

ipcMain.on('export-settings-as-theme', (event, settings) => {
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
                const exportStatus = {
                    fileExported: error == undefined,
                    permissionsChanged: false,
                    //In case of error 
                    //Let the user know what happened
                    error
                };
                fs.chmod(fileName, '0666', (error) => {
                    if (!error) {
                        exportStatus.permissionsChanged = true;
                    }
                    //Now it's time to let the user know whether the theme has been created or not
                    event.sender.send('export-status', exportStatus);
                });
            });
        }
    });
});

ipcMain.on('edit-theme', (event, theme) => {
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
});

ipcMain.on('apply-ui-settings', (event, data) => {
    //Apply new css
    win.webContents.send('apply-new-ui-settings', data);
});

ipcMain.on('update-ui-settings-theme', (event, theme) => {
    uiPreferencesWin.webContents.send('update-ui-settings-theme', theme);
});