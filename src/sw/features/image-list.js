import { getConfig } from './config';
import {
    addToQueue,
    getQueueItemById,
    updateItemInQueue,
    getQueueItemsByQueue,
    removeItemInQueue,
    ITEM_STATE,
    getQueueItemsByPayloadId
} from './queue';
import { OPTIMIZE_IMAGE } from './optimize';
import { UPLOAD_IMAGE } from './server-update';

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
 * @returns {Promise<boolean>}
 */
export const updateImageList = async (store) => {
    const config = await getConfig(store);
    const list = await loadImageList(config.image_list_url);
    if (!Array.isArray(list)) {
        return false;
    }
    const newOptimizeListIds = [];
    list.map((image) => {
        let item = null;
        let items = getQueueItemsByPayloadId(store, image.id);
        items.forEach((queueItem) => {
            if (!item && queueItem.queue === OPTIMIZE_IMAGE) {
                item = queueItem;
                newOptimizeListIds.push(item.id);
            } else if (queueItem.queue === UPLOAD_IMAGE) {
                item = queueItem;
            }
        });


        let shouldBeAdded = !item;
        let shouldBeUpdated = item && item.state !== ITEM_STATE.PROCESSING && hasURLsListChanged(item.payload.urls, image.urls);
        if (item) {
            if (item.payload.error) {
                shouldBeAdded = false;
                shouldBeUpdated = false;
            }
        }
        if (shouldBeAdded) {
            const newQueueItem = addToQueue(image, OPTIMIZE_IMAGE);
            store.dispatch(newQueueItem);
            newOptimizeListIds.push(newQueueItem.item.id);
        } else if (shouldBeUpdated)  {
            store.dispatch(updateItemInQueue(item.id, image));
        }
        // last cases: the item has not changed or the item is in processing state (wait for it to be in IDLE / PROCESSED state)
    });

    // Remove items not in the list
    getQueueItemsByQueue(store, OPTIMIZE_IMAGE).forEach((item) => {
        if (newOptimizeListIds.indexOf(item.id) === -1) {
            const itemToBeRemoved = getQueueItemById(store, item.id);
            // Don't remove item in processing state
            if (itemToBeRemoved.state !== ITEM_STATE.PROCESSING) {
                store.dispatch(removeItemInQueue(item.id));
            }
        }
    });

    // Limit the size of the processed items in the upload queue to 10
    let countUploadProcessedItems = 0;
    getQueueItemsByQueue(store, UPLOAD_IMAGE).forEach((item) => {
        if (item.state === ITEM_STATE.PROCESSED && !item.payload.error) {
            countUploadProcessedItems+=1;
            if (countUploadProcessedItems > 10) {
                store.dispatch(removeItemInQueue(item.id));
            }
        }
    });

    return true;
}

export const hasURLsListChanged = (urls1, urls2) => {
    return urls1.length !==  urls2.length || urls1.filter(value => urls2.includes(value)).length !== urls1.length;
}
