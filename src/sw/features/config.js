export const getConfig = (store) => {
    return store.getState().config;
};

/**
 * Request config update from the client
 * @param store
 * @param client
 * @returns {Promise<unknown>}
 */
export const refreshConfig = async (store, client) => {
    return new Promise(function(resolve, reject) {
        const currentConfig = store.getState().config;
        // When the config has changed resolve the promise
        const unsubscribe = store.subscribe(() => {
            if (currentConfig !== store.getState().config) {
                unsubscribe();
                resolve(store.getState().config);
            }
        });
        client.postMessage({
            command: 'get-config'
        });
    });
};

// *** API ***
export const configCommandHandler = (store) => {
    return (command, data, source) => {
        if (command === 'set-config') {
            store.dispatch(setConfig({ ...data.config }));
        }
    }
}

// *** Actions/Reducers/Slices ***
export const SET_CONFIG = 'SET_CONFIG';
export const setConfig = (config) => {
    return {
        type: SET_CONFIG,
        config
    };
}

export const config = (state = null, action) => {
    switch (action.type) {
        case SET_CONFIG:
            return action.config;
        default:
            return state;
    }
}
