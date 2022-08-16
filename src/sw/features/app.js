import { refreshConfig } from './config.js';
import { updateImageList } from "./image-list.js";
import {
    processNextItemInQueue,
    getQueueItemsByQueue,
    getQueueItemProcessed,
    ITEM_STATE,
    getQueueItemToBeProcessed,
    removeItemInQueue,
    getQueueItemByPayloadId
} from "./queue.js";
import { OPTIMIZE_IMAGE } from "./optimize.js";
import { UPLOAD_IMAGE } from "./server-update.js";

/**
 * Refresh queue from the server image list
 * @param store
 * @param source
 * @returns {Promise<*[]|boolean>}
 */
export const refreshQueue = async (store, source) => {
    const config = await refreshConfig(store, source);
    const success = await updateImageList(store);
    if (!success) {
        return false;
    }
    store.dispatch(processNextItemInQueue(OPTIMIZE_IMAGE));
    return prepareQueueForFront(store);
}

let intervalID = null;
let interval = 5000;
/**
 * Interval updater handler
 * @param store
 * @param source
 * @returns {function(): void}
 */
const intervalUpdater = (store, source) => {
    return async () => {
        const queue = await refreshQueue(store, source);
        // Something went wrong?
        if (queue === false) {
            interval = 5000;
            clearTimeout(intervalID);
            return;
        }
        const queueItemProcessed = getQueueItemProcessed(store, OPTIMIZE_IMAGE).concat(getQueueItemProcessed(store, UPLOAD_IMAGE));
        const queueCompleted = queue.length === 0 || queueItemProcessed.length === queue.length
        // If the queue is completed increase the next check interval
        if (queueCompleted) {
            interval += 5000;
        } else {
            interval = 5000;
        }

        // if the queue is queueCompleted send "queue-updated" command (it might not be handled by `appStateUpdater`)
        if (queueCompleted) {
            sendMessageToAllClients({
                command: 'queue-updated',
                queue: prepareQueueForFront(store)
            });
        }

        clearTimeout(intervalID);
        intervalID = setTimeout(intervalUpdater(store, source), interval);
    }
};

const sendMessageToAllClients = (message) => {
    clients.matchAll({type: 'window'}).then((clientList) => {
        clientList.forEach(client => {
            client.postMessage(message);
        });
    });
};

/**
 * Manage 'get-update' command from the client: get config + update image list
 * @param store
 * @returns {function(*, *, *=): Promise<void>}
 */
export const appCommandHandler = (store) => {
    appStateUpdater(store);
    return async (command, data, source) => {
        if (command === 'get-update') {
            intervalUpdater(store, source)();
        } else if (command === 'remove-item') {
            const item = getQueueItemByPayloadId(store, data.id);
            if (item) {
                store.dispatch(removeItemInQueue(item.id));
            }
        } else if (command === 'skip-waiting') {
            skipWaiting();
        } else if (command === 'stop-working') {
            clearTimeout(intervalID);

            getQueueItemToBeProcessed(store, OPTIMIZE_IMAGE)
                .concat(getQueueItemToBeProcessed(store, UPLOAD_IMAGE))
                .forEach((item) => {
                    store.dispatch(removeItemInQueue(item.id));
                });

            store.subscribe(() => {
                if (getQueueItemProcessing(store, OPTIMIZE_IMAGE)
                    .concat(getQueueItemProcessing(store, UPLOAD_IMAGE))
                    .length === 0) {
                    sendMessageToAllClients({
                        command: 'stopped'
                    });
                }
            });

        }
    }
}

/**
 * When the queue is updated, send 'queue-updated' to the client
 * @type {function(*=, *): *}
 */
export const appStateUpdater = ((store) => {
    let queue = null;
    return store.subscribe(() => {
        if (store.getState().queue !== queue) {
            queue = store.getState().queue;
            sendMessageToAllClients({
                command: 'queue-updated',
                queue: prepareQueueForFront(store)
            });
        }
    })
})

/**
 * Adapt the queue format to send only useful information to the client
 * @param store
 * @returns {*[]}
 */
export const prepareQueueForFront = (store) => {
    return [
        ...getQueueItemsByQueue(store, UPLOAD_IMAGE).map(({ payload, state }) => {
            const { datas, ...lightPayload } = payload;
            return {
                payload: lightPayload,
                state
            };
        }),
        ...getQueueItemsByQueue(store, OPTIMIZE_IMAGE)
            .filter(({ state }) => {
                return state !== ITEM_STATE.PROCESSED;
            })
            .map(({ payload, state }) => {
                const { datas, ...lightPayload } = payload;
                return {
                    payload: lightPayload,
                    state
                };
            }),
    ];
}
