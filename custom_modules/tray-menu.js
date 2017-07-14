const {
    ipcRenderer,
    Tray,
    Menu,
} = require('electron');
const path = require('path');
const trayIcon = new Tray(`${__dirname}/icons/ugsm256x256.png`);
module.exports = trayIcon;