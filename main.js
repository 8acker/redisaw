const electron = require('electron');
const fs = require('fs');
const path = require('path');
const open = require('open');
const kill = require('kill-port');
const exec = require('child_process').exec;
var config = require('./config');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
                                       width: 800,
                                       height: 600,
                                       center: true,
                                       autoHideMenuBar: true,
                                       icon: false
                                   });

    mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');


    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });


    mainWindow.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        open(url);
    });
});

app.title = "Redis Operator";

app.httpedis = require('httpedis')();

function reload(changes) {
    app.httpedis.reload(changes);
}

app.changed = function (stage, host) {
    const changes = {
        REDIS_HOST: host,
        REDIS_PORT: config[stage].redis.port,
        REDIS_AUTH: config[stage].redis.password,
        REDIS_DB: config[stage].redis.database
    };
    reload(changes);
};

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
