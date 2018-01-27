module.exports = function StoreProxy({store, socket}) {
    socket.on('dispatch', ({argument, options}) => {
        store.dispatch(argument, options)
    });
    socket.on('commit', ({argument, options}) => {
        store.commit(argument, options)
    });
    
    return Object.assign({}, store, {
        dispatch(actionName, argument) {
            store.dispatch(actionName, argument)
            let data = {}
            if (actionName) {
                data.argument = actionName
            }
            if (argument) {
                data.options = argument
            }
            socket.emit('dispatch', {argument: actionName, options: argument})
        },
        commit(argument, options) {
            store.commit(argument, options)
            let data = {}
            if (argument) {
                data.argument = argument
            }
            if (options) {
                data.options = options
            }
            socket.emit('commit', {argument, options})
        }
    })
}