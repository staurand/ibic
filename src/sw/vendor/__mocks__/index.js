const vendors = {
    jpg: {
        encode: async () => { return { data: null, width: 0, height: 0 } },
        decode: async () => { return {} }
    },
    webp: {
        encode: async () => { return { data: null, width: 0, height: 0 } },
    }
}
export default vendors;
