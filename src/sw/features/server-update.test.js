import { initStore } from "../store";
import {
    ITEM_PROCESSED,
    ADD,
    PROCESS_ITEM,
    NEXT,
    UPDATE,
    REMOVE_ITEM,
    addToQueue,
    queueItemProcessed,
    updateItemInQueue,
    getQueueItemById,
} from "./queue";
import { UPLOAD_IMAGE } from "./server-update";
import { OPTIMIZE_IMAGE } from "./optimize";
import { setConfig } from "./config";


const lastAction = (lastAction, action) => {
    return {...action};
}

describe('feature > server update', () => {
    let store;

    beforeEach(() => {
        store = initStore({
            reducers: { lastAction }
        });
        store.dispatch(setConfig({
            "image_list_url": "/dev/back-end/image-list.json",
            "image_upload_url": "/dev/back-end/upload-image.json",
        }))
    });

    test('`serverUpdateMiddleware` should process item when `processNextItemInQueue` is run', async (done) => {
        let actionsExpected = [
            ADD, // OPTIMIZE_IMAGE queue: dispatched manually see below
            UPDATE, //  dispatched manually see below
            ITEM_PROCESSED, // dispatched manually see below
            REMOVE_ITEM, // serverUpdateMiddleware remove the item from the OPTIMIZE_IMAGE queue
            ADD, // serverUpdateMiddleware dispatch ADD item in UPLOAD_IMAGE queue
            NEXT, // serverUpdateMiddleware dispatch NEXT item in UPLOAD_IMAGE queue
            PROCESS_ITEM, // queue process item added
            UPLOAD_IMAGE, // serverUpdateMiddleware upload the image
        ];
        const unsubscribe = store.subscribe(() => {
            try {
                const lastActionDispatched = store.getState().lastAction;
                expect(lastActionDispatched.type).toEqual(actionsExpected[0]);
                actionsExpected.shift();

                if (actionsExpected.length === 0) {
                    unsubscribe();
                    done();
                }
            } catch (e) {
                done(e);
            }

        });

        store.dispatch(addToQueue({ id: '123', urls: ['...'] }, OPTIMIZE_IMAGE));
        store.dispatch(updateItemInQueue(OPTIMIZE_IMAGE + '/123', { datas: { '...': [{ format: 'jpg', data: new Uint8Array(0)}] } } ));
        store.dispatch(queueItemProcessed(OPTIMIZE_IMAGE + '/123' ));
    });

    test('`serverUpdateMiddleware` should not process item that failed in the optimization step', async (done) => {
        let actionsExpected = [
            ADD, // OPTIMIZE_IMAGE queue: dispatched manually see below
            UPDATE, //  dispatched manually see below
        ];
        const unsubscribe = store.subscribe(() => {
            try {
                const lastActionDispatched = store.getState().lastAction;
                expect(lastActionDispatched.type).toEqual(actionsExpected[0]);
                actionsExpected.shift();

                if (actionsExpected.length === 0) {
                    unsubscribe();
                    done();
                }
            } catch (e) {
                done(e);
            }

        });

        store.dispatch(addToQueue({ id: '123', urls: ['...'] }, OPTIMIZE_IMAGE));
        store.dispatch(updateItemInQueue(OPTIMIZE_IMAGE + '/123', {  error: 'Image optimization failed' } ));
    });

    test('`serverUpdateMiddleware` should set error message on the queue item if the upload failed', async (done) => {
        let imageUploadDone = false;
        const unsubscribe = store.subscribe(() => {
            try {
                const lastActionDispatched = store.getState().lastAction;
                if (lastActionDispatched.type === UPLOAD_IMAGE) {
                    imageUploadDone = true;
                } else if (imageUploadDone && lastActionDispatched.type === UPDATE) {
                    unsubscribe();
                    const item = getQueueItemById(store, UPLOAD_IMAGE + '/123');
                    expect(item.payload.error).toEqual('Image upload failed');
                    done();
                }
            } catch (e) {
                done(e);
            }

        });
        store.dispatch(setConfig({
            "image_list_url": "/dev/back-end/image-list.json",
            "image_upload_url": "/dev/back-end/upload-image-failed.json",
        }));

        store.dispatch(addToQueue({ id: '123', urls: ['...'] }, OPTIMIZE_IMAGE));
        store.dispatch(updateItemInQueue(OPTIMIZE_IMAGE + '/123', { datas: { '...': [{ format: 'jpg', data: new Uint8Array(0)}] } } ));
        store.dispatch(queueItemProcessed(OPTIMIZE_IMAGE + '/123' ));


    });

    test('`serverUpdateMiddleware` should set error message on the queue item if the upload request failed', async (done) => {
        let imageUploadDone = false;
        const unsubscribe = store.subscribe(() => {
            try {
                const lastActionDispatched = store.getState().lastAction;
                if (lastActionDispatched.type === UPLOAD_IMAGE) {
                    imageUploadDone = true;
                } else if (imageUploadDone && lastActionDispatched.type === UPDATE) {
                    unsubscribe();
                    const item = getQueueItemById(store, UPLOAD_IMAGE + '/123');
                    expect(item.payload.error).toEqual('Image upload failed');
                    done();
                }
            } catch (e) {
                done(e);
            }

        });
        store.dispatch(setConfig({
            "image_list_url": "/dev/back-end/image-list.json",
            "image_upload_url": "/dev/back-end/wrong_url.json",
        }));

        store.dispatch(addToQueue({ id: '123', urls: ['...'] }, OPTIMIZE_IMAGE));
        store.dispatch(updateItemInQueue(OPTIMIZE_IMAGE + '/123', { datas: { '...': [{ format: 'jpg', data: new Uint8Array(0)}] } } ));
        store.dispatch(queueItemProcessed(OPTIMIZE_IMAGE + '/123' ));


    });

})
