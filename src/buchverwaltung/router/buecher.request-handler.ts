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
// Document kann nicht direkt importiert werden, weil es in ES2015 auch eine
// Klasse Document gibt
import {Document as MDocument, model} from 'mongoose';
import {inspect} from 'util';

import {getBaseUri, isBlank, log, logger, MIME_CONFIG} from '../../shared/index';
import {Buch, validateBuch} from '../model/buch';
import {BuecherService, IdNotExistsError, TitelExistsError} from '../service/buecher.service';

class BuecherRequestHandler {
    private readonly buecherService: BuecherService = new BuecherService();

    // async und await:
    // https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
    // http://tc39.github.io/ecmascript-asyncawait vor allem von Microsoft

    @log
    async getById(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const id: string = req.params.id;

        let buch: MDocument;
        try {
            buch = await this.buecherService.findById(id);
        } catch (err) {
            // Exception einer async. Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        if (isBlank(buch)) {
            logger.debug('status = 404');
            res.sendStatus(404);
            return;
        }

        const baseUri: string = getBaseUri(req);
        // Link Header
        res.links({
            self: `${baseUri}/${id}`,
            list: `${baseUri}`,
            add: `${baseUri}`,
            update: `${baseUri}`,
            remove: `${baseUri}/${id}`
        });
        logger.debug(`getById(): buch = ${JSON.stringify(buch)}`);
        res.json(buch);
    }

    @log
    async getByQuery(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        // z.B. https://.../buecher?titel=Alpha
        const query: any = req.query;
        logger.debug(`queryParams = ${JSON.stringify(query)}`);

        let buecher: Array<MDocument> = [];
        try {
            buecher = await this.buecherService.find(query);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
        }

        logger.debug(`getByQuery(): buecher = ${JSON.stringify(buecher)}`);
        if (buecher.length === 0) {
            // Alternative: https://www.npmjs.com/package/http-errors
            // Damit wird aber auch der Stacktrace zum Client
            // uebertragen, weil das resultierende Fehlerobjekt
            // von Error abgeleitet ist.
            logger.debug('status = 404');
            res.sendStatus(404);
            return;
        }

        // Link Header
        const baseUri: string = getBaseUri(req);
        const firstId: string = buecher[0]._id.valueOf() as string;
        const lastId: string = buecher[buecher.length - 1]._id.valueOf();
        res.links({
            self: `${baseUri}`,
            list: `${baseUri}`,
            first: `${baseUri}/${firstId}`,
            last: `${baseUri}/${lastId}`
        });

        res.json(buecher);
    }

    @log
    async post(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (req.header(MIME_CONFIG.contentType) === undefined
            || req.header(MIME_CONFIG.contentType).toLowerCase()
                !== MIME_CONFIG.applicationJson) {
            logger.debug('status = 406');
            res.sendStatus(406);
            return;
        }

        const buch: model<MDocument> = new Buch(req.body);
        logger.debug(`Body: ${JSON.stringify(buch)}`);
        const err: any = validateBuch(buch);
        if (err !== undefined) {
            logger.debug('status = 400');
            res.status(400).send(err);
            return;
        }

        let buchSaved: model<MDocument>;
        try {
            buchSaved =
                await this.buecherService.save(buch) as model<MDocument>;
        } catch (err) {
            if (err instanceof TitelExistsError) {
                res.status(400).send(err.message);
                return;
            }

            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        const location: string = `${getBaseUri(req)}/${buchSaved._id}`;
        logger.debug(`post(): location = ${location}`);
        res.location(location);
        res.sendStatus(201);
    }

    @log
    async put(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (req.header(MIME_CONFIG.contentType) === undefined
            || req.header(MIME_CONFIG.contentType).toLowerCase()
                !== MIME_CONFIG.applicationJson) {
            res.status(406);
            return;
        }

        const buch: MDocument = new Buch(req.body);
        logger.debug(`Body: ${JSON.stringify(buch)}`);
        // siehe buch.ts
        const err: any = validateBuch(buch);
        if (err !== undefined) {
            logger.debug(`status = 400, err: ${JSON.stringify(err)}`);
            res.status(400).send(err);
            return;
        }

        try {
            await this.buecherService.update(buch);
        } catch (err) {
            if (err instanceof TitelExistsError
                || err instanceof IdNotExistsError) {
                logger.debug(`status = 400, message: ${err.message}`);
                res.status(400).send(err);
                return;
            }

            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        res.sendStatus(204);
    }

    @log
    async deleteMeth(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const id: string = req.params.id;
        logger.debug(`id = ${id}`);

        try {
            await this.buecherService.remove(id);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        res.sendStatus(204);
    }

    toString(): string {
        return 'BuecherRequestHandler';
    }
}

// -----------------------------------------------------------------------
// E x p o r t i e r t e   F u n c t i o n s
// -----------------------------------------------------------------------
const buecherRequestHandler: BuecherRequestHandler =
    new BuecherRequestHandler();
export function getById(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    buecherRequestHandler.getById(req, res, next);
}

export function getByQuery(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    buecherRequestHandler.getByQuery(req, res, next);
}

export function post(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    buecherRequestHandler.post(req, res, next);
}

export function put(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    buecherRequestHandler.put(req, res, next);
}

export function deleteFn(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    buecherRequestHandler.deleteMeth(req, res, next);
}
