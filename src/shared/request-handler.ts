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

import {NextFunction, Request, Response} from 'express';
import {isUUID} from 'validator';

import {isMongoId, log, logger} from './index';

class SharedRequestHandler {
    @log
    logRequestHeader(req: Request, res: Response, next: NextFunction): void {
        logger.debug(
            `Request: headers=${JSON.stringify(req.headers, undefined, 2)}`);
        logger.debug(
            `Request: protocol=${JSON.stringify(req.protocol, undefined, 2)}`);
        logger.debug(
            `Request: hostname=${JSON.stringify(req.hostname, undefined, 2)}`);
        if (req.body !== undefined) {
            logger.debug(
                `Request: body=${JSON.stringify(req.body, undefined, 2)}`);
        }
        Object.keys(req).forEach((key: any) => {
            if (req.hasOwnProperty(key)) {
                logger.log('silly', `Request-Key: ${key}`);
            }
        });

        // Request-Verarbeitung fortsetzen
        next();
    }

    @log
    validateMongoId(req: Request, res: Response, next: NextFunction, id: any):
        void {
        logger.debug(`id = ${id}`);

        if (!isMongoId(id)) {
            logger.debug('status = 400');
            res.status(400).send(`${id} ist keine gueltige Buch-ID`);
        }

        next();
    }

    @log
    validateUUID(req: Request, res: Response, next: NextFunction, id: any):
        void {
        if (!isUUID(id)) {
            logger.debug('status = 400');
            res.status(400).send(`${id} ist keine gueltige Buch-ID`);
            return;
        }

        next();
    }

    @log
    notFound(req: Request, res: Response): void {
        res.sendStatus(404);
    }

    @log
    internalError(err: any, req: Request, res: Response, next: NextFunction):
        void {
        logger.error(JSON.stringify(err, null, 2));
        res.sendStatus(500);
    }

    @log
    notYetImplemented(req: Request, res: Response): void {
        logger.error('NOT YET IMPLEMENTED');
        res.sendStatus(501);
    }

    toString(): string {
        return 'SharedRequestHandler';
    }
}

// -----------------------------------------------------------------------
// E x p o r t i e r t e   F u n c t i o n s
// -----------------------------------------------------------------------
export function logRequestHeader(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    new SharedRequestHandler().logRequestHeader(req, res, next);
}

export function validateMongoId(
    req: Request, res: Response, next: NextFunction, id: any): void {
    'use strict';
    new SharedRequestHandler().validateMongoId(req, res, next, id);
}

export function validateUUID(
    req: Request, res: Response, next: NextFunction, id: any): void {
    'use strict';
    new SharedRequestHandler().validateUUID(req, res, next, id);
}

export function notFound(req: Request, res: Response): void {
    'use strict';
    new SharedRequestHandler().notFound(req, res);
}

export function internalError(
    err: any, req: Request, res: Response, next: NextFunction): void {
    'use strict';
    new SharedRequestHandler().internalError(err, req, res, next);
}

export function notYetImplemented(req: Request, res: Response): void {
    'use strict';
    new SharedRequestHandler().notYetImplemented(req, res);
}

// https://github.com/expressjs/express/issues/2259
// https://github.com/expressjs/express/pull/2431
// https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators
export const wrap: any = (fn: Function) => (...args: Array<any>) =>
    fn(...args).catch(args[2]);
