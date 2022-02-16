export const globalEventHandler = (eventHandler) => {
    const commandHandlers = [];

    eventHandler.addEventListener('install', function(event) {

    });

    eventHandler.addEventListener('activate', function(event) {

    });

    eventHandler.addEventListener('message', async function(event) {
        if (event.data && event.data.command) {
            commandHandlers.map((commandHandler) => commandHandler(event.data.command, event.data, event.source));
        }
    });

    return {
        addCommandHandler: (commandHandler) => {
            commandHandlers.push(commandHandler);
        }
    };
}
