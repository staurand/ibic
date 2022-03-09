/**
 * Try to force Service Worker update
 * Based on https://whatwebcando.today/articles/handling-service-worker-updates/
 * @returns {Promise<unknown>}
 */
export const update = () => {
    let t;
    const p = new Promise((resolve, reject) => {
        navigator.serviceWorker.getRegistration()
            .then((reg) => {
                const updateFound = () => {
                    if (reg.installing) {
                        // wait until the new Service worker is actually installed (ready to take over)
                        reg.addEventListener('statechange', stateChange);
                    } else  {
                        resolve(false);
                    }
                };
                const stateChange = () => {
                    if (reg.waiting) {
                        // if there's an existing controller (previous Service Worker), force the update
                        if (navigator.serviceWorker.controller) {
                            // Stop all work on the current service worker.
                            navigator.serviceWorker.controller.addEventListener('message', function (event) {
                                if (event.data.command === 'stopped') {
                                    // then force update on the new service worker.
                                    reg.waiting.postMessage({ command: 'skip-waiting' });
                                    resolve(true);
                                }
                            });
                            navigator.serviceWorker.controller.postMessage({ command: 'stop-working' });
                        } else {
                            resolve(false);
                        }
                    }
                }

                // ensure the case when the updatefound event was missed is also handled
                // by re-invoking the prompt when there's a waiting Service Worker.
                if (reg.waiting) {
                    reg.waiting.postMessage({ command: 'skip-waiting' });
                } else {
                    // check for update + add a 10s timeout
                    reg.addEventListener('updatefound', updateFound);
                    t = setTimeout(() => {
                        reg.removeEventListener('updatefound', updateFound);
                        reg.removeEventListener('statechange', stateChange);
                        resolve(false);
                    }, 10000);
                }

            })
            .catch((e) => {
                reject(e);
            });
    });

    p.finally(() => {
        clearTimeout(t);
    });

    return p;
}

export const initSw = ({ sw_url, scope, config, customReplyHandler }) => {
    const replyHandler = customReplyHandler ?? function (sendMessage) {
        return function (event) {
            if (event.data.command === 'get-config') {
                sendMessage({
                    command: 'set-config',
                    config: config
                })
            }
        };
    }
    const swReady = (resolve) => {
        const targetEventHandler = navigator.serviceWorker.controller;
        const eventHandler = navigator.serviceWorker;
        const sendMessage = function(message) {
            var messageChannel = new MessageChannel();
            return new Promise(function(resolve, reject) {
                targetEventHandler.postMessage(message,
                    [messageChannel.port2]);
            });
        }
        eventHandler.addEventListener('message', replyHandler(sendMessage));

        resolve({
            sendMessage,
            eventHandler,
            update
        });
    }
    const p = new Promise((resolve, reject) => {

        if ('serviceWorker' in navigator) {
            if (navigator.serviceWorker.controller) {
                swReady(resolve);
            } else {
                navigator.serviceWorker.register(sw_url, { scope }).then((reg) => {
                    if (navigator.serviceWorker.controller) {
                        swReady(resolve);
                    }
                }).catch(function(error) {
                    // registration failed
                    console.log('Registration failed with ' + error);
                    reject(error);
                });
            }
        } else {
            reject('Service worker unsupported');
        }


    });



    return p;
}
