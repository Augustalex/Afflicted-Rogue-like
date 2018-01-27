let {app, BrowserWindow} = require('electron')

app.on('ready', () => {
    let mainWindow = new BrowserWindow({
        height: 880,
        width: 820
    })
    
    mainWindow.loadURL(__dirname + '/index.html')
})