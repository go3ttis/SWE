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

// https://nodejs.org/api/https.html
// Express funktioniert nicht mit HTTP/2:
// https://github.com/molnarg/node-http2/issues/100
import {createServer} from 'https';

import {app} from './app';
import {logger, SERVER_CONFIG} from './shared/index';

const {host, port, key, cert}: any = SERVER_CONFIG;
createServer({key: key, cert: cert}, app).listen(port, host, () => {
    logger.info(`Node ${process.version}`);
    logger.info(`Der Server ist gestartet: https://${host}:${port}`);
});
