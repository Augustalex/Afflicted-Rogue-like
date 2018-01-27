(function () {
    let constants = {
        bulletSpeed: 50,
        timeToShoot: 0.5
    }

    module.exports = function fysik(delta) {
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
            localStore.commit('SET_PLAYER_POS', { id: playerId, x, y })

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

        for (let bulletId of Object.keys(store.state.bullets)) {
            let bullet = store.state.bullets[bulletId]
            localStore.commit('SET_BULLET_POS', {
                id: bulletId,
                x: bullet.x + bullet.direction.x * constants.bulletSpeed * delta,
                y: bullet.y + bullet.direction.y * constants.bulletSpeed * delta,
            })
        }
    }
})()