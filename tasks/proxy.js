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

import {series, parallel} from 'gulp';
import {prompt} from 'inquirer';
import {exec} from 'shelljs';

let username;
let password;

const promptUsernamePassword = (done) => {
    'use strict';
    const questions = [
        {
            message: 'Username: ',
            name: 'username'
        },
        {
            message: 'Password: ',
            name: 'password',
            type: 'password'
        }
    ];
    prompt(questions).then(answers => {
        username = answers.username;
        password = answers.password;
        done();
    });
};

const proxyNpm = (done) => {
    'use strict';
    exec(`npm c set proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888 && npm c set https-proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888`);
    done();
};

// Git fuer z.B. Alpha-Releases von GitHub (z.B. gulp 4.0.0.alpha2)
const proxyGit = (done) => {
    'use strict';
    exec(`git config --global http.proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888 && git config --global https.proxy http://${username}:${password}@proxy.hs-karlsruhe.de:8888 && git config --global url."http://".insteadOf git://`);
    done();
};

export const proxy = series(promptUsernamePassword, parallel(proxyNpm, proxyGit));
