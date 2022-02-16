export const run = (eventHandler, sendMessage) => {
    eventHandler.addEventListener('message', replyHandler(sendMessage));

    sendMessage({command: 'get-update'});
}

let commandList = [
    {
        command: 'get-config',
        action: (sendMessage) => {
            sendMessage({
                command: 'set-config',
                config: {
                    "codecs_path": "/dist/codecs/",
                    "image_list_url": "/dev/back-end/image-list.json",
                    "image_upload_url": "/dev/back-end/upload-image.json",
                }
            });

            // Try to get update again later...
            setTimeout(function () {
                // then request update
                sendMessage({command: 'get-update'});
            }, 10);
        }
    },
    // the second time change the image list
    {
        command: 'get-config',
        action: (sendMessage) => {
            sendMessage({
                command: 'set-config',
                config: {
                    "codecs_path": "/dist/codecs/",
                    "image_list_url": "/dev/back-end/image-list-2.json",
                    "image_upload_url": "/dev/back-end/upload-image.json",
                }
            });
        }
    }
];
export const replyHandler = (sendMessage) => (event) => {
    console.log('front: receive message', event.data, event)
    if (commandList.length > 0 && commandList[0].command === event.data.command) {
        const next = commandList.shift();
        next.action(sendMessage);
    }
};
