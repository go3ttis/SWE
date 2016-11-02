
import {Document as MDocument, model, Query} from 'mongoose';

import {isBlank, isEmpty, log, logger, sendMail} from '../../shared/index';
import {Fanartikel} from '../model/fanartikel';



export class ArtikelService {
    // Status eines Promise:
    // Pending: das Resultat gibt es noch nicht, weil die asynchrone Operation,
    //          die das Resultat liefert, noch nicht abgeschlossen ist
    // Fulfilled: die asynchrone Operation ist abgeschlossen und
    //            das Promise-Objekt hat einen Wert
    // Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //           Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //           Stattdessen ist im Promise-Objekt die Fehlerursache enthalten.

    @log
    async findById(id: string): Promise<MDocument> {
        const result: Query<MDocument> = Fanartikel.findById(id);
        return Promise.resolve(result);
    }

    @log
    async find(query?: any): Promise<Array<MDocument>> {
        if (isBlank(query) || Object.keys(query).length === 0) {
            const tmpQuery: Query<Array<MDocument>> = Fanartikel.find();
            return Promise.resolve(tmpQuery.sort('titel'));
        }

        // Artikel zur Query (= JSON-Objekt durch Express) asynchron suchen
        let titelQuery: any = undefined;
        const titel: string = query.titel;
        if (!isEmpty(titel)) {
            // Titel in der Query: Teilstring des Titels,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            delete query.titel;
            titelQuery = {titel: new RegExp(titel, 'i')};
        }



        let geilQuery: any = undefined;
        if (query.geil === 'true') {
            delete query.geil;
            geilQuery = {schlagwoerter: 'GEIL'};
        }

        let nichtgeilQuery: any = undefined;
        if (query.nichtgeil === 'true') {
            delete query.nichtgeil;
            nichtgeilQuery = {schlagwoerter: 'NICHTGEIL'};
        }

        let schlagwoerterQuery: any = undefined;
        if (geilQuery !== undefined && nichtgeilQuery !== undefined) {
            schlagwoerterQuery = {schlagwoerter: ['GEIL', 'NICHTGEIL']};
            // OR statt AND
            // schlagwoerterQuery = {$or: [jsQuery, tsQuery]};
        } else if (geilQuery !== undefined) {
            schlagwoerterQuery = geilQuery;
        } else if (nichtgeilQuery !== undefined) {
            schlagwoerterQuery = nichtgeilQuery;
        }

        // clang-format off
        if (titelQuery !== undefined && schlagwoerterQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Fanartikel.find();
            return tmpQuery.and([query, titelQuery, schlagwoerterQuery]);
        }
        if (titelQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Fanartikel.find();
            return tmpQuery.and([query, titelQuery]);
        }
        if (schlagwoerterQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Fanartikel.find();
            return tmpQuery.and([query, schlagwoerterQuery]);
        }
        // clang-format on

        return Fanartikel.find(query);
        // .findOne(query), falls das Suchkriterium eindeutig ist
    }

    @log
    async save(fanartikel: model<MDocument>): Promise<model<MDocument>|void> {
        // Das gegebene  innerhalb von save() asynchron neu anlegen:
        // Promise.reject(err) bei Verletzung von DB-Constraints, z.B. unique
        const titel: string = (fanartikel as any).titel;
        const tmp: MDocument = await Fanartikel.findOne({titel: titel});
        if (tmp !== null) {
            // Promise<void> als Rueckgabewert
            return Promise.reject(new TitelExistsError(
                `Der Titel "${titel}" existiert bereits.`));
        }

        const fanartikelSaved: model<MDocument> = await fanartikel.save();

        const to: string = 'joe@doe.mail';
        const subject: string = `Neuer Fanartikel ${fanartikelSaved._id}`;
        const body: string =
            `Der Artikel mit dem Titel <strong>${(fanartikelSaved as any)
                .titel}`
            +
            '</strong> ist angelegt';
        sendMail(to, subject, body);

        return fanartikelSaved;
    }

    @log
    async update(fanartikel: MDocument): Promise<void> {
        const titel: string = (fanartikel as any).titel;
        const tmp: MDocument =
            await Fanartikel.findOne({titel: titel}) as MDocument;
        if (tmp !== null
            && tmp._id.toHexString() !== fanartikel._id.toHexString()) {
            return Promise.reject(new TitelExistsError(
                `Der Titel "${titel}" existiert bereits bei ${tmp._id}.`));
        }

        const updateQuery: Query<MDocument> =
            Fanartikel.findByIdAndUpdate(fanartikel._id, fanartikel);

        const result: Promise<MDocument> = updateQuery.then();
        if (await result === null) {
            return Promise.reject(new IdNotExistsError(
                `Es gibt kein Fanartikel mit der ID "${fanartikel._id}"`));
        }
    }

    @log
    async remove(id: string): Promise<void> {
        const fanartikelPromise: Query<MDocument> =
            Fanartikel.findByIdAndRemove(id);
        // entspricht: findOneAndRemove({_id: id})

        // Ohne then (oder Callback) wird nicht geloescht,
        // sondern ein Query-Objekt zurueckgeliefert
        fanartikelPromise.then(
            fanartikel =>
                logger.debug(`Geloescht: ${JSON.stringify(fanartikel)}`));
    }

    toString(): string {
        return 'ArtikelService';
    }
}



export class TitelExistsError implements Error {
    name: string = 'TitelExistsError';

    constructor(public message: string) {
        logger.debug(`TitelExistsError.constructor(): ${message}`);
    }
}

export class IdNotExistsError implements Error {
    name: string = 'IdNotExistsError';

    constructor(public message: string) {
        logger.debug(`IdNotExistsError.constructor(): ${message}`);
    }
}
