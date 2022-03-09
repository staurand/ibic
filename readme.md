# IBIC (In Browser Image Compression)
IBIC is a library that compresses images in the browser.
It has been build to be used with a server ; IBIC retrieves images to compress from the server and send back the images compressed in different formats.

## Usage
In the dist folder you will find:
- sw.js: The service worker that compresses the images
- sw-init.js: A module that helps to communicate with the service worker
- codecs folder: A folder containing the wasm files used by the service worker to compress the images
```javascript
import { initSw } from './sw-init.js';

/**
 * Callback of the `initSw` function if the service worker has been properly initialized.
 * @param {Object} serviceWorkerParam
 * @param {function} serviceWorkerParam.sendMessage A function to send command to the service worker
 * @param {Object} serviceWorkerParam.eventHandler An event handler used to receive events from the service worker
 */
function callback({ sendMessage, eventHandler }) {
    // if you want to refresh the image list in the service worker, use the code below (e.g after a new image has been uploaded on the server)
    sendMessage({command: 'get-update'});

    // You can listen to events sent by the service worker to get updates on the image compression state
    eventHandler.addEventListener('message', function (event) {
        if (event.data.command === 'queue-updated') {
            /*
            the `event.data.queue` contains the list of images currently processed by the service worker.
            e.g: 
            [
                {
                    payload: {
                        id: 1,
                        name: 'test.png',
                        urls: ["http://...", "http://..."],
                        error: '...', // plain text error if any
                        errors: [], // errors code: 'UNSUPPORTED_IMAGE_TYPE', 'CANT_READ_IMAGE_ERROR' or 'UPLOAD_MAX_SIZE_ERROR' 
                    },
                    state: "processing"
                },
                ...
            ]
            */
        }
    });
}
/**
 * If the service worker can't be initialized this function will be called,
 * @param {string} error Error message sent by `initSw`
 */
function onError(error) {

}

initSw({
    sw_url: '...', // URL of sw.js file 
    scope: '/', // the scope of the service worker*
    config: {
        codecs_path: '...', // URL of the folder containing the codecs
        image_list_url: '...', // the server URL that will return the image list to process
        image_upload_url: '...', // the server URL that will receive the compressed images
    }
})
    .then(callback) 
    .catch(onError);
```  
* scope: [More information on the service worker scope](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#parameters)

## Server side API
The server should be able to handle two endpoints defined by the `image_list_url` and `image_upload_url` property in the config.
### image_list_url: the server URL that will return the image list to process
This endpoint should return a json response following the format below:
```
[
    {
        id: the id of the image (e.g 44),
        name: the name of the image (e.g "test.png"),
        urls: a list of image urls (e.g ["http://example.org/image-44.png", "http://example.org/image-44-200x100.png"]
    },
    {
        id: ...,
        name: ...,
        urls: ...
    },
    ....
]
```
Only the images that have to be compressed should be returned.

### image_upload_url, the server URL that will receive the compressed images
This endpoint will receive a post request from the service worker.  
It's responsible to save the compressed images on the server and to mark images as processed (to exclude them from the `image_list_url`)

POST:
- id: the image id (the one sent by the `image_list_url` endpoint)
- urls: the list of urls processed
- error: the error message if any

_The below is based on PHP_

FILES:
- media
  - name
    - [0...n]: the index of the name based on the urls index
      - [file format]: the file format (e.g webp, jpg...)
  - tmp_name
  - size

So to get access to the compressed image file path of the first URL in webp format:
$_FILES['media']['tmp_name'][0]['webp']

The json response should be as below:  
`{"success":false}` or `{"success":true}` 

## Compatibility

### Image formats
The library will convert jpg to optimized jpg & webp and png to optimized png & webp images.

### Browsers support
The IBIC library supports up-to-date modern browsers: Firefox, Chrome, Safari & Edge.

### Troubleshooting
- If your webserver does not send the right mime type for wasm file (application/wasm), the service worker won't be able to use them.  
- The service worker won't be updated until you close all the pages connected to it. [The Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#waiting)  
During development, you can force the service worker to reload on page refresh. [Update on reload](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle#update_on_reload).  

## Test, dev and build

### To launch tests
Run: `npm run test`

### To test the library:
Run: `npm run dev`
  
Install node serve (https://github.com/vercel/serve)  
Generate certificates with mkcert (https://github.com/FiloSottile/mkcert)
Then run:  
`serve --ssl-cert ./localhost.pem --ssl-key ./localhost-key.pem`  
You will then have access to:  
https://localhost:5000/dev/front/

### To build the library:
Run: `npm run build`  
It will populate the dist folder.

## Credits
Squoosh (https://github.com/GoogleChromeLabs/squoosh)

