
import {Document as MDocument, model, Query} from 'mongoose';
import {isBlank, isEmpty, log, logger} from '../../shared/index';
import {Kunde} from '../model/kunde';

export class KundenService {
    @log
    async findById(id: string): Promise<MDocument> {
        const result: Query<MDocument> = Kunde.findById(id);
        return Promise.resolve(result);
    }

    @log
    async find(query?: any): Promise<Array<MDocument>> {
        if (isBlank(query) || Object.keys(query).length === 0) {
            const tmpQuery: Query<Array<MDocument>> = Kunde.find();
            return Promise.resolve(tmpQuery.sort('name'));
        }

        let nameQuery: any = undefined;
        const name: string = query.name;
        if (!isEmpty(name)) {
            delete query.name;
            nameQuery = {name: new RegExp(name, 'i')};
        }

        // clang-format off
        if (nameQuery !== undefined) {
            const tmpQuery: Query<Array<MDocument>> = Kunde.find();
            return tmpQuery.and([query, nameQuery]);
        }
        // clang-format on

        return Kunde.find(query);
        // Kunde.findOne(query), falls das Suchkriterium eindeutig ist
    }

    @log
    async save(kunde: model<MDocument>): Promise<model<MDocument>|void> {
        // Den gegebenen Kunde innerhalb von save() asynchron neu anlegen:
        // Promise.reject(err) bei Verletzung von DB-Constraints, z.B. unique
        const name: string = (kunde as any).name;
        const tmp: MDocument = await Kunde.findOne({name: name});
        if (tmp !== null) {
            // Promise<void> als Rueckgabewert
            return Promise.reject(
                new NameExistsError(`Der Titel "${name}" existiert bereits.`));
        }

        const kundeSaved: model<MDocument> = await kunde.save();

        return kundeSaved;
    }

    @log
    async update(kunde: MDocument): Promise<void> {
        const name: string = (kunde as any).titel;
        const tmp: MDocument = await Kunde.findOne({name: name}) as MDocument;
        if (tmp !== null && tmp._id.toHexString() !== kunde._id.toHexString()) {
            return Promise.reject(new NameExistsError(
                `Der Name "${name}" existiert bereits bei ${tmp._id}.`));
        }
        // Den gegebenen Film asynchron aktualisieren
        // __v wird nur erhoeht, durch find() und anschl. update()
        // innerhalb von findByIdAndUpdate():
        // Promise.reject(err) bei Verletzung von DB-Constraints, zB unique
        const updateQuery: Query<MDocument> =
            Kunde.findByIdAndUpdate(kunde._id, kunde);
        // entspricht findOneAndUpdate({_id: id})

        // Update-Query ausfuehren
        const result: Promise<MDocument> = updateQuery.then();
        if (await result === null) {
            return Promise.reject(new IdNotExistsError(
                `Es gibt keinen Kunden mit der ID "${kunde._id}"`));
        }
    }

    @log
    async remove(id: string): Promise<void> {
        // Den Film zur gegebenen ID asynchron loeschen
        const kundePromise: Query<MDocument> = Kunde.findByIdAndRemove(id);
        // entspricht: findOneAndRemove({_id: id})

        // Ohne then (oder Callback) wird nicht geloescht,
        // sondern ein Query-Objekt zurueckgeliefert
        kundePromise.then(
            kunde => logger.debug(`Geloescht: ${JSON.stringify(kunde)}`));
    }

    toString(): string {
        return 'kundenService';
    }
}

export class NameExistsError implements Error {
    name: string = 'NameExistsError';

    constructor(public message: string) {
        logger.debug(`NameExistsError.constructor(): ${message}`);
    }
}

export class IdNotExistsError implements Error {
    name: string = 'IdNotExistsError';

    constructor(public message: string) {
        logger.debug(`IdNotExistsError.constructor(): ${message}`);
    }
}
