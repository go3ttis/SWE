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

// Es gibt leider kein "Embedded MongoDB" wie bei Java und GradleMongoPlugin

import {exec} from 'shelljs';
import {join} from 'path';

export const mongo = (done) => {
    'use strict';
    const configPath = join('C:', 'Zimmermann', 'mongodb', 'config.yml'); //yml = gesprochen Yamel, = Config-Datei, wie Property- oder Ini-Dateien

    // Default Port: 27017
    exec(`mongod --config ${configPath}`); //TemplateString, MultilineString
    // Aus den zwei Zeilen darüber lässt sich auch einfach eine Bat-Datei schreiben, so muss nicht extra gulp gestartet werden.
    done();
};
