const gamepadController = require('./gamepadController.js')

const rightStickRight = 'rs:x:1'
const rightStickLeft = 'rs:x:0'
const rightStickDown = 'rs:y:1'
const rightStickUp = 'rs:y:0'
const leftStickRight = 'ls:x:1'
const leftStickLeft = 'ls:x:0'
const leftStickDown = 'ls:y:1'
const leftStickUp = 'ls:y:0'

const keymap = {
    up: ['w', leftStickUp],
    down: ['s', leftStickDown],
    left: ['a', leftStickLeft],
    right: ['d', leftStickRight],
    shootUp: ['ArrowUp', rightStickUp],
    shootDown: ['ArrowDown', rightStickDown],
    shootLeft: ['ArrowLeft', rightStickLeft],
    shootRight: ['ArrowRight', rightStickRight],
}

let previousKeysDown = new Set();
let keysDown = new Set();
const wasReleased = (actionKey) => keymap[actionKey].some(key => previousKeysDown.has(key) && !keysDown.has(key))
const wasPressed = (actionKey) => keymap[actionKey].some(key => !previousKeysDown.has(key) && keysDown.has(key))
const anyPressed = (actionKeys) => actionKeys.some(key => wasPressed(key))

let keyboardState = new Set();

const stickThreshold = .5

// const isActionKeyDown = actionKey => keymap[actionKey].some(k => keysDown.has(k))
// const matchesActionKey = (actionKey, key) => keymap[actionKey].some(k => k === key)
module.exports = function input(store) {
    previousKeysDown = keysDown
    keysDown = new Set()
    readKeyboardState()
    readGamepadState()
    
    let player = store.state.playersById[clientId]
    let movingX = player.moving ? player.moving.x : 0
    let movingY = player.moving ? player.moving.y : 0
    if (wasPressed('right')) {
        movingX = 1
    }
    if (wasPressed('down')) {
        movingY = 1
    }
    if (wasPressed('left')) {
        movingX = -1
    }
    if (wasPressed('up')) {
        movingY = -1
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
    
    let shootDir;
    if (wasPressed('shootRight')) {
        shootDir = {x: 1, y: 0}
    }
    if (wasPressed('shootLeft')) {
        shootDir = {x: -1, y: 0}
    }
    if (wasPressed('shootUp')) {
        shootDir = {x: 0, y: -1}
    }
    if (wasPressed('shootDown')) {
        shootDir = {x: 0, y: 1}
    }
    if (shootDir) {
        store.commit('SET_PLAYER_SHOOTING', {
            id: clientId,
            shooting: shootDir
        })
    }
    
    //keyup logic
    
    let playerMoving = store.state.playersById[clientId].moving
    if (wasReleased('right') && playerMoving.x > 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: 0,
                y: playerMoving.y
            }
        })
    }
    if (wasReleased('left') && playerMoving.x < 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: 0,
                y: playerMoving.y
            }
        })
    }
    if (wasReleased('up') && playerMoving.y < 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: playerMoving.x,
                y: 0
            }
        })
    }
    if (wasReleased('down') && playerMoving.y > 0) {
        store.commit('SET_PLAYER_MOVING', {
            id: clientId,
            moving: {
                x: playerMoving.x,
                y: 0
            }
        })
    }
    
    const getUpdatedVector = (actionKeys, vector) => {
        if (wasReleased(actionKeys[3]) && vector.x > 0) {
            return {
                x: 0,
                y: vector.y
            }
        }
        if (wasReleased(actionKeys[2]) && vector.x < 0) {
            return {
                x: 0,
                y: vector.y
            }
        }
        if (wasReleased(actionKeys[0]) && vector.y < 0) {
            return {
                x: vector.x,
                y: 0
            }
        }
        if (wasReleased(actionKeys[1]) && vector.y > 0) {
            return {
                x: vector.x,
                y: 0
            }
        }
        return {
            x: vector.x,
            y: vector.y
        }
    }
    let playerShooting = player.shooting || {x: 0, y: 0}
    let updatedVector = getUpdatedVector(['shootUp', 'shootDown', 'shootLeft', 'shootRight'], playerShooting)
    if (updatedVector.x !== playerShooting.x || updatedVector.y !== playerShooting.y) {
        store.commit('SET_PLAYER_SHOOTING', {
            id: clientId,
            shooting: updatedVector
        })
    }
}

function readKeyboardState() {
    for (let key of [...keyboardState]) {
        keysDown.add(key)
    }
}

function readGamepadState() {
    let gamepadOne = gamepadController.getGamepads()[0];
    if (!gamepadOne) return
    
    for (let i = 0; i < gamepadOne.buttons.length; i++) {
        if (gamepadOne.buttons[i].pressed) {
            alert(`BUTTON ${i} PRESSED!`);
        }
    }
    
    let rightStick = {
        x: gamepadOne.axes[2],
        y: gamepadOne.axes[3],
    }
    let leftStick = {
        x: gamepadOne.axes[0],
        y: gamepadOne.axes[1],
    }
    
    const stick = (stick, up, down, left, right) => {
        if (Math.abs(stick.x) > stickThreshold) {
            keysDown.delete(stick.x > 0 ? left : right)
            keysDown.add(stick.x > 0 ? right : left)
        }
        else {
            keysDown.delete(left)
            keysDown.delete(right)
        }
        if (Math.abs(stick.y) > stickThreshold) {
            keysDown.delete(stick.y > 0 ? up : down)
            keysDown.add(stick.y > 0 ? down : up)
        }
        else {
            keysDown.delete(up)
            keysDown.delete(down)
        }
    }
    
    stick(rightStick, rightStickUp, rightStickDown, rightStickLeft, rightStickRight)
    stick(leftStick, leftStickUp, leftStickDown, leftStickLeft, leftStickRight)
}

window.addEventListener('keydown', e => {
    //TODO Keydown seems to be called repeatably when pressing down a key, why?
    if (keyboardState.has(e.key)) return
    console.log('keydown', e.key)
    keyboardState.add(e.key)
})

window.addEventListener('keyup', e => {
    console.log('keyup', e.key)
    keyboardState.delete(e.key)
})