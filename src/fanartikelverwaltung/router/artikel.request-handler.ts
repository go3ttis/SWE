import {NextFunction, Request, Response} from 'express';
// Document kann nicht direkt importiert werden, weil es in ES2015 auch eine
// Klasse Document gibt
import {Document as MDocument, model} from 'mongoose';
import {inspect} from 'util';

import {logger} from '../../shared';
import {getBaseUri, isBlank, log, MIME_CONFIG} from '../../shared/index';
import {Fanartikel, validateFanartikel} from '../model/fanartikel';
import {ArtikelService, IdNotExistsError, TitelExistsError} from '../service/artikel.service';

class ArtikelRequestHandler {
    private readonly artikelService: ArtikelService = new ArtikelService();


    @log
    async getById(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const id: string = req.params.id;

        let fanartikel: MDocument;
        try {
            fanartikel = await this.artikelService.findById(id);
        } catch (err) {
            // Exception einer async. Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        if (isBlank(fanartikel)) {
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
        logger.debug(`getById(): fanartikel = ${JSON.stringify(fanartikel)}`);
        res.json(fanartikel);
    }

    @log
    async getByQuery(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const query: any = req.query;
        logger.debug(`queryParams = ${JSON.stringify(query)}`);

        let artikel: Array<MDocument> = [];
        try {
            artikel = await this.artikelService.find(query);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
        }

        logger.debug(`getByQuery(): artikel = ${JSON.stringify(artikel)}`);
        if (artikel.length === 0) {
            logger.debug('status = 404');
            res.sendStatus(404);
            return;
        }

        // Link Header
        const baseUri: string = getBaseUri(req);
        const firstId: string = artikel[0]._id.valueOf() as string;
        const lastId: string = artikel[artikel.length - 1]._id.valueOf();
        res.links({
            self: `${baseUri}`,
            list: `${baseUri}`,
            first: `${baseUri}/${firstId}`,
            last: `${baseUri}/${lastId}`
        });

        res.json(artikel);
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

        const fanartikel: model<MDocument> = new Fanartikel(req.body);
        logger.debug(`Body: ${JSON.stringify(fanartikel)}`);
        const err: any = validateFanartikel(fanartikel);
        if (err !== undefined) {
            logger.debug('status = 400');
            res.status(400).send(err);
            return;
        }

        let fanartikelSaved: model<MDocument>;
        try {
            fanartikelSaved =
                await this.artikelService.save(fanartikel) as model<MDocument>;
        } catch (err) {
            if (err instanceof TitelExistsError) {
                res.status(400).send(err.message);
                return;
            }

            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        const location: string = `${getBaseUri(req)}/${fanartikelSaved._id}`;
        logger.debug(`post(): location = ${location}`);
        res.location(location);
        res.sendStatus(201);
        logger.info(`Schön dass du anlegen kannst :)`);
    }

    @log
    async put(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (req.header(MIME_CONFIG.contentType) === undefined
            || req.header(MIME_CONFIG.contentType).toLowerCase()
                !== MIME_CONFIG.applicationJson) {
            res.status(406);
            return;
        }

        const fanartikel: MDocument = new Fanartikel(req.body);
        logger.debug(`Body: ${JSON.stringify(fanartikel)}`);

        const err: any = validateFanartikel(fanartikel);
        if (err !== undefined) {
            logger.debug(`status = 400, err: ${JSON.stringify(err)}`);
            res.status(400).send(err);
            return;
        }

        try {
            await this.artikelService.update(fanartikel);
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
        logger.info(`Das Ändern hat geklappt!! Ganz Toll!`);
    }

    @log
    async deleteMeth(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const id: string = req.params.id;
        logger.debug(`id = ${id}`);

        try {
            await this.artikelService.remove(id);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        res.sendStatus(204);
        logger.info(`Du hast es geschafft zu löschen, jetzt ist es weg...`);
    }

    toString(): string {
        return 'ArtikelRequestHandler';
    }
}

// -----------------------------------------------------------------------
// E x p o r t i e r t e   F u n c t i o n s
// -----------------------------------------------------------------------
const artikelRequestHandler: ArtikelRequestHandler =
    new ArtikelRequestHandler();
export function getById(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    artikelRequestHandler.getById(req, res, next);
}

export function getByQuery(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    artikelRequestHandler.getByQuery(req, res, next);
}

export function post(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    artikelRequestHandler.post(req, res, next);
}

export function put(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    artikelRequestHandler.put(req, res, next);
}

export function deleteFn(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    artikelRequestHandler.deleteMeth(req, res, next);
}
