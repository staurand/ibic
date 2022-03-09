import {
    ITEM_PROCESSED,
    addToQueue,
    getQueueItemById,
    processNextItemInQueue,
    queueItemProcessed,
    updateItemInQueue,
    removeItemInQueue
} from "./queue";
import { getConfig } from './config';
import { OPTIMIZE_IMAGE } from './optimize';


export const IMAGE_UPLOAD_FAILED_ERROR = 'IMAGE_UPLOAD_FAILED_ERROR';
export const UPLOAD_MAX_SIZE_ERROR = 'UPLOAD_MAX_SIZE_ERROR';

/**
 * Upload item with compressed images to the server
 * @param uploadURL
 * @param queueItem like
 {
      queue: 'ServerUpdate/UPLOAD_IMAGE',
      payload: { id: '123', urls: ['...'], datas: { "image_1_url": [{ format: '...', data: Uint8Array }], "image_2_url": [...] },
      id: 'ServerUpdate/UPLOAD_IMAGE/123',
      state: 'processing'
 }
 * @returns {Promise<object>} Returns { success: true } or { success: false, error: '...' }
 */
export const uploadItem = async (uploadURL, queueItem) => {
    const formData = new FormData();
    const { datas, error, ...mediaProps } = queueItem.payload;

    Object.keys(mediaProps).forEach((key) => {
        if (Array.isArray(mediaProps[key])) {
            mediaProps[key].forEach((value) => {
                formData.append(key + '[]', value)
            });
        } else {
            formData.append(key, mediaProps[key]);
        }
    });

    if (error) {
        formData.append('error', error);
    } else {
        mediaProps.urls.forEach((url, index) => {
            datas[url].map((imageData) => {
                formData.append('media[' + index + '][' + imageData.format + ']', new Blob([imageData.image]));
            });
        });
    }

    var myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json')

    try {
        const uploadResponse = await fetch(uploadURL, { method: 'POST', body: formData, headers: myHeaders });
        if (uploadResponse.status >= 400) {
            let error = IMAGE_UPLOAD_FAILED_ERROR;
            if (uploadResponse.status === 413) {
                error = UPLOAD_MAX_SIZE_ERROR;
            }
            return { success: false, error };
        }

        const uploadResponseJson = await uploadResponse.json();
        if (!uploadResponseJson) {
            return { success: false, error: IMAGE_UPLOAD_FAILED_ERROR };
        }
        return uploadResponseJson;
    } catch (error) {
        return { success: false, error: IMAGE_UPLOAD_FAILED_ERROR };
    }
}

export const UPLOAD_IMAGE = 'ServerUpdate/UPLOAD_IMAGE';
/**
 * When an OPTIMIZE_IMAGE item has been processed in the queue, add it to the UPLOAD_IMAGE queue and process it
 * @param store
 * @returns {function(*): function(*=): Promise<*>}
 */
export const serverUpdateMiddleware = (store) => (next) => async (action) => {
    const actionResult = next(action);

    if (action.type === ITEM_PROCESSED) {
        const item = getQueueItemById(store, action.id);
        if (item && item.queue === OPTIMIZE_IMAGE) {
            store.dispatch(removeItemInQueue(item.id));
            store.dispatch(addToQueue(item.payload, UPLOAD_IMAGE));
            store.dispatch(processNextItemInQueue(UPLOAD_IMAGE));
        }
    } else if (action.type === UPLOAD_IMAGE) {
        const config = await getConfig(store);

        const uploadResponse = await uploadItem(config.image_upload_url, action.item);
        store.dispatch(queueItemProcessed(action.item.id));
        if (!uploadResponse.success) {
            store.dispatch(updateItemInQueue(action.item.id, { error: 'Image upload failed', errors: [ uploadResponse.error ] }));
        }
        // Remove optimized images datas.
        store.dispatch(updateItemInQueue(action.item.id, { datas: {} }));
    }

    return actionResult;
}
