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
 * @param {int} maxFileUploads Max number of files to upload in each request.
 * @param {int} offset Offset if we have to make more than one request to push all the files.
 * @returns {Promise<object>} Returns { success: true } or { success: false, error: '...' }
 */
export const uploadItem = async (uploadURL, queueItem, maxFileUploads, offset = 0) => {
    const formData = new FormData();
    const { datas, error, ...mediaProps } = queueItem.payload;
    let currentIndex = 0;
    let partial = false;

    Object.keys(mediaProps).forEach((key) => {
        if (key === 'urls') {
            return;
        }
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
        let countItemsAdded = 0;
        let newIndex = 0;
        mediaProps.urls.forEach((url, index) => {
            if (countItemsAdded + datas[url].length <= maxFileUploads) {
                if (index >= offset) {
                    datas[url].map((imageData) => {
                        formData.append('media[' + newIndex + '][' + imageData.format + ']', new Blob([imageData.image]));
                    });
                    countItemsAdded += datas[url].length;
                    currentIndex = index;
                    formData.append('urls[]', url);
                    newIndex+=1;
                }
            } else {
                partial = true;
            }
        });
    }

    formData.set('partial', partial ? '1' : '0');

    var myHeaders = new Headers();
    myHeaders.append('Accept', 'application/json')

    try {
        const uploadResponse = await fetch(uploadURL, { method: 'POST', body: formData, headers: myHeaders });
        if (uploadResponse.status >= 400) {
            let errorMessage = IMAGE_UPLOAD_FAILED_ERROR;
            if (uploadResponse.status === 413) {
                errorMessage = UPLOAD_MAX_SIZE_ERROR;
            }
            return { success: false, error: errorMessage };
        }

        const uploadResponseJson = await uploadResponse.json();
        if (!uploadResponseJson) {
            return { success: false, error: IMAGE_UPLOAD_FAILED_ERROR };
        }
        if (partial) {
            return uploadItem(uploadURL, queueItem, maxFileUploads, currentIndex + 1);
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

        const uploadResponse = await uploadItem(config.image_upload_url, action.item, config.max_file_uploads);
        store.dispatch(queueItemProcessed(action.item.id));
        if (!uploadResponse.success) {
            if (uploadResponse.error) {
                // If the server returned an error saves this error in the queue item.
                store.dispatch(updateItemInQueue(action.item.id, { error: 'Image upload failed', errors: [ uploadResponse.error ] }));
            } else {
                // If we don't have an error from the server, don't override the queue item errors.
                store.dispatch(updateItemInQueue(action.item.id, { error: 'Image compression failed' }));
            }

        }
        // Remove optimized images datas.
        store.dispatch(updateItemInQueue(action.item.id, { datas: {} }));
    }

    return actionResult;
}
