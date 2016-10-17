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

/**
 * Tasks auflisten
 *    gulp --tasks
 *    gulp --tasks-simple
 */

/* eslint-enable quotes: [2, "single"] */

import {all} from './tasks/all';
import {check} from './tasks/check';
import {clangformat} from './tasks/clangformat';
import {clean} from './tasks/clean';
import {config} from './tasks/config';
import {fixme} from './tasks/fixme';
import {httpsConfig} from './tasks/httpsConfig';
import {pdf} from './tasks/pdf';
import {mongo} from './tasks/mongo';
import {mongoexport} from './tasks/mongoexport';
import {mongoexpress} from './tasks/mongoexpress';
import {mongoimport} from './tasks/mongoimport';
import {mongostop} from './tasks/mongostop';
import {nodemon} from './tasks/nodemon';
import {nodemonConfig} from './tasks/nodemonConfig';
import {noproxy} from './tasks/noproxy';
import {proxy} from './tasks/proxy';
import {rebuild} from './tasks/rebuild';
import {test} from './tasks/test';
import {ts} from './tasks/ts';
import {tslint} from './tasks/tslint';
import {watch} from './tasks/watch';

export {
    check,
    clangformat,
    clean,
    config,
    fixme,
    httpsConfig,
    pdf,
    mongo,
    mongoexport,
    mongoexpress,
    mongoimport,
    mongostop,
    nodemon,
    nodemonConfig,
    noproxy,
    proxy,
    rebuild,
    test,
    ts,
    tslint,
    watch
};

export default all;
