var http = require('http');
var server = http.createServer(function (request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
});
var io = require('socket.io')(server);
server.listen(3032, '0.0.0.0');
let log = [];
io.on('connection', socket => {
    socket.on('dispatch', data => {
        console.log('dispatch', data.argument)
        log.push(['d', data])
        socket.broadcast.emit('dispatch', data)
    })
    socket.on('commit', data => {
        console.log('commit', data.argument)
        log.push(['c', data])
        socket.broadcast.emit('commit', data)
    })
    for (let i = 0; i < log.length; i++) {
        if (log[i][0] === 'd') {
            socket.emit('dispatch', log[i][1])
        }
        else if (log[i][0] === 'c') {
            socket.emit('commit', log[i][1])
        }
    }
    
})