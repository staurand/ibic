export const ITEM_STATE = {
    IDLE: 'idle',
    PROCESSING: 'processing',
    PROCESSED: 'processed',
}

// *** Actions/Reducers/Middleware ***
export const ADD = 'Queue/ADD';
export const addToQueue = (payload, queue) => {
    const item = { queue, payload: payload, id: queue + '/' + payload.id}
    return {
        type: ADD,
        item: { ...item, state: ITEM_STATE.IDLE },
    };
}

export const UPDATE = 'Queue/UPDATE_ITEM';
export const updateItemInQueue = (id, payload) => {
    return {
        type: UPDATE,
        id,
        payload
    };
}

export const NEXT = 'Queue/NEXT';
export const processNextItemInQueue = (queue) => {
    return {
        type: NEXT,
        queue
    };
}

export const PROCESS_ITEM = 'Queue/PROCESS_ITEM';
export const processItemInQueue = (id) => {
    return {
        type: PROCESS_ITEM,
        id
    };
}
export const ITEM_PROCESSED = 'Queue/ITEM_PROCESSED';
export const queueItemProcessed = (id) => {
    return {
        type: ITEM_PROCESSED,
        id
    };
}
export const PROCESSED = 'Queue/PROCESSED';
export const queueProcessed = () => {
    return {
        type: PROCESSED,
        queue
    };
}
export const REMOVE_ITEM = 'Queue/REMOVE_ITEM';
export const removeItemInQueue = (id) => {
    return {
        type: REMOVE_ITEM,
        id
    };
}


export const queue = (state = [], action) => {
    switch (action.type) {
        // Add queue item
        case ADD:
            return [...state, action.item];

        // Update queue item
        case UPDATE:
            return state.map((item) => {
                if (item.id === action.id) {
                    return { ...item, payload: { ...item.payload, ...action.payload } };
                }
                return item;
            });
        // Change queue item state
        case PROCESS_ITEM:
        case ITEM_PROCESSED:
            return state.map((item) => {
                if (item.id === action.id) {
                    return { ...item, state: action.type === PROCESS_ITEM ? ITEM_STATE.PROCESSING: ITEM_STATE.PROCESSED };
                }
                return item;
            });
        case REMOVE_ITEM:
            return state.filter((item) => {
                return item.id !== action.id;
            });
        default:
            return state;
    }
}

export const getQueueItemById = (store, id) => {
    const item = store.getState().queue.filter((item) => item.id === id)[0];
    return item;
}
export const getQueueItemToBeProcessed = (store, queueName) => {
    return store.getState().queue.filter((item) => item.state === ITEM_STATE.IDLE && item.queue === queueName);
}
export const getQueueItemProcessing = (store, queueName) => {
    return store.getState().queue.filter((item) => item.state === ITEM_STATE.PROCESSING && item.queue === queueName);
}
export const getQueueItemProcessed = (store, queueName) => {
    return store.getState().queue.filter((item) => item.state === ITEM_STATE.PROCESSED && item.queue === queueName);
}
export const getQueueItemsByQueue = (store, queueName) => {
    return store.getState().queue.filter((item) => item.queue === queueName);
}

/**
 * Manage queue logic. States: NEXT > PROCESS_ITEM > ITEM_PROCESSED. If an item is already processing in the queue, NEXT action has not effect. If the queue is empty, NEXT action triggers PROCESSED action
 * @param store
 * @returns {function(*): function(*=): *}
 */
export const queueMiddleware = (store) => (next) => (action) => {
    const actionResult = next(action);

    switch (action.type) {

        case ITEM_PROCESSED:
            const itemProcessed = getQueueItemById(store, action.id);
            if (itemProcessed) {
                store.dispatch(processNextItemInQueue(itemProcessed.queue));
            }
            break;

        case NEXT:
            const processing = getQueueItemProcessing(store, action.queue);
            const queueList = getQueueItemToBeProcessed(store, action.queue);
            if (processing.length > 0) {
                // do nothing
            } else if (queueList.length > 0) {
                store.dispatch(processItemInQueue(queueList[0].id));
            } else {
                store.dispatch(queueProcessed(action.queue));
            }
            break;

        case PROCESS_ITEM:
            const itemToBeProcessed = getQueueItemById(store, action.id);
            if (itemToBeProcessed) {
                store.dispatch({type: itemToBeProcessed.queue, item: itemToBeProcessed});
            }
            break;

        default:
            return actionResult;
            break;
    }

}
