import fs from 'fs'
import bencode from 'bencode'
import crypto from 'crypto'


export function open(filepath) {
    return bencode.decode(fs.readFileSync(filepath), 'utf8');
}

export function infoHash(torrent) {
    const info = bencode.encode(torrent.info)
    return crypto.createHash('sha1').update(info).digest();
}

export function size(torrent) {

    /// BARD AI

    function bigIntToBuffer(bigInt, size = 8) {
        // Ensure BigInt is valid
        if (typeof bigInt !== 'bigint') {
            throw new TypeError('Expected a BigInt value');
        }

        // Convert BigInt to a byte array
        const byteArray = new Uint8Array(size);
        for (let i = 0; i < size; i++) {
            byteArray[i] = Number(bigInt >> (8 * (size - i - 1)) & 0xffn);
        }

        // Return the buffer
        return byteArray.buffer;
    }

    /// END OF BARD AI
    
    const size = torrent.info.files ?
        torrent.info.files.map(file => file.length).reduce((a, b) => a + b)
        :
        torrent.info.length;

    return bigIntToBuffer(size);
}