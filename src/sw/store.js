import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { config } from './features/config';
import { queue, queueMiddleware } from './features/queue';
import { otimizeMiddleware } from './features/optimize';
import { serverUpdateMiddleware } from './features/server-update';
import logger from 'redux-logger';
export const middlewares = [
    queueMiddleware,
    otimizeMiddleware,
    serverUpdateMiddleware
];

if (process.env.NODE_ENV === `development`) {
    middlewares.push(logger);
}

export const reducers = {
    config,
    queue
}

export const initStore = (config) => {
    const mergedConfig = {
        reducers: {},
        middlewares: [],
        ...config
    };
    return compose(applyMiddleware(...[...middlewares, ...mergedConfig.middlewares]))(createStore)(combineReducers({ ...reducers, ...mergedConfig.reducers }))
};
export const store = initStore();
