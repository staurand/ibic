import { jpg } from '../vendor/index';

const EncodeOptions = {
    quality: 75,
    baseline: false,
    arithmetic: false,
    progressive: true,
    optimize_coding: true,
    smoothing: 0,
    color_space: 3,
    quant_table: 3,
    trellis_multipass: false,
    trellis_opt_zero: false,
    trellis_opt_table: false,
    trellis_loops: 1,
    auto_subsample: true,
    chroma_subsample: 2,
    separate_chroma_quality: false,
    chroma_quality: 75,
};

export const encodeToJpg = async (imageData, codecs_path) => {
    const encoderModule = await jpg.encode({
        locateFile: function (url) {
            if (url.endsWith('.wasm')) {
                return codecs_path + 'mozjpeg/' + url;
            }
            return url;
        }
    });
    return encoderModule.encode(imageData.data, imageData.width, imageData.height, EncodeOptions);
}

export const decodeJpg = async (url) => {
    const imgResponse = await fetch(url);
    const imgBuffer = await imgResponse.arrayBuffer();
    const imageData = await jpg.decode(new Uint8Array(imgBuffer), { useTArray: true });
    return imageData;
}

