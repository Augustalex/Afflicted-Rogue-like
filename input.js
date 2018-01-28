(function () {
    //TODO make public constant in a players class
    const runningSpeed = 2

    const gamepadController = require('./gamepadController.js')
    const rightStickRight = 'rs:x:1'
    const rightStickLeft = 'rs:x:0'
    const rightStickDown = 'rs:y:1'
    const rightStickUp = 'rs:y:0'
    const leftStickRight = 'ls:x:1'
    const leftStickLeft = 'ls:x:0'
    const leftStickDown = 'ls:y:1'
    const leftStickUp = 'ls:y:0'
    const buttonA = 'button:a'

    const keymap = {
        up: ['w', leftStickUp],
        down: ['s', leftStickDown],
        left: ['a', leftStickLeft],
        right: ['d', leftStickRight],
        shootUp: ['arrowup', rightStickUp],
        shootDown: ['arrowdown', rightStickDown],
        shootLeft: ['arrowleft', rightStickLeft],
        shootRight: ['arrowright', rightStickRight],
        run: ['shift', buttonA]
    }

    let actionKeysActive = new Set();
    let previousKeysDown = new Set();
    let newKeysDown = new Set();
    const wasReleased = (actionKey) => keymap[actionKey].some(key => previousKeysDown.has(key) && !newKeysDown.has(key))
    const wasPressed = (actionKey) => keymap[actionKey].some(key => !previousKeysDown.has(key) && newKeysDown.has(key))
    const anyPressed = (actionKeys) => actionKeys.some(key => wasPressed(key))

    let keyboardState = new Set();

    const stickThreshold = .2

// const isActionKeyDown = actionKey => keymap[actionKey].some(k => keysDown.has(k))
// const matchesActionKey = (actionKey, key) => keymap[actionKey].some(k => k === key)
    module.exports = function input(store, clientId) {
        previousKeysDown = newKeysDown
        newKeysDown = new Set()
        readKeyboardState()
        readGamepadState()

        if (wasPressed('run')) {
            actionKeysActive.add('run')
        }
        if (wasReleased('run')) {
            actionKeysActive.delete('run')
        }

        let player = store.state.playersById[clientId]
        if (!player) return

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

        let runningChanged = false
        if (wasPressed('run')) {
            runningChanged = true
            actionKeysActive.add('run')
        }
        if (wasReleased('run')) {
            runningChanged = true
            actionKeysActive.delete('run')
        }

        if (movingX !== player.moving.x || movingY !== player.moving.y || (runningChanged && (player.moving.x > 0 || player.moving.y > 0))) {
            let running = actionKeysActive.has('run')

            let c = Math.sqrt(movingX * movingX + movingY * movingY)
            movingX /= c
            movingY /= c
            store.commit('SET_PLAYER_MOVING', {
                id: clientId,
                moving: {
                    x: running ? movingX * runningSpeed : movingX,
                    y: running ? movingY * runningSpeed : movingY
                }
            })
        }

        const maxAxesForPressedKeys = (actionKeys, direction) => {
            let [up, down, left, right] = actionKeys
            let x = direction.x
            let y = direction.y
            if (wasPressed(right)) {
                x = 1
            }
            if (wasPressed(down)) {
                y = 1
            }
            if (wasPressed(left)) {
                x = -1
            }
            if (wasPressed(up)) {
                y = -1
            }
            return { x, y }
        }

        let playerShootingDirection = player.shooting.direction
        let newShootingVector = maxAxesForPressedKeys(['shootUp', 'shootDown', 'shootLeft', 'shootRight'], player.shooting.direction)
        if (playerShootingDirection.x !== newShootingVector.x || playerShootingDirection.y !== newShootingVector.y) {
            store.commit('SET_PLAYER_SHOOTING_DIRECTION', {
                id: clientId,
                direction: newShootingVector
            })
        }

        //keyup logic

        const resetAxesForReleasedKeys = (actionKeys, vector) => {
            let x = vector.x
            let y = vector.y
            if (wasReleased(actionKeys[0]) && vector.y < 0) {
                y = 0
            }
            if (wasReleased(actionKeys[1]) && vector.y > 0) {
                y = 0
            }
            if (wasReleased(actionKeys[2]) && vector.x < 0) {
                x = 0
            }
            if (wasReleased(actionKeys[3]) && vector.x > 0) {
                x = 0
            }
            return { x, y }
        }

        let playerMoving = player.moving
        let updatedMovingVector = resetAxesForReleasedKeys(['up', 'down', 'left', 'right'], playerMoving)
        if (updatedMovingVector.x !== playerMoving.x || updatedMovingVector.y !== playerMoving.y) {
            store.commit('SET_PLAYER_MOVING', {
                id: clientId,
                moving: updatedMovingVector
            })
            store.commit('SET_PLAYER_POSITION', {
                id: clientId,
                x: player.x,
                y: player.y
            })
        }

        let shootingDirection = player.shooting.direction
        let updatedVector = resetAxesForReleasedKeys(['shootUp', 'shootDown', 'shootLeft', 'shootRight'], shootingDirection)
        if (updatedVector.x !== shootingDirection.x || updatedVector.y !== shootingDirection.y) {
            store.commit('SET_PLAYER_SHOOTING_DIRECTION', {
                id: clientId,
                direction: updatedVector
            })
        }
    }

    function readKeyboardState() {
        for (let key of [...keyboardState]) {
            newKeysDown.add(key)
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
                newKeysDown.delete(stick.x > 0 ? left : right)
                newKeysDown.add(stick.x > 0 ? right : left)
            }
            else {
                newKeysDown.delete(left)
                newKeysDown.delete(right)
            }

            if (Math.abs(stick.y) > stickThreshold) {
                newKeysDown.delete(stick.y > 0 ? up : down)
                newKeysDown.add(stick.y > 0 ? down : up)
            }
            else {
                newKeysDown.delete(up)
                newKeysDown.delete(down)
            }
        }

        stick(rightStick, rightStickUp, rightStickDown, rightStickLeft, rightStickRight)
        stick(leftStick, leftStickUp, leftStickDown, leftStickLeft, leftStickRight)
    }

    window.addEventListener('keydown', e => {
        //TODO Keydown seems to be called repeatably when pressing down a key, why?
        // if (keyboardState.has(e.key.toLowerCase())) return
        keyboardState.add(e.key.toLowerCase())
    })

    window.addEventListener('keyup', e => {
        keyboardState.delete(e.key.toLowerCase())
    })
})()