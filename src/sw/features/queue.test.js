import { initStore } from "../store";
import { ADD, ITEM_STATE, addToQueue, updateItemInQueue, getQueueItemById, getQueueItemToBeProcessed, processNextItemInQueue, queueItemProcessed, removeItemInQueue } from './queue';
import { v4 as uuidv4 } from 'uuid';
const lastAction = (lastAction, action) => {
    return {...action};
}

describe('feature > queue', () => {
    let store;
    const payload = { id: '123', urls: ['...'] };
    const payload2 = { id: '124', urls: ['...2'] };
    const queue = 'QueueTest/test';
    const uuid = uuidv4();
    const id = queue + '/' + uuid;
    const item = {
        queue,
        payload,
        id,
        state: ITEM_STATE.IDLE
    };
    const item2InQueue = addToQueue(payload2, queue, uuid).item;
    const itemProcessing = {
      ...item,
      state: ITEM_STATE.PROCESSING
    };

    beforeEach(() => {
        store = initStore({
            reducers: { lastAction }
        });
    });

    test('queue should be initialized in store', () => {
        expect(store.getState().queue).toEqual([]);
        expect(store.getState().queue).not.toEqual({});
    })

    test('`addToQueue` should return an action to add an item to the queue', () => {
        const expectedAction = {
            type: ADD,
            item,
        }
        expect(addToQueue(payload, queue, uuid)).toEqual(expectedAction)
    })

    test('`addToQueue` should add an item to the queue', () => {
        expect(store.getState().queue.length).toEqual(0);

        store.dispatch(addToQueue(payload, queue, uuid));

        expect(store.getState().queue[0]).toEqual(item);
        expect(store.getState().queue.length).toEqual(1);

        store.dispatch(addToQueue(payload2, queue, uuid));

        expect(store.getState().queue[1]).toEqual(item2InQueue);
        expect(store.getState().queue.length).toEqual(2);
    })

    test('`updateItemInQueue` should update item\'s payload', () => {
        const updatedPayload = {
            ...payload,
            urls: ['updated_url'],
        };
        store.dispatch(addToQueue(payload, queue, uuid));
        expect(store.getState().queue[0]).toEqual(item);
        store.dispatch(updateItemInQueue(id, updatedPayload));
        expect(store.getState().queue[0].payload).toEqual(updatedPayload);
    });

    test('`getQueueItemById` should return the item identified by the `id`', () => {
        expect(getQueueItemById(store, id)).toEqual(undefined);

        store.dispatch(addToQueue(payload, queue, uuid));

        expect(getQueueItemById(store, id)).toEqual(item);

        expect(getQueueItemById(store, '100')).toEqual(undefined);
    })

    test('`getQueueItemToBeProcessed` should return the items to be processed in the `queue`', () => {
        expect(getQueueItemToBeProcessed(store, queue)).toEqual([]);

        store.dispatch(addToQueue(payload, queue, uuid));

        expect(getQueueItemToBeProcessed(store, queue)).toEqual([item]);

        store.dispatch(processNextItemInQueue(queue));

        expect(getQueueItemToBeProcessed(store, queue)).toEqual([]);
    })

    test('`processNextItemInQueue` should process the next item in the `queue`', () => {
        expect(store.getState().queue.length).toEqual(0);
        store.dispatch(addToQueue(payload, queue, uuid));
        store.dispatch(processNextItemInQueue(queue));
        expect(store.getState().queue[0].state).toEqual(ITEM_STATE.PROCESSING);
        store.dispatch(addToQueue(payload2, queue, uuid));
        store.dispatch(processNextItemInQueue(queue));
        expect(store.getState().queue[0].state).toEqual(ITEM_STATE.PROCESSING);
        expect(store.getState().queue[1].state).toEqual(ITEM_STATE.IDLE);
    })

    test('`queueItemProcessed` should change the state of the item identified by the `id`', () => {
        expect(store.getState().queue.length).toEqual(0);
        store.dispatch(addToQueue(payload, queue, uuid));
        expect(store.getState().queue[0].state).toEqual(ITEM_STATE.IDLE);
        store.dispatch(queueItemProcessed('100'));
        expect(store.getState().queue[0].state).toEqual(ITEM_STATE.IDLE);
        store.dispatch(queueItemProcessed(id));
        expect(store.getState().queue[0].state).toEqual(ITEM_STATE.PROCESSED);
        expect(store.getState().queue.length).toEqual(1);
    })

    test('`removeItemInQueue` should remove item identified by the `id`', () => {
        expect(store.getState().queue.length).toEqual(0);
        store.dispatch(addToQueue(payload, queue, uuid));
        expect(store.getState().queue.length).toEqual(1);
        store.dispatch(removeItemInQueue(id));
        expect(store.getState().queue.length).toEqual(0);
    })

})
