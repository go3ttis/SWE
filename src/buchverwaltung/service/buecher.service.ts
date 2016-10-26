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

// Document kann nicht direkt importiert werden, weil es in ES2015 auch eine
// Klasse Document gibt
import {Document as MDocument, model, Query} from 'mongoose';

import {isBlank, isEmpty, log, logger, sendMail} from '../../shared/index';
import {Buch} from '../model/buch';

// API-Dokumentation zu mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

export class BuecherService {
    // Status eines Promise:
    // Pending: das Resultat gibt es noch nicht, weil die asynchrone Operation,
    //          die das Resultat liefert, noch nicht abgeschlossen ist
    // Fulfilled: die asynchrone Operation ist abgeschlossen und
    //            das Promise-Objekt hat einen Wert
    // Rejected: die asynchrone Operation ist fehlgeschlagen und das
    //           Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //           Stattdessen ist im Promise-Objekt die Fehlerursache enthalten.

    @log
    async findById(id: string): Promise<MDocument> {
        // ein Buch zur gegebenen ID asynchron suchen
        const result: Query<MDocument> = Buch.findById(id);
        return Promise.resolve(result);
    }

    @log
    async find(query?: any): Promise<Array<MDocument>> {
        // alle Buecher asynchron suchen u. aufsteigend nach titel sortieren
        // nach _id sortieren: Timestamp des INSERTs (Basis: Sek)
        // https://docs.mongodb.org/manual/reference/object-id
        if (isBlank(query) || Object.keys(query).length === 0) {
            const tmpQuery: Query<Array<MDocument>> = Buch.find();
            return Promise.resolve(tmpQuery.sort('titel'));
        }

        // Buecher zur Query (= JSON-Objekt durch Express) asynchron suchen
        let titelQuery: any = undefined;
        const titel: string = query.titel;
        if (!isEmpty(titel)) {
            // Titel in der Query: Teilstring des Titels,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            delete query.titel;
            titelQuery = {titel: new RegExp(titel, 'i')};
        }

        // z.B. {javascript: true, typescript: true}
        let javascriptQuery: any = undefined;
        if (query.javascript === 'true') {
            delete query.javascript;
            javascriptQuery = {schlagwoerter: 'JAVASCRIPT'};
        }
        let typescriptQuery: any = undefined;
        if (query.typescript === 'true') {
            delete query.typescript;
            typescriptQuery = {schlagwoerter: 'TYPESCRIPT'};
        }
        let schlagwoerterQuery: any = undefined;
        if (javascriptQuery !== undefined && typescriptQuery !== undefined) {
            schlagwoerterQuery = {schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT']};
            // OR statt AND
            // schlagwoerterQuery = {$or: [jsQuery, tsQuery]};
        } else if (javascriptQuery !== undefined) {
            schlagwoerterQuery = javascriptQuery;
        } else if (typescriptQuery !== undefined) {
            schlagwoerterQuery = typescriptQuery;
        }

        // clang-format off
        if (titelQuery !== undefined && schlagwoerterQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Buch.find();
            return tmpQuery.and([query, titelQuery, schlagwoerterQuery]);
        }
        if (titelQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Buch.find();
            return tmpQuery.and([query, titelQuery]);
        }
        if (schlagwoerterQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Buch.find();
            return tmpQuery.and([query, schlagwoerterQuery]);
        }
        // clang-format on

        return Buch.find(query);
        // Buch.findOne(query), falls das Suchkriterium eindeutig ist
    }

    @log
    async save(buch: model<MDocument>): Promise<model<MDocument>|void> {
        // Das gegebene Buch innerhalb von save() asynchron neu anlegen:
        // Promise.reject(err) bei Verletzung von DB-Constraints, z.B. unique
        const titel: string = (buch as any).titel;
        const tmp: MDocument = await Buch.findOne({titel: titel});
        if (tmp !== null) {
            // Promise<void> als Rueckgabewert
            return Promise.reject(new TitelExistsError(
                `Der Titel "${titel}" existiert bereits.`));
        }

        const buchSaved: model<MDocument> = await buch.save();

        const to: string = 'joe@doe.mail';
        const subject: string = `Neues Buch ${buchSaved._id}`;
        const body: string =
            `Das Buch mit dem Titel <strong>${(buchSaved as any).titel}` +
            '</strong> ist angelegt';
        sendMail(to, subject, body);

        return buchSaved;
    }

    @log
    async update(buch: MDocument): Promise<void> {
        const titel: string = (buch as any).titel;
        const tmp: MDocument = await Buch.findOne({titel: titel}) as MDocument;
        if (tmp !== null && tmp._id.toHexString() !== buch._id.toHexString()) {
            return Promise.reject(new TitelExistsError(
                `Der Titel "${titel}" existiert bereits bei ${tmp._id}.`));
        }
        // Das gegebene Buch asynchron aktualisieren
        // __v wird nur erhoeht, durch find() und anschl. update()
        // innerhalb von findByIdAndUpdate():
        // Promise.reject(err) bei Verletzung von DB-Constraints, zB unique
        const updateQuery: Query<MDocument> =
            Buch.findByIdAndUpdate(buch._id, buch);
        // entspricht findOneAndUpdate({_id: id})

        // Update-Query ausfuehren
        const result: Promise<MDocument> = updateQuery.then();
        if (await result === null) {
            return Promise.reject(new IdNotExistsError(
                `Es gibt kein Buch mit der ID "${buch._id}"`));
        }

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Buch.findOneAndUpdate(bedingung, update)
        //    buch.update(bedingung)
    }

    @log
    async remove(id: string): Promise<void> {
        // Das Buch zur gegebenen ID asynchron loeschen
        const buchPromise: Query<MDocument> = Buch.findByIdAndRemove(id);
        // entspricht: findOneAndRemove({_id: id})

        // Ohne then (oder Callback) wird nicht geloescht,
        // sondern ein Query-Objekt zurueckgeliefert
        buchPromise.then(
            buch => logger.debug(`Geloescht: ${JSON.stringify(buch)}`));

        // Weitere Methoden von mongoose, um zu loeschen:
        //    Buch.findOneAndRemove(bedingung)
        //    Buch.remove(bedingung)
    }

    toString(): string {
        return 'BuecherService';
    }
}

// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript#answer-5251506
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Error

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
