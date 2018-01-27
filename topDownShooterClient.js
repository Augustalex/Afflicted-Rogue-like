let io = require('socket.io-client')
let socket = io.connect('http://127.0.0.1:3032');
let Store = require('./Store.js')
let StoreProxy = require('./StoreProxy.js')
const rand255 = () => Math.round(Math.random() * 255)
const genId = () => `${rand255()}${rand255()}${rand255()}`
const color = `rgb(${rand255()},${rand255()},${rand255()})`
const clientId = `${rand255()}${rand255()}`

let localStore = Store({
    store: {
        state: {
            playersById: {},
            bullets: []
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
            SET_PLAYER_MOVING({state}, {id, moving}) {
                state.playersById[id].moving = moving
            },
            ADD_PLAYER({state}, player) {
                state.playersById[player.id] = player
            },
            ADD_BULLET({state}, bullet) {
                state.bullets[bullet.id] = bullet
            },
            SET_BULLET_POS({state}, {id, x, y}) {
                state.bullets[id].x = x
                state.bullets[id].y = y
            },
            REMOVE_BULLET({state}, bulletId) {
                state.bullets[bulletId]._remove = true
            }
        },
        actions: {
            firePlayerWeapon({state, commit}, {id}) {
                let playerPos = state.playersById[id]
                let bulletId = genId()
                let bullet = {id: bulletId, x: playerPos.x, y: playerPos.y}
                commit('ADD_BULLET', bullet)
                
                setTimeout(() => {
                    commit('REMOVE_BULLET', bulletId)
                }, 2500);
            }
        }
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
    
    fysik(delta)
    draw(canvas, context)
    gc()
    
    requestAnimationFrame(loop)
}
loop()

let keymap = {
    up: ['w'],
    down: ['s'],
    left: ['a'],
    right: ['d']
}
let keysDown = new Set();
const isActionKeyDown = actionKey => keymap[actionKey].some(k => keysDown.has(k))
const matchesActionKey = (actionKey, key) => keymap[actionKey].some(k => k === key)
window.addEventListener('keydown', e => {
    //TODO Keydown seems to be called repeatably when pressing down a key, why?
    if (keysDown.has(e.key)) return
    keysDown.add(e.key)
    
    let player = store.state.playersById[clientId]
    let movingX = player.moving ? player.moving.x : 0
    let movingY = player.moving ? player.moving.y : 0
    if (isActionKeyDown('right')) {
        movingX = 1
    }
    if (isActionKeyDown('down')) {
        movingY = 1
    }
    if (isActionKeyDown('left')) {
        movingX = -1
    }
    if (isActionKeyDown('up')) {
        movingY = -1
    }
    if (e.key === 'Enter') {
        store.dispatch('firePlayerWeapon', {
            id: clientId
        })
    }
    if (movingX || movingY) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: movingX,
                y: movingY
            }
        })
    }
})
window.addEventListener('keyup', e => {
    keysDown.delete(e.key)
    let playerMoving = store.state.playersById[clientId].moving
    if (matchesActionKey('right', e.key) && playerMoving.x > 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: 0,
                y: playerMoving.y
            }
        })
    }
    if (matchesActionKey('left', e.key) && playerMoving.x < 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: 0,
                y: playerMoving.y
            }
        })
    }
    if (matchesActionKey('up', e.key) && playerMoving.y < 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: playerMoving.x,
                y: 0
            }
        })
    }
    if (matchesActionKey('down', e.key) && playerMoving.y > 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: playerMoving.x,
                y: 0
            }
        })
    }
})

function draw(canvas, context) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    let players = Object.keys(store.state.playersById).map(key => store.state.playersById[key])
    for (let player of players) {
        drawPlayer(context, player)
    }
    
    for (let bulletId of Object.keys(store.state.bullets)) {
        let bullet = store.state.bullets[bulletId]
        drawBullet(context, bullet)
    }
}

function drawPlayer(context, {x, y, color}) {
    context.fillStyle = color
    context.fillRect(x, y, 10, 10);
}

function drawBullet(context, bullet) {
    context.fillStyle = 'black'
    context.fillRect(bullet.x, bullet.y, 5, 5);
}

function fysik(delta) {
    for (let playerId of Object.keys(store.state.playersById)) {
        let player = store.state.playersById[playerId]
        let x = player.x
        let y = player.y
        if (player.moving && player.moving.x) {
            x += player.speed * delta * player.moving.x
        }
        if (player.moving && player.moving.y) {
            y += player.speed * delta * player.moving.y
        }
        localStore.commit('SET_PLAYER_POS', {id: playerId, x, y})
    }
    for (let bulletId of Object.keys(store.state.bullets)) {
        let bullet = store.state.bullets[bulletId]
        localStore.commit('SET_BULLET_POS', {
            id: bulletId,
            x: bullet.x + 50 * delta,
            y: bullet.y
        })
    }
}

function gc() {
    let bulletIds = Object.keys(store.state.bullets)
    for (let bulletId of bulletIds) {
        let bullet = store.state.bullets[bulletId]
        if (bullet._remove) {
            store.state.bullets[bulletId] = null
            delete store.state.bullets[bulletId]
        }
    }
}