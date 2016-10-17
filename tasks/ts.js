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

import {dest, parallel, series} from 'gulp';
import {init, write} from 'gulp-sourcemaps';
import gulpTypescript from 'gulp-typescript';
import typescript from 'typescript';

import {iamJson} from './iamJson';
import {jwtPem} from './jwtPem';
import {check} from './check';
import {distDir} from '../gulp.config';

const tsc = () => {
    'use strict';
    const tsProject = gulpTypescript.createProject('tsconfig.json', {typescript: typescript});
    return tsProject.src()
        .pipe(init())
        .pipe(tsProject())
        .js
        .pipe(write(`.`))
        .pipe(dest(distDir));
};
export const ts = parallel(series(check, tsc), iamJson, jwtPem);
