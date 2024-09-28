import dgram from 'dgram'
import url from 'url'
import crypto from 'crypto'
import { Buffer } from 'buffer'
import { Log, Say } from '../utils/utils.js'

import { infoHash, size } from './torrent-parser.js'
import { genId } from '../utils/utils.js'

export default function getPeers(torrent, callback) {
    const socket = dgram.createSocket('udp4');
    const urlStr = torrent.announce.toString('utf8');

    // Retry logic parameters
    const maxAttempts = 10;
    const timeout = 2000; // Adjust the timeout value as needed

    function udpSendWithRetry(socket, message, rawUrl, attempt) {
        const urlLine = url.parse(rawUrl);

        // Attempt to send the UDP message
        udpSend(socket, message, urlLine, (err) => {
            if (err) {
                Say(`UDP sending failed on attempt ${attempt}`);
                Log(err);

                // Retry if attempts are within the limit
                if (attempt < maxAttempts) {
                    setTimeout(() => {
                        udpSendWithRetry(socket, message, rawUrl, attempt + 1);
                        Say("Retrying")
                    }, timeout);
                } else {
                    Say("Maximum number of attempts reached. Exiting.");
                    socket.close();
                }
            } else {
                Say("Successfully sent the Socket");
                Log(rawUrl);

                // Start listening for messages after successful send

                /**
                 * 
                 * THIS IS WHERE THE PROBLEM IS
                 * 
                 * Whatever is happening here, I do not understand.
                 * */
                
                socket.on('listening', () => {
                    const address = socket.address();
                    Log(`server listening ${address.address}:${address.port}`);
                });

                socket.on('error', (err) => {
                    Log(`server error:\n${err.stack}`);
                    socket.close();
                });

                socket.on("message", (response) => {
                    // Handle response logic here
                    Say("Waiting on Message");
                    handleResponse(socket, response, torrent, callback);
                });

                socket.bind
            }
        });
    }

    udpSendWithRetry(socket, build_connection_request(), urlStr, 1);
    Say("Socket listening to messages...");
}

function udpSend(socket, message, urlLine, callback) {
    Say("URL_LINE:");
    Log(urlLine);
    socket.send(message, 0, message.length, urlLine.port, urlLine.hostname, callback);
}

function handleResponse(socket, response, torrent, callback) {
    const responseType = response_type(response);

    if (responseType === "connect") {
        const connectionResponse = parse_connection_response(response);
        const announcementRequest = build_announcement_request(connectionResponse.connection_id, torrent);

        udpSend(socket, announcementRequest, torrent.announce.toString('utf8'), () => { });
    } else if (responseType === "announce") {
        const announcementResponse = parse_announcement_response(response);
        callback(announcementResponse.peers);
    }
}

function response_type(response) {
    const action = response.readUInt32BE(0);

    if (action === 0) {
        Say("Response Type = Connect");
        return 'connect';
    } else if (action === 1) {
        Say("Response Type = Announce");
        return 'announce';
    }
}

function build_connection_request() {
    const buf = Buffer.alloc(16);
    buf.writeUInt32BE(0x417, 0);
    buf.writeUInt32BE(0x27101980, 4);
    buf.writeUInt16BE(0, 8);
    crypto.randomBytes(4).copy(buf, 12);

    Say("THE BUFFER:");
    Log(buf);

    return buf;
}

function parse_connection_response(response) {

    return {
        action: response.readUint32BE(0),
        transaction_id: response.readUint32BE(4),
        connection_id: response.slice(8)
    }
}


/// Announcement


function build_announcement_request(connection_id, torrent, port = 6881) {
    // const buf = Buffer.allocUnsafe()             /// ummm no, lets try alloc first and see what happens.
    const buf = Buffer.alloc(98);                   /// if performance drops significantly, change to unsafe and

    // connection id
    connection_id.copy(buf, 0);

    // action
    buf.writeUInt32BE(1, 8);

    // transaction id
    crypto.randomBytes(4).copy(buf, 12);

    // info hash
    infoHash(torrent).copy(buf, 16);

    // peerId
    genId.copy(buf, 36);                                    /// Check later here if you have a problem

    // downloaded
    Buffer.alloc(8).copy(buf, 56);

    // left
    size(torrent).copy(buf, 64);

    // uploaded
    Buffer.alloc(8).copy(buf, 72);                          /// 64bit integer full of 0s

    // event
    buf.writeUInt32BE(0, 80);

    // ip address
    buf.writeUInt32BE(0, 80);

    // key
    crypto.randomBytes(4).copy(buf, 88);

    // num want
    buf.writeInt32BE(-1, 92);

    // port
    buf.writeUInt16BE(port, 96);                            /// number is negative you cant use unsigned

    return buf;

}

function parse_announcement_response(response) {
    function group(iterable, group_size) {
        let group = [];
        for (let i = 0; i < iterable.length; i += group_size) {
            group.push(iterable.slice(i, i + group_size));
        }
        return group;
    }

    return {
        action: response.readUInt32BE(0),
        transaction_id: response.readUInt32BE(4),
        leechers: response.readUInt32BE(8),
        seeders: response.readUInt32BE(12),
        peers: group(response.slice(20), 6).map(address => {
            return {
                ip: address.slice(0, 4).join('.'),
                port: address.readUInt16BE(4)
            }
        })
    }
}