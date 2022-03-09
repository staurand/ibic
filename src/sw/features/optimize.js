import { encodeToJpg, decodeJpg } from '../formats/jpeg.js'
import { encodeToWebp } from '../formats/webp.js'
import { encodeToPng, decodePng } from '../formats/png.js'
import { queueItemProcessed, updateItemInQueue } from "./queue";
import { getConfig } from './config';

export const UNSUPPORTED_IMAGE_TYPE = 'UNSUPPORTED_IMAGE_TYPE';
export const CANT_READ_IMAGE_ERROR = 'CANT_READ_IMAGE_ERROR';

/**
 * Optimize images retreived from the item urls.
 * @param urls
 * @param config
 * @returns {Promise<{success: boolean, datas: {}, error: string, errors: string[]}>}
 */
export const optimizeImages = async ({ urls }, config) => {
    let result = { success: true, datas: {}, error: '', errors: [] };
    for (let index = 0; index < urls.length; index ++) {
        const url = urls[index];
        const { success, error, data } = await optimizeImage(url, config);
        if (success) {
            result.datas[url] = data;
        } else {
            result.success = false;
            result.datas[url] = false;
            result.error += error;
            result.errors.push(error);
        }
    }
    return result;
}

/**
 * Optimize the image based on the url parameter
 * @param url
 * @param config
 * @returns {Promise<{success: boolean, error: (string)}|{data: [], success: boolean}>}
 */
export const optimizeImage = async (url, config) => {
    const result = await optimize(url, config);

    if (typeof result !== 'string') {
        return { success: true, data: result };
    }
    return { success: false, error: result };
}

/**
 * Get file extension from the url
 * @param url
 * @returns {{ext: T}}
 */
export const getUrlInfo = (url) => {
    const urlInfo = url.split('.');
    const ext = urlInfo.pop();
    return { ext };
}

/**
 * Return optimzed image formats based on the original one.
 * @param ext
 * @returns {[string, string]|*[]}
 */
export const getImageOutputFormats = (ext) => {
    switch (ext) {
        case 'jpg':
        case 'jpeg':
            return ['jpg', 'webp'];
        case 'png':
            return ['png', 'webp'];
        default:
            return [];
    }
}

/**
 * Based on the url parameter, find out what should be the format of the compressed images and process them.
 * @param url
 * @param config
 * @returns {Promise<string|[]>}
 */
export const optimize = async (url, config) => {
    const { ext } = getUrlInfo(url);
    const formats = getImageOutputFormats(ext);

    const imageData = await decode(url, config.codecs_path);

    const optimizedImages = [];
    for (let index = 0; index < formats.length; index ++) {
        const format = formats[index];
        let image = false;
        switch (format) {
            case 'jpg':
                image = await encodeToJpg(imageData, config.codecs_path);
                break;
            case 'webp':
                image = await encodeToWebp(imageData, config.codecs_path);
                break;
            case 'png':
                image = await encodeToPng(imageData);
                break;
        }

        if (image) {
            optimizedImages.push({ format, image });
        } else {
            optimizedImages.push(false);
        }
    }

    const success = optimizedImages.reduce((result, optimizedImageBuffer) => result && optimizedImageBuffer !== false, true);

    if (!success) {
        return 'The image optimization failed';
    }
    return optimizedImages;
}

/**
 * Decode image based on the url parameter.
 * @param url
 * @param codecs_path
 * @returns {Promise<string|*>}
 */
export const decode = async (url, codecs_path) => {
    const { ext } = getUrlInfo(url);
    try {
        switch (ext) {
            case 'jpg':
            case 'jpeg':
                return await decodeJpg(url, codecs_path);
            case 'png':
                return await decodePng(url, codecs_path);
            default:
                return UNSUPPORTED_IMAGE_TYPE;
        }
    } catch (e) {
        console.log(e);
        return CANT_READ_IMAGE_ERROR;
    }

}

// *** Actions/Middleware ***
export const OPTIMIZE_IMAGE = 'Optimize/image';
/**
 * When the OPTIMIZE_IMAGE action is triggered run `optimizeImages` function on the item
 * @param store
 * @returns {function(*): function(*=): Promise<*>}
 */
export const otimizeMiddleware = (store) => (next) => async (action) => {
    const actionResult = next(action);
    const config = getConfig(store);

    switch (action.type) {
        case OPTIMIZE_IMAGE:
            const result = await optimizeImages(action.item.payload, config);
            if (!result.success) {
                store.dispatch(updateItemInQueue(action.item.id, { error: result.error, errors: result.errors } ));
            } else {
                store.dispatch(updateItemInQueue(action.item.id, { datas: result.datas } ));
            }
            store.dispatch(queueItemProcessed(action.item.id));
        default:
            return actionResult;
            break;
    }
}
