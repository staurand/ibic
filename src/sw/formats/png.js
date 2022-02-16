//import * as pngEncDec from '../../../squoosh/codecs/png/pkg/squoosh_png.js';
import UPNG from 'upng-js';

export const encodeToPng = async (imageData, codecs_path) => {
    return UPNG.encode([imageData.data], imageData.width, imageData.height, 0);
}

export const decodePng = async (url, codecs_path) => {
    const imgResponse = await fetch(url);
    const imgBuffer = await imgResponse.arrayBuffer();
    const img = await UPNG.decode(imgBuffer);
    return { ...img, data: UPNG.toRGBA8(img)[0] };
}
