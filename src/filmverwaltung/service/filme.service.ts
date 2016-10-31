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

import {Document as MDocument, model, Query} from 'mongoose';
import {isBlank, isEmpty, log, logger} from '../../shared/index';
import {Film} from '../model/film';

export class FilmeService {
    @log
    async findById(id: string): Promise<MDocument> {
        const result: Query<MDocument> = Film.findById(id);
        return Promise.resolve(result);
    }

    @log
    async find(query?: any): Promise<Array<MDocument>> {
        // alle Buecher asynchron suchen u. aufsteigend nach titel sortieren
        if (isBlank(query) || Object.keys(query).length === 0) {
            const tmpQuery: Query<Array<MDocument>> = Film.find();
            return Promise.resolve(tmpQuery.sort('titel'));
        }

        let titelQuery: any = undefined;
        const titel: string = query.titel;
        if (!isEmpty(titel)) {
            // Titel in der Query: Teilstring des Titels,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            delete query.titel;
            titelQuery = {titel: new RegExp(titel, 'i')};
        }

        let mediumQuery: any = undefined;
        const medium: string = query.medium;
        if (!isEmpty(medium)) {
            delete query.medium;
            mediumQuery = {medium: medium};
        }

        // clang-format off
        if (titelQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Film.find();
            return tmpQuery.and([query, titelQuery]);
        }
        if (mediumQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Film.find();
            return tmpQuery.and([query, mediumQuery]);
        }
        // clang-format on

        return Film.find(query);
        // Film.findOne(query), falls das Suchkriterium eindeutig ist
    }

    @log
    async save(film: model<MDocument>): Promise<model<MDocument>|void> {
        // Den gegebenen Film innerhalb von save() asynchron neu anlegen:
        // Promise.reject(err) bei Verletzung von DB-Constraints, z.B. unique
        const titel: string = (film as any).titel;
        const tmp: MDocument = await Film.findOne({titel: titel});
        if (tmp !== null) {
            // Promise<void> als Rueckgabewert
            return Promise.reject(new TitelExistsError(
                `Der Titel "${titel}" existiert bereits.`));
        }

        const filmSaved: model<MDocument> = await film.save();

        return filmSaved;
    }

    @log
    async update(film: MDocument): Promise<void> {
        const titel: string = (film as any).titel;
        const tmp: MDocument = await Film.findOne({titel: titel}) as MDocument;
        if (tmp !== null && tmp._id.toHexString() !== film._id.toHexString()) {
            return Promise.reject(new TitelExistsError(
                `Der Titel "${titel}" existiert bereits bei ${tmp._id}.`));
        }
        // Den gegebenen Film asynchron aktualisieren
        // __v wird nur erhoeht, durch find() und anschl. update()
        // innerhalb von findByIdAndUpdate():
        // Promise.reject(err) bei Verletzung von DB-Constraints, zB unique
        const updateQuery: Query<MDocument> =
            Film.findByIdAndUpdate(film._id, film);
        // entspricht findOneAndUpdate({_id: id})

        // Update-Query ausfuehren
        const result: Promise<MDocument> = updateQuery.then();
        if (await result === null) {
            return Promise.reject(new IdNotExistsError(
                `Es gibt keinen Film mit der ID "${film._id}"`));
        }
    }

    @log
    async remove(id: string): Promise<void> {
        // Den Film zur gegebenen ID asynchron loeschen
        const filmPromise: Query<MDocument> = Film.findByIdAndRemove(id);
        // entspricht: findOneAndRemove({_id: id})

        // Ohne then (oder Callback) wird nicht geloescht,
        // sondern ein Query-Objekt zurueckgeliefert
        filmPromise.then(
            film => logger.debug(`Geloescht: ${JSON.stringify(film)}`));
    }

    toString(): string {
        return 'FilmeService';
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
