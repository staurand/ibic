import { globalEventHandler } from "./global-event-handler.js";
import { configCommandHandler } from "./features/config.js";
import { appCommandHandler } from "./features/app.js";

export const bootstrap = async ({ store }) => {

    //store.subscribe(() => console.log('store changed bis', store.getState()))

    const gEventHandler = globalEventHandler(self);
    gEventHandler.addCommandHandler(configCommandHandler(store));
    gEventHandler.addCommandHandler(appCommandHandler(store));
}
