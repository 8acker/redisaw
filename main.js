const electron = require('electron');
const fs = require('fs');
const path = require('path');
const open = require('open');
const kill = require('kill-port');
const exec = require('child_process').exec;
var config = require('./config.json');
// Module to control application life.
const app = electron.app
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

app.startWebdis = startWebdis;
app.stopWebdis = function () {
    kill(require("./webdis/webdis.json").http_port).then(console.log("Webdis process killed")).catch(console.log);
};

app.changed = function (stage, host) {
    const changes = {
        redis_host: host,
        redis_auth: config[stage].redis.password,
        database: config[stage].redis.database
    };
    restartWebdis(writeConfig(changes).http_port);
};

function writeConfig(obj) {
    const newData = require("./webdis/webdis.json");
    Object.keys(obj).forEach(function (key) {
        newData[key] = obj[key]
    });
    fs.writeFileSync(path.resolve("webdis.json"), JSON.stringify(newData, null, 2));
    return newData;
}

function startWebdis() {
    const cmd = "./webdis/webdis webdis.json &";
    return new Promise(function (resolve) {
        exec(cmd, function (error, stdout, stderr) {
            if (error) return resolve(error);
            if (stderr) return resolve(stderr);
            resolve(true);
        });
    });
}

function restartWebdis(port) {
    kill(port).then(console.log("Webdis process killed")).catch(console.log);
    startWebdis().then(console.log("Webdis restarted")).catch(console.log);
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
