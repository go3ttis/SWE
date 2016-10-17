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

// https://nodejs.org/api/fs.html
// https://github.com/nodejs/node/blob/master/lib/buffer.js#L191
// Einzulesende oder zu schreibende Dateien im Format UTF-8
import {readFileSync} from 'fs';
import {join} from 'path';

import {isBlank, isEmpty, log, logger} from '../../shared/index';

export class RolesService {
    private static ROLES: Array<string> = JSON.parse(
        readFileSync(join(__dirname, 'json', 'roles.json'), 'utf-8'));

    @log
    findAllRoles(): Array<string> {
        return RolesService.ROLES;
    }

    @log
    getNormalizedRoles(roles: Array<string>): Array<string>|undefined {
        if (isBlank(roles) || roles.length === 0) {
            logger.debug('isBlank(roles)');
            return undefined;
        }

        const normalizedRoles: Array<string> = [];
        roles.forEach(r => {
            const normalizedRole: string|undefined = this.getNormalizedRole(r);
            if (normalizedRole !== undefined) {
                normalizedRoles.push(normalizedRole);
            }
        });
        return normalizedRoles.length === 0 ? undefined : normalizedRoles;
    }

    toString(): string {
        return 'RolesService';
    }

    @log
    private getNormalizedRole(role: string): string|undefined {
        if (isEmpty(role)) {
            return undefined;
        }

        // Falls der Rollenname in Grossbuchstaben geschrieben ist, wird er
        // trotzdem gefunden
        const normalizedRole: string|undefined = this.findAllRoles().find(
            (r: string) => r.toLowerCase() === role.toLowerCase());
        return isEmpty(normalizedRole) ? undefined : normalizedRole;
    }
}
