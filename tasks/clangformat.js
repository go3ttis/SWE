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
import {checkFormat} from 'gulp-clang-format';
import clangFormatPkg from 'clang-format';
import minimist from 'minimist';

import {dateien} from '../gulp.config';

export const clangformat = (done) => {
    'use strict';
    // Alternative: yargs https://www.npmjs.com/package/yargs
    const argv = minimist(process.argv.slice(2));
    if (argv.nocheck) {
        done();
        return;
    }

    // http://clang.llvm.org/docs/ClangFormatStyleOptions.html
    return src(dateien.ts)
        // clang ist ein C/C++/Objective-C Compiler des Projekts LLVM http://www.llvm.org
        // Formatierungseinstellungen in .clang-format:
        // Google (default) http://google-styleguide.googlecode.com/svn/trunk/cppguide.html
        // LLVM http://llvm.org/docs/CodingStandards.html
        // Chromium http://www.chromium.org/developers/coding-style
        // Mozilla https://developer.mozilla.org/en-US/docs/Developer_Guide/Coding_Style
        // WebKit http://www.webkit.org/coding/coding-style.html
        .pipe(checkFormat('file', clangFormatPkg, {verbose: true}))
        .on('warning', function(e) {
            process.stdout.write(e.message);
            done();
            process.exit(1);
        });
};
