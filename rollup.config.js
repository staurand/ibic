// rollup.config.js
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
const fs = require('fs');

if (!fs.existsSync('./dist/codecs/')) {
    fs.mkdirSync('./dist/codecs/');
}
if (!fs.existsSync('./dist/codecs/mozjpeg/')) {
    fs.mkdirSync('./dist/codecs/mozjpeg/');
}
if (!fs.existsSync('./dist/codecs/webp/')) {
    fs.mkdirSync('./dist/codecs/webp/');
}
fs.writeFileSync('./dist/codecs/mozjpeg/mozjpeg_enc.wasm', fs.readFileSync('./node_modules/squoosh/codecs/mozjpeg/enc/mozjpeg_enc.wasm'));
fs.writeFileSync('./dist/codecs/mozjpeg/LICENSE.codec.md', fs.readFileSync('./node_modules/squoosh/codecs/mozjpeg/LICENSE.codec.md'));
fs.writeFileSync('./dist/codecs/webp/webp_enc.wasm', fs.readFileSync('./node_modules/squoosh/codecs/webp/enc/webp_enc.wasm'));
fs.writeFileSync('./dist/codecs/webp/LICENSE.codec.md', fs.readFileSync('./node_modules/squoosh/codecs/webp/LICENSE.codec.md'));

export default [
    // sw-init.js
    {
        input: 'src/front/sw-init.js',
        output: {
            file: 'dist/sw-init.js',
            format: 'es'
        },
    },

    // sw.js
    {
        input: 'src/sw/sw.js',
        output: {
            file: 'dist/sw.js',
            format: 'iife'
        },
        plugins: [
            commonjs(),
            replace({
                'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV ),
            }),
            {
                resolveImportMeta(property, {chunkId, moduleId, format}) {
                    return "'" + moduleId.replace(/(.*squoosh\/)/, '') + "'";
                }
            },
            nodeResolve(),
        ]
}
];
