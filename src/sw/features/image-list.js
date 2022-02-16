import { getConfig } from './config';
import { addToQueue, getQueueItemById, updateItemInQueue, getQueueItemsByQueue, removeItemInQueue, ITEM_STATE } from './queue';
import { OPTIMIZE_IMAGE } from './optimize';

/**
 * Load image list from url
 * @param url
 * @returns {Promise<*|[]|boolean>}
 */
const loadImageList = async (url) => {
    let json = [];
    try {
        const response = await fetch(url);
        json = await response.json();
    } catch (e) {
        console.error(e)
        if (e.type === 'invalid-json') {
            console.error(url, await fetch(url))
        }
        return false;
    }


    return json;
}

/**
 * Load image list from the "image_list_url" config then add images to the OPTIMIZE_IMAGE queue and process it
 * @param store
 * @returns {Promise<void>}
 */
export const updateImageList = async (store) => {
    const config = await getConfig(store);
    const list = await loadImageList(config.image_list_url);
    if (!Array.isArray(list)) {
        return false;
    }
    const newListIds = [];
    list.map((image) => {
        const queueItemId = OPTIMIZE_IMAGE + '/' + image.id;
        let item = getQueueItemById(store, queueItemId);
        const hasChanged = !item || hasURLsListChanged(item.payload.urls, image.urls);
        newListIds.push(queueItemId);

        if (item) {
            if (item.payload.error) {
                // if the item has an error, remove the item and retry
                store.dispatch(removeItemInQueue(item.id));
                item = null;
            } else if (item.state !== ITEM_STATE.IDLE && hasChanged) {
                // if the item is already processing or processed but we have new URLs, add the image to the queue.
                item = null;
            } else if (!hasChanged)  {
                return;
            }
        }

        if (!item) {
            store.dispatch(addToQueue(image, OPTIMIZE_IMAGE));
        } else  {
            store.dispatch(updateItemInQueue(queueItemId, image));
        }
    });

    // Remove items not in the list
    getQueueItemsByQueue(store, OPTIMIZE_IMAGE).forEach((item) => {
        if (newListIds.indexOf(item.id) === -1) {
            store.dispatch(removeItemInQueue(item.id));
        }
    });

    return true;
}

export const hasURLsListChanged = (urls1, urls2) => {
    return urls1.length !==  urls2.length || urls1.filter(value => urls2.includes(value)).length !== urls1.length;
}
