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
var connectionStatus = {status: "failed", connectedHost: getRedisHost(), error: new Error("No yet started")};

app.changed = function (stage, host) {
    const changes = {
        redis_host: host,
        redis_auth: config[stage].redis.password,
        database: config[stage].redis.database
    };
    writeConfig(changes);
    startWebdis();
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
    kill(7379).then(console.log("Webdis process killed")).catch(console.log);
    const cmd = "./webdis/webdis webdis.json &";
    return new Promise(function (resolve) {
        exec(cmd, function (error, stdout, stderr) {
            if (error) {
                connectionStatus.status = "failed";
                connectionStatus.error = error;
                return resolve(error);
            } else if (stderr) {
                connectionStatus.status = "failed";
                connectionStatus.error = stderr;
                return resolve(stderr);
            } else {
                connectionStatus.status = "failed";
                delete connectionStatus.error;
                resolve(true);
            }
        });
    });
}

app.getRedisHost = getRedisHost;
app.getConnectionStatus = function () {
    return connectionStatus;
};

function getRedisHost() {
    return require(path.resolve("webdis.json")).redis_host;
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
