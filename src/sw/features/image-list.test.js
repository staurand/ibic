import { initStore } from "../store";
import { updateImageList } from "./image-list";
import { setConfig } from "./config";
import { OPTIMIZE_IMAGE } from './optimize';
import {
    ITEM_STATE,
    getQueueItemById,
    getQueueItemsByQueue,
    updateItemStateInQueue
} from './queue';

describe('feature > image list', () => {
    let store;

    beforeEach(() => {
        fetch.mockResponses(JSON.stringify([
            { "id": "1", "urls": ["/dev/back-end/images/image-small.jpg", "/dev/back-end/images/image-small-2.jpg"] },
            { "id": "2", "urls": ["/dev/back-end/images/image-small.png"] }
        ]))
        store = initStore({});
        store.dispatch(setConfig({
            "image_list_url": "/dev/back-end/image-list.json",
            "image_upload_url": "/dev/back-end/upload-image.json",
        }))
    });

    test('`updateImageList` should update items in OPTIMIZE queue', async () => {
        await updateImageList(store);
        const queueItems = getQueueItemsByQueue(store, OPTIMIZE_IMAGE);
        expect(queueItems.length).toEqual(2);
        expect(getQueueItemById(store, queueItems[0].id).payload.id).toEqual('1');

    })

    test('`updateImageList` a second time should update/remove items in OPTIMIZE queue', async () => {
        await updateImageList(store);
        const queueItems = getQueueItemsByQueue(store, OPTIMIZE_IMAGE);
        expect(queueItems.length).toEqual(2);

        fetch.mockResponses(JSON.stringify([
            { "id": "1", "urls": ["/dev/back-end/images/image-small.jpg"] }
        ]))

        await updateImageList(store);
        const queueItems2 = getQueueItemsByQueue(store, OPTIMIZE_IMAGE);
        // The item with id 2 has been removed
        expect(queueItems2.length).toEqual(1);
        expect(getQueueItemById(store, queueItems[1].id)).toEqual(undefined);
        // The item with id 1 has been updated
        expect(getQueueItemById(store, queueItems2[0].id).payload.urls.length).toEqual(1);
    })

    test('`updateImageList` a second time should not update/remove processing items', async () => {
        await updateImageList(store);
        const queueItems = getQueueItemsByQueue(store, OPTIMIZE_IMAGE);
        expect(queueItems.length).toEqual(2);
        store.dispatch(updateItemStateInQueue(queueItems[0].id, ITEM_STATE.PROCESSING));
        fetch.mockResponses(JSON.stringify([
            { "id": "1", "urls": ["/dev/back-end/images/image-small.jpg"] },
            { "id": "2", "urls": ["/dev/back-end/images/image-small.png", "/dev/back-end/images/image-small-2.png"] }
        ]))

        await updateImageList(store);
        // The item with id 1 has not been updated because it was processing
        expect(getQueueItemById(store, queueItems[0].id).payload.urls.length).toEqual(2);
        // The item with id 2 has been updated because it was not processing
        expect(getQueueItemById(store, queueItems[1].id).payload.urls.length).toEqual(2);

        store.dispatch(updateItemStateInQueue(queueItems[0].id, ITEM_STATE.PROCESSED));

        fetch.mockResponses(JSON.stringify([
            { "id": "1", "urls": ["/dev/back-end/images/image-small.jpg"] },
            { "id": "2", "urls": ["/dev/back-end/images/image-small.png", "/dev/back-end/images/image-small-2.png"] }
        ]))
        await updateImageList(store);
        // The item with id 1 has been updated because it was processed
        expect(getQueueItemById(store, queueItems[0].id).payload.urls.length).toEqual(1);


        store.dispatch(updateItemStateInQueue(queueItems[1].id, ITEM_STATE.PROCESSING));
        fetch.mockResponses(JSON.stringify([
            { "id": "1", "urls": ["/dev/back-end/images/image-small.jpg"] },
        ]))
        await updateImageList(store);
        // The item with id 1 has not been updated because it has not changed
        expect(getQueueItemById(store, queueItems[0].id).payload.urls.length).toEqual(1);
        // The item with id 2 has not been removed because it was not processing
        expect(getQueueItemById(store, queueItems[1].id).payload.urls.length).toEqual(2);
    });
});
