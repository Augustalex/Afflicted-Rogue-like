(function () {
    let constants = {
        bulletSpeed: 50,
        timeToShoot: 0.5,
        playerSize: 10
    }

    const playerObjectsById = {}

    module.exports = function fysik(localStore, store, delta) {
        for (let playerId of Object.keys(store.state.playersById)) {
            player = playerObjectsById[playerId]
            if (!playerObjectsById[playerId]) {
                player = Player({ localStore, store, playerId })
                playerObjectsById[playerId] = Player({ localStore, store, playerId })
            }
            player.fysik(delta)
        }

        for (let bulletId of Object.keys(store.state.bullets)) {
            let bullet = store.state.bullets[bulletId]
            let newPos = {
                x: bullet.x + bullet.direction.x * constants.bulletSpeed * delta,
                y: bullet.y + bullet.direction.y * constants.bulletSpeed * delta
            }

            let collidableObjects = Object.keys(playerObjectsById).map(k => playerObjectsById[k])
            for (let collidable of collidableObjects) {
                if (collidable.id === bullet.shooterId) continue

                let playerPosition = collidable.currentPosition

                let playerLines = [
                    [playerPosition.x, playerPosition.y, playerPosition.x + collidable.width, playerPosition.y],
                    [playerPosition.x + collidable.width, playerPosition.y, playerPosition.x + collidable.width, playerPosition.y + collidable.height],
                    [playerPosition.x + collidable.width, playerPosition.y + collidable.height, playerPosition.x, playerPosition.y + collidable.height],
                    [playerPosition.x, playerPosition.y + collidable.height, playerPosition.x, playerPosition.y],
                ]

                let intersects = playerLines.some(line => {
                    return intersect(line[0], line[1], line[2], line[3], bullet.x, bullet.y, newPos.x, newPos.y)
                })
                if (intersects) {
                    localStore.commit('REMOVE_BULLET', bulletId)
                    store.dispatch('killPlayer', collidable.id)
                }
            }

            localStore.commit('SET_BULLET_POS', Object.assign({ id: bulletId }, newPos))
        }
    }

    function Player({ localStore, store, playerId }) {
        let state = store.state.playersById[playerId]

        let lastPosition = { x: state.x, y: state.y }
        let currentPosition = { x: state.x, y: state.y }

        return {
            lastPosition,
            currentPosition,
            id: playerId,
            width: 10,
            height: 10,
            fysik(delta) {
                let player = store.state.playersById[playerId]
                let x = player.x
                let y = player.y
                lastPosition.x = x
                lastPosition.y = y

                if (player.moving && player.moving.x) {
                    x += player.speed * delta * player.moving.x
                }
                if (player.moving && player.moving.y) {
                    y += player.speed * delta * player.moving.y
                }

                currentPosition.x = x
                currentPosition.y = y
                localStore.commit('SET_PLAYER_POS', { id: playerId, x, y })
                if (Math.random() < .1 * delta) {
                    store.dispatch('addBloodTrail', playerId)
                }

                if (player.shooting.direction.x || player.shooting.direction.y) {
                    if (!player.shooting.timeToShoot) {
                        player.shooting.timeToShoot = constants.timeToShoot
                    }
                    let newTimeToShoot = player.shooting.timeToShoot - delta;
                    if (newTimeToShoot <= 0) {
                        let overFlow = -newTimeToShoot;
                        newTimeToShoot = constants.timeToShoot - overFlow;
                        localStore.dispatch('firePlayerWeapon', {
                            id: playerId,
                            direction: player.shooting.direction,
                        });
                    }
                    localStore.commit('MERGE_PLAYER_SHOOTING', {
                        id: playerId,
                        shooting: {
                            timeToShoot: newTimeToShoot
                        }
                    })
                }
            }
        }
    }
})();

const sameSign = (a, b) => (a * b) > 0;

function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    var a1, a2, b1, b2, c1, c2;
    var r1, r2, r3, r4;
    var denom, offset, num;

    // Compute a1, b1, c1, where line joining points 1 and 2
    // is "a1 x + b1 y + c1 = 0".
    a1 = y2 - y1;
    b1 = x1 - x2;
    c1 = (x2 * y1) - (x1 * y2);

    // Compute r3 and r4.
    r3 = ((a1 * x3) + (b1 * y3) + c1);
    r4 = ((a1 * x4) + (b1 * y4) + c1);

    // Check signs of r3 and r4. If both point 3 and point 4 lie on
    // same side of line 1, the line segments do not intersect.
    if ((r3 !== 0) && (r4 !== 0) && sameSign(r3, r4)) {
        return 0; //return that they do not intersect
    }

    // Compute a2, b2, c2
    a2 = y4 - y3;
    b2 = x3 - x4;
    c2 = (x4 * y3) - (x3 * y4);

    // Compute r1 and r2
    r1 = (a2 * x1) + (b2 * y1) + c2;
    r2 = (a2 * x2) + (b2 * y2) + c2;

    // Check signs of r1 and r2. If both point 1 and point 2 lie
    // on same side of second line segment, the line segments do
    // not intersect.
    if ((r1 !== 0) && (r2 !== 0) && (sameSign(r1, r2))) {
        return 0; //return that they do not intersect
    }

    //Line segments intersect: compute intersection point.
    denom = (a1 * b2) - (a2 * b1);

    if (denom === 0) {
        return 1; //collinear
    }

    // lines_intersect
    return 1; //lines intersect, return true
}