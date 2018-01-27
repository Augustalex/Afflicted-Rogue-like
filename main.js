let {app, BrowserWindow} = require('electron')

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        height: 600,
        width: 600
    })
    
    mainWindow.loadURL(__dirname + '/index.html')
})