'use strict';
import { initSw } from './sw-init.js';
import { run, replyHandler } from './tests-suite.js'

const runTestSuite = ({ sendMessage, eventHandler }) => {
    run(navigator.serviceWorker, sendMessage);
    eventHandler.addEventListener('message', function (event) {
        if (event.data.command === 'queue-updated') {
            console.log('Queue updated', event.data)
        }
    });
}


initSw({
    sw_url: '/dist/sw.js',
    scope: '/',
    config: {
        "codecs_path": "/dist/codecs/",
        "image_list_url": "/dev/back-end/image-list.json",
        "image_upload_url": "/dev/back-end/upload-image.json",
    },
    customReplyHandler: replyHandler
})
    .then(runTestSuite)
    .catch(function (e) {
        console.log(e)
    });
