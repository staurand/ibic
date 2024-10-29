import { initStore } from "../store";
import { setConfig, configCommandHandler, getConfig, DEFAULT_CONFIG } from "./config";

const config = {
    "image_list_url": "/dev/back-end/image-list.json"
}
const configWithDefaults = {
    ...DEFAULT_CONFIG,
    "image_list_url": "/dev/back-end/image-list.json"
}
const config2 = {
    "image_list_url": "/dev/back-end/image-list.json2"
}
const config2WidthDefaults = {
    ...DEFAULT_CONFIG,
    "image_list_url": "/dev/back-end/image-list.json2"
}

describe('feature > config', () => {
    let store;
    beforeEach(() => {
        store = initStore();
    });

    test('config should be initialized in store', () => {
        expect(store.getState().config).toEqual(null);
        expect(store.getState().config).not.toEqual(config);
        expect(store.getState().config).not.toEqual(configWithDefaults);
    })

    test('`setConfig` should set config in store', () => {
        expect(store.getState().config).not.toEqual(config);

        store.dispatch(setConfig(config))

        expect(store.getState().config).toEqual(configWithDefaults);
        expect(store.getState().config).not.toEqual(config);
        expect(store.getState().config).not.toEqual(config2);
    })

    test('`setConfig` should update config in store', () => {
        expect(store.getState().config).not.toEqual(config2);

        store.dispatch(setConfig(config2))

        expect(store.getState().config).not.toEqual(config);
        expect(store.getState().config).not.toEqual(config2);
        expect(store.getState().config).toEqual(config2WidthDefaults);
    })

    test('`set-config` command should update config in store', () => {
        expect(store.getState().config).not.toEqual(config);

        configCommandHandler(store)('set-config', { config });

        expect(store.getState().config).toEqual(configWithDefaults);
        expect(store.getState().config).not.toEqual(config);
        expect(store.getState().config).not.toEqual(config2);
    })

    test('`getConfig` should return config in store', () => {
        expect(store.getState().config).toEqual(null);

        const returnedInitialConfig = getConfig(store);
        expect(store.getState().config).toEqual(returnedInitialConfig);

        store.dispatch(setConfig(config))

        const returnedUpdatedConfig = getConfig(store);
        expect(store.getState().config).toEqual(returnedUpdatedConfig);
    })

});

