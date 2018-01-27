(function () {
    let Blood = require('./Blood.js')
    let io = require('socket.io-client')
    let socket = io.connect('http://127.0.0.1:3032');
    //let socket = io.connect('http://192.168.1.106:3032');
    let Store = require('./Store.js')
    let StoreProxy = require('./StoreProxy.js')
    const input = require('./input.js');
    const fysik = require('./fysik.js');
    const rand255 = () => Math.round(Math.random() * 255)
    const genId = () => `${rand255()}${rand255()}${rand255()}`
    const color = `rgb(${rand255()},${rand255()},${rand255()})`
    const clientId = `${rand255()}${rand255()}`
    console.log('clientId: ', clientId)

    let localStore = Store({
        store: {
            state: {
                playersById: {},
                bullets: {},
                removeRequests: [],
                blood: null
            },
            getters: {},
            mutations: {
                SET_PLAYER_POS({ state }, { id, x, y }) { //TODO deprecate
                    if (!state.playersById[id]) {
                        throw new Error('Player for id does not exist!');
                    }
                    state.playersById[id].x = x
                    state.playersById[id].y = y
                },
                SET_PLAYER_POSITION({ state }, { id, x, y }) {
                    if (state.playersById[id]) {
                        state.playersById[id].x = x
                        state.playersById[id].y = y
                    }
                },
                SET_PLAYER_MOVING({ state }, { id, moving }) {
                    state.playersById[id].moving = moving
                },
                SET_PLAYER_SHOOTING({ state }, { id, shooting }) {
                    state.playersById[id].shooting = shooting
                },
                SET_PLAYER_SHOOTING_DIRECTION({ state }, { id, direction }) {
                    state.playersById[id].shooting.direction = direction
                },
                MERGE_PLAYER_SHOOTING({ state }, { id, shooting }) {
                    Object.assign(state.playersById[id].shooting, shooting)
                },
                ADD_PLAYER({ state }, player) {
                    state.playersById[player.id] = player
                },
                ADD_BULLET({ state }, bullet) {
                    state.bullets[bullet.id] = bullet
                },
                SET_BULLET_POS({ state }, { id, x, y }) {
                    state.bullets[id].x = x
                    state.bullets[id].y = y
                },
                REMOVE_PLAYER({ state, commit }, playerId) {
                    if (state.playersById[playerId]) {
                        let { x, y } = state.playersById[playerId]
                        state.removeRequests.push({
                            firstKey: 'playersById',
                            secondKey: playerId
                        })
                        commit('ADD_BLOOD', { x, y })
                    }
                },
                REMOVE_BULLET({ state }, bulletId) {
                    if (state.bullets[bulletId]) {
                        state.removeRequests.push({
                            firstKey: 'bullets',
                            secondKey: bulletId
                        })
                    }
                },
                SET_BLOOD_ENGINE({ state }, blood) {
                    state.blood = blood
                },
                ADD_BLOOD({ state }, { x, y }) {
                    if (state.blood) {
                        state.blood.add(x, y)
                    }
                }
            },
            actions: {
                firePlayerWeapon({ state, commit }, { id, direction }) {
                    let player = state.playersById[id]
                    let bulletId = genId()
                    let shootDir = Math.atan2(player.shooting.direction.y, player.shooting.direction.x)
                    let gunPosX = player.x + Math.cos(shootDir + Math.PI / 4) * 9
                    let gunPosY = player.y + Math.sin(shootDir + Math.PI / 4) * 9
                    let bullet = {
                        x: gunPosX,
                        y: gunPosY,
                        id: bulletId,
                        shooterId: id,
                        direction
                    }
                    commit('ADD_BULLET', bullet)

                    setTimeout(() => {
                        if (!state.bullets[bulletId]) return;
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
        speed: 20,
        shooting: {
            direction: {
                x: 0,
                y: 0
            }
        },
        moving: {
            x: 0,
            y: 0
        }
    });

    let canvas = document.createElement('canvas')
    canvas.width = 500;
    canvas.height = 500;
    canvas.style.width = '500px'
    canvas.style.height = '500px'
    document.body.appendChild(canvas)
    let context = canvas.getContext('2d')
    localStore.commit('SET_BLOOD_ENGINE', Blood(canvas, context));

    let lastTime = 0
    const loop = time => {
        let delta = ((time - lastTime) * .01) || .16
        lastTime = time

        input(store, clientId)
        fysik(localStore, store, delta)
        draw(canvas, context)
        gc()

        requestAnimationFrame(loop)
    }
    loop()

    function draw(canvas, context) {
        context.clearRect(0, 0, canvas.width, canvas.height)
        store.state.blood.animateAndDraw()

        let players = Object.keys(store.state.playersById).map(key => store.state.playersById[key])
        for (let player of players) {
            drawPlayer(context, player)
        }

        for (let bulletId of Object.keys(store.state.bullets)) {
            let bullet = store.state.bullets[bulletId]
            drawBullet(context, bullet)
        }
    }

    function drawPlayer(context, { x, y, color, moving, shooting }) {
        context.fillStyle = color
        let aimVector = moving;
        if (shooting.direction.x || shooting.direction.y) {
            aimVector = shooting.direction
        }
        let dir = Math.atan2(aimVector.y, aimVector.x)
        fillRectRot(x, y, 10, 10, dir)
        context.fillStyle = 'black'
        let gunPosX = x + Math.cos(dir + Math.PI / 4) * 9
        let gunPosY = y + Math.sin(dir + Math.PI / 4) * 9
        fillRectRot(gunPosX, gunPosY, 8, 3, dir)
    }

    function drawBullet(context, bullet) {
        context.fillStyle = 'black'
        let dir = Math.atan2(bullet.direction.y, bullet.direction.x);
        fillRectRot(bullet.x, bullet.y, 5, 5, dir)
    }

    function fillRectRot(x, y, width, height, dir) {
        context.save()
        context.translate(x, y)
        context.rotate(dir)
        context.fillRect(-width / 2, -height / 2, width, height)
        context.restore()
    }

    function gc() {
        for (let { firstKey, secondKey } of store.state.removeRequests) {
            if (secondKey) {
                delete store.state[firstKey][secondKey]
            }
            else {
                delete store.state[firstKey]
            }
        }
        store.state.removeRequests = []
    }
})()