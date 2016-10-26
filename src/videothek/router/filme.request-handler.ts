/*
 * Copyright (C) 2016 Florian Giersdorf, Hochschule Karlsruhe
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
import {Document as MDocument, model} from 'mongoose';
import {inspect} from 'util';

import {getBaseUri, isBlank, log, logger, MIME_CONFIG} from '../../shared/index';
import {Film, validateFilm} from '../model/film';
import {FilmeService, IdNotExistsError, TitelExistsError} from '../service/filme.service';

class FilmeRequestHandler {
    private readonly filmeService: FilmeService = new FilmeService();

    @log
    async getById(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const id: string = req.params.id;

        let film: MDocument;
        try {
            film = await this.filmeService.findById(id);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        if (isBlank(film)) {
            logger.debug('status = 404');
            res.sendStatus(404);
            return;
        }

        const baseUri: string = getBaseUri(req);
        res.links({
            self: `${baseUri}/${id}`,
            list: `${baseUri}`,
            add: `${baseUri}`,
            update: `${baseUri}`,
            remove: `${baseUri}/${id}`
        });
        logger.debug(`getById(): film = ${JSON.stringify(film)}`);
        res.json(film);
    }

    @log
    async getByQuery(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const query: any = req.query;
        logger.debug(`queryParams = ${JSON.stringify(query)}`);

        let filme: Array<MDocument> = [];
        try {
            filme = await this.filmeService.find(query);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
        }

        logger.debug(`getByQuery(): filme = ${JSON.stringify(filme)}`);
        if (filme.length === 0) {
            logger.debug('status = 404');
            res.sendStatus(404);
            return;
        }

        const baseUri: string = getBaseUri(req);
        const firstId: string = filme[0]._id.valueOf() as string;
        const lastId: string = filme[filme.length - 1]._id.valueOf();
        res.links({
            self: `${baseUri}`,
            list: `${baseUri}`,
            first: `${baseUri}/${firstId}`,
            last: `${baseUri}/${lastId}`
        });

        res.json(filme);
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

        const film: model<MDocument> = new Film(req.body);
        logger.debug(`Body: ${JSON.stringify(film)}`);
        const err: any = validateFilm(film);
        if (err !== undefined) {
            logger.debug('status = 400');
            res.status(400).send(err);
            return;
        }

        let filmSaved: model<MDocument>;
        try {
            filmSaved = await this.filmeService.save(film) as model<MDocument>;
        } catch (err) {
            if (err instanceof TitelExistsError) {
                res.status(400).send(err.message);
                return;
            }

            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        const location: string = `${getBaseUri(req)}/${filmSaved._id}`;
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

        const film: MDocument = new Film(req.body);
        logger.debug(`Body: ${JSON.stringify(film)}`);
        const err: any = validateFilm(film);
        if (err !== undefined) {
            logger.debug(`status = 400, err: ${JSON.stringify(err)}`);
            res.status(400).send(err);
            return;
        }

        try {
            await this.filmeService.update(film);
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
            await this.filmeService.remove(id);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        res.sendStatus(204);
    }

    toString(): string {
        return 'FilmeRequestHandler';
    }
}

// -----------------------------------------------------------------------
// E x p o r t i e r t e   F u n c t i o n s
// -----------------------------------------------------------------------
const filmeRequestHandler: FilmeRequestHandler = new FilmeRequestHandler();
export function getById(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    filmeRequestHandler.getById(req, res, next);
}

export function getByQuery(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    filmeRequestHandler.getByQuery(req, res, next);
}

export function post(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    filmeRequestHandler.post(req, res, next);
}

export function put(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    filmeRequestHandler.put(req, res, next);
}

export function deleteFn(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    filmeRequestHandler.deleteMeth(req, res, next);
}
