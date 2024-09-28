import buffer from 'buffer'
import { infoHash } from './torrent-parser'
import { genId } from '../utils/utils'

export function build_handshake(torrent) {
    const buf = Buffer.alloc(68);

    buf.writeUInt8(19, 0);
    buf.write('BitTorrent protocol', 1);

    buf.writeUInt32BE(0, 20);
    buf.writeUInt32BE(0, 24);

    infoHash(torrent).copy(buf, 28);

    buf.write(genId());
    return buf;
};

export const keep_buffer_alive = () => { Buffer.alloc(8) };

export const build_choke = () => {
    const buf = Buffer.alloc(5);

    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(0, 4);
    return buf;
}


export const build_unchoke = () => {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(1, 4);
    return buf;
};

export const build_interested = () => {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(2, 4);
    return buf;
};

export const build_uninterested = () => {
    const buf = Buffer.alloc(5);
    // length
    buf.writeUInt32BE(1, 0);
    // id
    buf.writeUInt8(3, 4);
    return buf;
};

export const build_have = payload => {
    const buf = Buffer.alloc(9);
    // length
    buf.writeUInt32BE(5, 0);
    // id
    buf.writeUInt8(4, 4);
    // piece index
    buf.writeUInt32BE(payload, 5);
    return buf;
};

export const build_bitfield = bitfield => {
    const buf = Buffer.alloc(14);
    // length
    buf.writeUInt32BE(payload.length + 1, 0);
    // id
    buf.writeUInt8(5, 4);
    // bitfield
    bitfield.copy(buf, 5);
    return buf;
};

export const build_request = payload => {
    const buf = Buffer.alloc(17);
    // length
    buf.writeUInt32BE(13, 0);
    // id
    buf.writeUInt8(6, 4);
    // piece index
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // length
    buf.writeUInt32BE(payload.length, 13);
    return buf;
};

export const build_piece = payload => {
    const buf = Buffer.alloc(payload.block.length + 13);
    // length
    buf.writeUInt32BE(payload.block.length + 9, 0);
    // id
    buf.writeUInt8(7, 4);
    // piece index
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // block
    payload.block.copy(buf, 13);
    return buf;
};

export const build_cancel = payload => {
    const buf = Buffer.alloc(17);
    // length
    buf.writeUInt32BE(13, 0);
    // id
    buf.writeUInt8(8, 4);
    // piece index
    buf.writeUInt32BE(payload.index, 5);
    // begin
    buf.writeUInt32BE(payload.begin, 9);
    // length
    buf.writeUInt32BE(payload.length, 13);
    return buf;
};

export const build_port = payload => {
    const buf = Buffer.alloc(7);
    // length
    buf.writeUInt32BE(3, 0);
    // id
    buf.writeUInt8(9, 4);
    // listen-port
    buf.writeUInt16BE(payload, 5);
    return buf;
};


export const parse = (message) =>{
    const id = message.length > 4 ? message.readInt8(4) : null;
    let payload = message.length > 5 ? message.slice(4) : null;

    if(id === 6 || id === 7 || id === 8){
        const rest = payload.slice(8);
        payload = {
            index: payload.readInt32BE(0),
            begin: payload.readInt32BE(4),
        };
        payload[id === 7 ? 'block': 'length'] = rest;
    }

    return {
        size: message.readInt32BE(0),
        id: id,
        payload: payload
    }
}