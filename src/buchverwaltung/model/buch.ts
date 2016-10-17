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

import {Document as MDocument, Model, model, Schema} from 'mongoose';
import {DB_CONFIG, isEmpty, isMongoId, isPresent, MAX_RATING} from '../../shared/index';

// Eine Collection in MongoDB besteht aus Dokumenten im BSON-Format

// Ein Schema in Mongoose ist definiert die Struktur und Methoden fuer die
// Dokumente in einer Collection.
// Ein Schluessel im Schema definiert eine Property fuer jedes Dokument.
// Ein Schematyp (String, Number, Boolean, Date, Array, ObjectId) legt den Typ
// der Property fest.

// Im 2. Argument des Konstruktors wird der Name der Collection festgelegt.
// Der Default-Name der Collection ist der Plural zum Namen des Models (s.u.),
// d.h. die Collection haette den Namen "Buchs".
const buchSchema: Schema = new Schema(
    {
      titel: {type: String, required: true, unique: true},
      art: String,
      rating: Number,
      verlag: {type: String, required: true},
      datum: Date,
      preis: {type: Number, required: true},
      rabatt: Number,
      lieferbar: Boolean,
      schlagwoerter: {type: [String], index: true},
      email: {type: String, required: true, uniqueCaseInsensitive: true},
      autoren: [Schema.Types.Mixed]
    },
    {collection: 'buecher'});

// automat. Validierung der Indexe beim 1. Zugriff
buchSchema.set('autoIndex', DB_CONFIG.autoIndex);

// fuer ein Document (-Objekt) die Methode toJSON bereitstellen
buchSchema.set('toJSON', {getters: true, virtuals: false});

const MODEL_NAME: string = 'Buch';

// Methoden zum Schema hinzufuegen, damit sie spaeter beim Model (s.u.)
// verfuegbar sind, was aber bei buch.check() zu eines TS-Syntaxfehler fuehrt:
// buchSchema.methods.check = function(): any { ... }

export function validateBuch(buch: any): any {
    'use strict';

    let err: any = {};

    if (!buch.isNew && !isMongoId(buch._id)) {
        err.id = 'Das Buch hat eine ungueltige ID';
    }
    if (isEmpty(buch.titel)) {
        err.titel = 'Ein Buch muss einen Titel haben';
    } else if (!buch.titel.match(/^\w.*/)) {
        err.titel =
            'Ein Buchtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen';
    }
    if (isEmpty(buch.art)) {
        err.art = 'Die Art eines Buches muss gesetzt sein';
    } else if (buch.art !== 'KINDLE' && buch.art !== 'DRUCKAUSGABE') {
        err.art = 'Die Art eines Buches muss KINDLE oder DRUCKAUSGABE sein';
    }
    if (isPresent(buch.rating)
        && (buch.rating < 0 || buch.rating > MAX_RATING)) {
        err.rating = `${buch.rating} ist keine gueltige Bewertung`;
    }
    if (isEmpty(buch.verlag)) {
        err.verlag = 'Der Verlag des Buches muss gesetzt sein';
    } else if (buch.verlag !== 'IWI_VERLAG' && buch.verlag !== 'HSKA_VERLAG') {
        err.verlag =
            'Der Verlag eines Buches muss IWI_VERLAG oder HSKA_VERLAG sein';
    }
    if (isPresent(buch.email)
        && !buch.email.match(
               /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
        err.email = `${buch.email} ist keine gueltige Email-Adresse`;
    }

    return Object.keys(err).length !== 0 ? err : undefined;
};

// buchSchema.statics.findByTitel = function(
//     titel: string, cb: Function): Array<mongoose.Document> {
//     return this.find({titel: titel}, cb);
// };

// Ein Model ist ein uebersetztes Schema und stellt die CRUD-Operationen fuer
// die Dokumente bereit, d.h. das Pattern "Active Record" wird realisiert.
export const Buch: Model<MDocument> = model(MODEL_NAME, buchSchema);
