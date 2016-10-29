import {NextFunction, Request, Response} from 'express';
import {Document as MDocument, model} from 'mongoose';
import {inspect} from 'util';

import {getBaseUri, isBlank, log, logger, MIME_CONFIG} from '../../shared/index';
import {Kunde, validateKunde} from '../model/kunde';
import {IdNotExistsError, KundenService, NameExistsError} from '../service/kunden.service';

class KundenRequestHandler {
    private readonly kundenService: KundenService = new KundenService();

    @log
    async getById(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const id: string = req.params.id;

        let kunde: MDocument;
        try {
            kunde = await this.kundenService.findById(id);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        if (isBlank(kunde)) {
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
        logger.debug(`getById(): kunde = ${JSON.stringify(kunde)}`);
        res.json(kunde);
    }

    @log
    async getByQuery(req: Request, res: Response, next: NextFunction):
        Promise<void> {
        const query: any = req.query;
        logger.debug(`queryParams = ${JSON.stringify(query)}`);

        let kunden: Array<MDocument> = [];
        try {
            kunden = await this.kundenService.find(query);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
        }

        logger.debug(`getByQuery(): kunden = ${JSON.stringify(kunden)}`);
        if (kunden.length === 0) {
            logger.debug('status = 404');
            res.sendStatus(404);
            return;
        }

        const baseUri: string = getBaseUri(req);
        const firstId: string = kunden[0]._id.valueOf() as string;
        const lastId: string = kunden[kunden.length - 1]._id.valueOf();
        res.links({
            self: `${baseUri}`,
            list: `${baseUri}`,
            first: `${baseUri}/${firstId}`,
            last: `${baseUri}/${lastId}`
        });

        res.json(kunden);
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

        const kunde: model<MDocument> = new Kunde(req.body);
        logger.debug(`Body: ${JSON.stringify(kunde)}`);
        const err: any = validateKunde(kunde);
        if (err !== undefined) {
            logger.debug('status = 400');
            res.status(400).send(err);
            return;
        }

        let kundeSaved: model<MDocument>;
        try {
            kundeSaved =
                await this.kundenService.save(kunde) as model<MDocument>;
        } catch (err) {
            if (err instanceof NameExistsError) {
                res.status(400).send(err.message);
                return;
            }

            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        const location: string = `${getBaseUri(req)}/${kundeSaved._id}`;
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

        const film: MDocument = new Kunde(req.body);
        logger.debug(`Body: ${JSON.stringify(film)}`);
        const err: any = validateKunde(film);
        if (err !== undefined) {
            logger.debug(`status = 400, err: ${JSON.stringify(err)}`);
            res.status(400).send(err);
            return;
        }

        try {
            await this.kundenService.update(film);
        } catch (err) {
            if (err instanceof NameExistsError
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
            await this.kundenService.remove(id);
        } catch (err) {
            logger.error(`Error: ${inspect(err)}`);
            res.sendStatus(500);
            return;
        }

        res.sendStatus(204);
    }

    toString(): string {
        return 'KundenRequestHandler';
    }
}

// -----------------------------------------------------------------------
// E x p o r t i e r t e   F u n c t i o n s
// -----------------------------------------------------------------------
const kundenRequestHandler: KundenRequestHandler = new KundenRequestHandler();
export function getById(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    kundenRequestHandler.getById(req, res, next);
}

export function getByQuery(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    kundenRequestHandler.getByQuery(req, res, next);
}

export function post(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    kundenRequestHandler.post(req, res, next);
}

export function put(req: Request, res: Response, next: NextFunction): void {
    'use strict';
    kundenRequestHandler.put(req, res, next);
}

export function deleteFn(
    req: Request, res: Response, next: NextFunction): void {
    'use strict';
    kundenRequestHandler.deleteMeth(req, res, next);
}
