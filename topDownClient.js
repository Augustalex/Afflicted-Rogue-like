let io = require('socket.io-client')
let socket = io.connect('http://127.0.0.1:3032');
let Store = require('./Store.js')
let StoreProxy = require('./StoreProxy.js')
const rand255 = () => Math.round(Math.random() * 255)
const color = `rgb(${rand255()},${rand255()},${rand255()})`
const clientId = `${rand255()}${rand255()}`

let localStore = Store({
    store: {
        state: {
            playersById: {}
        },
        getters: {},
        mutations: {
            SET_PLAYER_POS({state}, {id, x, y}) {
                if (!state.playersById[id]) {
                    throw new Error('Player for id does not exist!');
                }
                state.playersById[id].x = x
                state.playersById[id].y = y
            },
            ADD_PLAYER({state}, player) {
                state.playersById[player.id] = player
            }
        },
        actions: {}
    }
})

let store = StoreProxy({
    socket,
    store: localStore
})
store.commit('ADD_PLAYER', {
    id: clientId,
    x: rand255(),
    y: rand255(),
    color,
    speed: 20
});

let canvas = document.createElement('canvas')
canvas.width = 500;
canvas.height = 500;
canvas.style.width = '500px'
canvas.style.height = '500px'
document.body.appendChild(canvas)
let context = canvas.getContext('2d')

let lastTime = 0
const loop = time => {
    let delta = ((time - lastTime) * .01) || .16
    lastTime = time
    
    // fysik(delta)
    draw(canvas, context)
    
    requestAnimationFrame(loop)
}
loop()

window.addEventListener('keydown', e => {
    if (e.key === 'd') {
        store.commit('SET_PLAYER_POS', {
            id: clientId,
            x: store.state.playersById[clientId].x + 1,
            y: store.state.playersById[clientId].y
        })
    }
    else if (e.key === 's') {
        store.commit('SET_PLAYER_POS', {
            id: clientId,
            x: store.state.playersById[clientId].x,
            y: store.state.playersById[clientId].y + 1
        })
    }
    else if (e.key === 'a') {
        store.commit('SET_PLAYER_POS', {
            id: clientId,
            x: store.state.playersById[clientId].x - 1,
            y: store.state.playersById[clientId].y
        })
    }
    else if (e.key === 'w') {
        store.commit('SET_PLAYER_POS', {
            id: clientId,
            x: store.state.playersById[clientId].x,
            y: store.state.playersById[clientId].y - 1
        })
    }
})

function draw(canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    let players = Object.keys(store.state.playersById).map(key => store.state.playersById[key])
    for (let player of players) {
        drawPlayer(context, player)
    }
    
    let meanPlayerX = players.reduce((acc, a, b) => {
        return acc + a.x
    }, 0) / players.length
    drawBullet(context, {x: meanPlayerX})
}

function drawPlayer(context, {x, y, color}) {
    context.fillStyle = color
    context.fillRect(x, y, 10, 10);
}

function drawBullet(context, player) {
    context.fillStyle = 'black'
    context.fillRect(500 - player.x, 250, 5, 5);
}

let posDelta = 100
let additiveDelta = 0

function fysik(delta) {
    for (let playerId of Object.keys(store.state.playersById)) {
        let {x, y} = store.state.playersById[playerId]
        let oldY = y
        if (y < groundY) {
            y += g * delta
        }
        else {
            y = groundY
        }
        if (playerId === clientId) {
            additiveDelta += y - oldY
            if (Math.abs(additiveDelta) > posDelta) {
                console.log('Reconciling')
                store.commit('SET_PLAYER_POS', {id: clientId, x, y})
                additiveDelta = 0
            }
        }
    }
}