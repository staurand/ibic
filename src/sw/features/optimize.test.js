import { getImageOutputFormats, getUrlInfo } from "./optimize";

describe('feature > optimize', () => {
    const url = '/back-end/images/image-1.jpg';

    test('`getUrlInfo` should return information about a URL', () => {
        const info = { ext: 'jpg' };
        expect(getUrlInfo(url)).toEqual(info);
        expect(getUrlInfo('oops.' + url)).toEqual(info);
    });

    test('`getImageOutputFormats` should return the expected formats for a file extension', () => {
        expect(getImageOutputFormats('jpg')).toEqual(['jpg', 'webp']);
        expect(getImageOutputFormats('png')).toEqual(['png', 'webp']);
        expect(getImageOutputFormats(null)).toEqual([]);
        expect(getImageOutputFormats('doc')).toEqual([]);
    });

});
