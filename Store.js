module.exports = Store

function Store({store: storeOptions, modules = {}}) {
    defaultObject(storeOptions, {
        state: {},
        getters: {},
        mutations: {},
        actions: {}
    })
    
    let rootStore = null;
    
    let store = {};
    Object.assign(store, {
        dispatch,
        commit,
        setRoot,
        state: storeOptions.state,
        getters: getPropertyGettersFromStore(storeOptions),
        // ...buildModules(modules, store)
    })
    return store;
    
    function dispatch(action, argument, {root} = {}) {
        if (root) {
            rootStore.dispatch(action, argument)
        }
        else {
            storeOptions.actions[action](store, argument)
        }
    }
    
    function commit(mutation, argument, {root} = {}) {
        if (root) {
            rootStore.commit(mutation, argument)
        }
        else {
            storeOptions.mutations[mutation](store, argument)
        }
    }
    
    function setRoot(newRootStore) {
        rootStore = newRootStore;
    }
}

function getPropertyGettersFromStore(store) {
    let properties = {}
    for (let getterName of Object.keys(store.getters)) {
        Object.defineProperty(properties, getterName, {
            get() {
                return store.getters[getterName](store)
            }
        })
    }
    return properties
}

function buildModules(modules, root) {
    let builtModules = {}
    for (let moduleName of Object.keys(modules)) {
        let module = Store({store: modules[moduleName]})
        module.setRoot(root)
        builtModules[moduleName] = module
    }
    return builtModules
}

function defaultObject(obj, defaults) {
    for (let key of Object.keys(defaults)) {
        if (!obj.hasOwnProperty(key) && !Object.keys(defaults[key]).length) {
            obj[key] = defaults[key]
        }
    }
}
