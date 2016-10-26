/*
 * Copyright (C) 2016 Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {readFileSync} from 'fs';
import {join} from 'path';

export const SERVER_CONFIG: any = {
    host: 'localhost',
    port: 8443,

    // https://nodejs.org/api/https.html
    // https://nodejs.org/api/fs.html
    // key: readFileSync(join(__dirname, 'key.pem')),
    // cert: readFileSync(join(__dirname, 'cert.cer'))
    key: readFileSync(
        join(__dirname, '..', '..', '..', 'config', 'https', 'key.pem')),
    cert: readFileSync(
        join(__dirname, '..', '..', '..', 'config', 'https', 'cert.cer'))
};
