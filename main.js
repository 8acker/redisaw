const electron = require('electron');
const open = require('open');
const config = require('./config');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var mainWindow;

app.on('ready', function () {
    mainWindow = new BrowserWindow({
                                       width: 800,
                                       height: 600,
                                       center: true,
                                       autoHideMenuBar: true,
                                       icon: false,
                                       title: 'RedisOperator: Redis it!'
                                   });

    mainWindow.maximize();

    mainWindow.loadURL('file://' + __dirname + '/index.html');


    mainWindow.on('closed', function () {
        mainWindow = null
    });


    mainWindow.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        open(url);
    });
});

const Httpedis = require('httpedis');
const httpedis = new Httpedis();

app.startHttpedis = () => httpedis.start();

app.logger = console;

function reload(changes) {
    httpedis.reload(changes);
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

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
