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

/* global process */
/* global __dirname */

import slash from 'slash';
import {join} from 'path';
import {exec} from 'shelljs';
import {dbname} from '../gulp.config';

export const mongoexpress = (done) => {
    'use strict';

    const httpsDir = slash(join(__dirname, '..', 'config', 'https'));
    const key = slash(join(httpsDir, 'key.pem'));
    const cert = slash(join(httpsDir, 'cert.cer'));

    const mongoExpressEnv = 'SET ME_CONFIG_MONGODB_SERVER=127.0.0.1' +
        '&& SET ME_CONFIG_MONGODB_ENABLE_ADMIN=true' +
        '&& SET ME_CONFIG_BASICAUTH_PASSWORD=p' +
        '&& SET ME_CONFIG_SITE_SSL_ENABLED=true' +
        `&& SET ME_CONFIG_SITE_SSL_KEY_PATH=${key}` +
        `&& SET ME_CONFIG_SITE_SSL_CRT_PATH=${cert}`;

    // ggf. --version
    const mongoExpressPath =
        join(process.env.NPM_CONFIG_PREFIX, 'node_modules', 'mongo-express');
    exec(`${mongoExpressEnv}&& cd ${mongoExpressPath} && node app.js -d ${dbname}`);
    done();
};
