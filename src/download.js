'use strict'

import net from 'net'
import Buffer from 'buffer'
import { getPeers } from './trackers'
import { Log } from '../utils/utils';

import { build_handshake, build_interested } from './message'


export const process_torrent = (torrent) => {
    const requested = [];
    getPeers(torrent, peers => {
        peers.forEach(peer => download(peer, torrent, requested));
    });
};

export const download = (peer, torrent, requested) => {

    const socket = net.Socket();
    const queue = [];


    socket.on('error', Log("Socket Error Occured"));

    socket.connect(peer.port, peer.ip, () => {
        socket.write(build_handshake(torrent));
    });

    on_whole_message(socket, message => message_handler(message, socket, requested, queue));


    function is_handshake(msg) {
        return msg.length === msg.readUInt8(0) + 49 &&
            msg.toString('utf8', 1) === 'BitTorrent protocol';
    }


    function message_handler(message, socket, requested) {
        if (is_handshake(message)) {
            socket.write(build_interested());
        } else {
            const m = message.parse(message);

            if (m.id === 0) chokeHandler();
            if (m.id === 1) unchokeHandler();
            if (m.id === 4) haveHandler(m.payload, socket, requested);
            if (m.id === 5) bitfieldHandler(m.payload);
            if (m.id === 7) pieceHandler(m.payload, socket, requested, queue);
        }
    }

    function chokeHandler() { }

    function unchokeHandler() { }

    function haveHandler(payload, socket, requested) {
        const piece_index = payload.readUInt32BE(0);

        if (!requested[piece_index]) {
            socket.write(message.buildRequest());
        }
        requested[piece_index] = true;

        queue.push(piece_index);
        if (queue.length === 1) {
            requestPiece(socket, requested, queue);
        }

        function requestPiece(socket, requested, queue) {
            if (requested[queue[0]]) {
                queue.shift();
            } else {
                // this is pseudo-code, as buildRequest actually takes slightly more
                // complex arguments
                socket.write(message.buildRequest(piece_index));
            }
        }

    }


    function bitfieldHandler(payload) { }

    function pieceHandler(payload, socket, requested, queue) {
        queue.shift();
        requestPiece(socket, requested, queue);
    }




}




function on_whole_message(socket, callback) {
    // allocate a buffer and set the handshake to true

    let saved_buff = Buffer.alloc(0);
    let handshake = true;

    /// on receiving data, check the length of the whole message

    socket.on('data', received_buff => {
        const message_length = () => { handshake ? saved_buff.readUInt8(0) + 49 : saved_buff.readInt32BE(0) + 4 };
        saved_buff = Buffer.concat([saved_buff, received_buff]);


        /**
         * the loop ensures there's atleast 4 bytes of data to determine the length of a message
         * the loop also ensures there's enough data to complete an entire message.
         * then it envokes the callback to take the whole saved message and do something with it
         * then it cleans the saved_buffer for later use
         * and sets the handshake to false, because we're still processing the message 
        */

        while (saved_buff.length >= 4 && saved_buff.length >= message_length()) {
            callback(saved_buff.slice(0, msgLen()));
            saved_buff = saved_buff.slice(msgLen());
            handshake = false;
        }
    })

}

