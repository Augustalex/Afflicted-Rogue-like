let assert = require('assert');
let Store = require('./Store.js');

test('Can use getter', () => {
    let store = Store({
        store: {
            state: {
                rawText: ' test with space '
            },
            getters: {
                trimmedText({state}) {
                    return state.rawText.trim()
                }
            }
        }
    })
    
    let text = store.getters.trimmedText
    assert.equal(text, 'test with space')
})

test('Can use mutation', () => {
    let store = Store({
        store: {
            state: {
                rawText: 'not raw'
            },
            mutations: {
                SET_RAW_TEXT({state}, rawText) {
                    state.rawText = rawText
                }
            }
        }
    })
    
    store.commit('SET_RAW_TEXT', 'very raw')
    assert.equal(store.state.rawText, 'very raw')
})

test('Can use actions', () => {
    let store = Store({
        store: {
            state: {
                rawText: ' trimmed text '
            },
            mutations: {
                SET_RAW_TEXT({state}, rawText) {
                    state.rawText = rawText
                }
            },
            actions: {
                trimRawText({state, commit}) {
                    let trimmedText = state.rawText.trim()
                    commit('SET_RAW_TEXT', trimmedText)
                }
            }
        }
    })
    store.dispatch('trimRawText')
    assert.equal(store.state.rawText, 'trimmed text')
})

test('Can use module', () => {
    let store = Store({
        store: {
            state: {
                text: ' text '
            },
            mutations: {
                SET_TEXT({state}, text) {
                    state.text = text
                }
            },
            actions: {
                trimText({state, commit}) {
                    let trimmedText = state.text.trim()
                    commit('SET_TEXT', trimmedText)
                }
            }
        },
        modules: {
            subStore: {
                actions: {
                    trimRootText({dispatch}) {
                        dispatch('trimText', null, {root: true})
                    }
                }
            }
        }
    })
    
    store.subStore.dispatch('trimRootText')
    let text = store.state.text
    assert.equal(text, 'text')
})

function test(name, testFn) {
    console.log(` - ${name}`)
    try {
        testFn();
        console.log('PASSED\n')
    }
    catch (err) {
        console.log(`FAILED: ${err.message}\n`)
    }
}