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

import {src} from 'gulp';
import minimist from 'minimist';
import tslintModule from 'tslint';
import gulpTslint from 'gulp-tslint';
// import debug from 'gulp-debug';

import {dateien} from '../gulp.config';

export const tslint = (done) => {
    'use strict';
    // Alternative: yargs https://www.npmjs.com/package/yargs
    const argv = minimist(process.argv.slice(2));
    if (argv.nocheck) {
        done();
        return;
    }

    src(dateien.ts)
        //.pipe(debug({title: 'tslint:'}))
        .pipe(gulpTslint({tslint: tslintModule, formatter: 'verbose'}))
        .pipe(gulpTslint.report());
    done();
};
