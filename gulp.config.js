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

/* eslint-enable quotes: [2, "single"] */

const srcDir = 'src';
export const distDir = 'dist';
const configDir = 'config';
export const mongoimportDir = `${configDir}/mongoimport`;

export const dateien = {
    ts: `${srcDir}/**/*.ts`,
    https: `${configDir}/https/*`,
    iamJson: `${srcDir}/iam/service/json/*.json`,
    jwtPem: `${srcDir}/iam/service/jwt/*.pem`,
    mongoimport: [
        `buecher`
    ],
    mongoExpress: `${configDir}/mongo-express/*`,
    nodemon: `${configDir}/nodemon/*`
};

export const dbname = 'hskadb';
