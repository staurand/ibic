import { initStore } from "../store";
import { updateImageList } from "./image-list";
import { setConfig } from "./config";
import { OPTIMIZE_IMAGE } from './optimize';
import { getQueueItemById, getQueueItemsByQueue } from './queue';

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
        expect(getQueueItemById(store, OPTIMIZE_IMAGE + '/1').payload.id).toEqual('1');
        expect(getQueueItemsByQueue(store, OPTIMIZE_IMAGE).length).toEqual(2);
    })

    test('`updateImageList` a second time should update/remove items in OPTIMIZE queue', async () => {
        await updateImageList(store);
        expect(getQueueItemsByQueue(store, OPTIMIZE_IMAGE).length).toEqual(2);

        fetch.mockResponses(JSON.stringify([
            { "id": "1", "urls": ["/dev/back-end/images/image-small.jpg"] }
        ]))

        await updateImageList(store);
        expect(getQueueItemsByQueue(store, OPTIMIZE_IMAGE).length).toEqual(1);
        expect(getQueueItemById(store, OPTIMIZE_IMAGE + '/1').payload.urls.length).toEqual(1);
    })
});
