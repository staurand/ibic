import mozjpegEncode from 'squoosh/codecs/mozjpeg/enc/mozjpeg_enc.js';
import jpgDecode from 'jpeg-js/lib/decoder.js';
import webpEncode from 'squoosh/codecs/webp/enc/webp_enc.js';

export const jpg = {
    encode: mozjpegEncode,
    decode: jpgDecode
};
export const webp = {
    encode: webpEncode
};
