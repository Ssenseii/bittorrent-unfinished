'use strict'

import chalk from 'chalk';
import crypto from 'crypto'

let id = null;


/**
 * Peer Id Conventions
 * https://www.bittorrent.org/beps/bep_0020.html 
 * 
 */

export const genId = () => {
    if (!id) {
        id = crypto.randomBytes(20);
        Buffer.from('-AT0001-').copy(id, 0);
    }
    return id;
}

export const Say = (message) => {
    console.log(chalk.blue(message));
}

export const Log = (message) => {
    console.log(message);
}