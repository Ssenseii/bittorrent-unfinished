/// For some reason, couldn't get jest to work with ecmascript 6 export and import modules.
/// so m hacking it here.

function size(torrent) {

    function bigIntToBuffer(bigInt, size = 8) {
        // Ensure BigInt is valid
        if (typeof bigInt !== 'bigint') {
            throw new TypeError('Expected a BigInt value');
        }

        // Create a buffer with the specified size
        const buffer = new ArrayBuffer(size);

        // Use DataView to write the BigInt into the buffer
        const dataView = new DataView(buffer);
        for (let i = 0; i < size; i++) {
            dataView.setUint8(i, Number(bigInt & 0xffn));
            bigInt >>= 8n; // Shift BigInt to the right by 8 bits
        }

        // Return the buffer
        return buffer;
    }

    const totalSize = torrent.info.files
        ? torrent.info.files.reduce((acc, file) => acc + file.length, 0)
        : torrent.info.length;

    return bigIntToBuffer(BigInt(totalSize));
}

module.exports = size;