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

import * as mongoose from 'mongoose';
import {connect, connection} from 'mongoose';

export const DB_CONFIG: any = {
    // In Produktion auf false setzen
    autoIndex: true,

    // http://mongoosejs.com/docs/connections.html
    // https://github.com/mongodb/node-mongodb-native
    // Defaultwerte
    //      Port        27017
    //      Poolsize    5
    host: '127.0.0.1',
    dbname: 'hskadb',
    url: undefined,
    connection: undefined
};

// Die Mongoose-eigenen Promises sind deprecated
// Die Promises aus ES2015 als Promise-Library bereitstellen
(<any>mongoose).Promise = Promise;

DB_CONFIG.url = `mongodb://${DB_CONFIG.host}/${DB_CONFIG.dbname}`;
connect(DB_CONFIG.url);

DB_CONFIG.connection = connection;
DB_CONFIG.connection.on(
    'error', console.error.bind(
                 console, 'FEHLER beim Aufbau der Datenbank-Verbindung:\n'));
