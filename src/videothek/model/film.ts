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

import {Document as MDocument, Model, model, Schema} from 'mongoose';
import {DB_CONFIG, isEmpty, isMongoId, isPresent, MAX_RATING} from '../../shared/index';

const filmSchema: Schema = new Schema(
    {
      titel: {type: String, required: true, unique: true},
      rating: Number,
      genre: String,
      laenge: Number,
      sprache: String,
      medium: String,
      preis: {type: Number, required: true},
      ausgeliehen: Boolean,
      erscheinungsdatum: Date,
      schauspieler: [Schema.Types.Mixed]
    },
    {collection: 'filme'});

filmSchema.set('autoIndex', DB_CONFIG.autoIndex);

filmSchema.set('toJSON', {getters: true, virtuals: false});

const MODEL_NAME: string = 'Film';

export function validateFilm(film: any): any {
    'use strict';

    let err: any = {};

    if (!film.isNew && !isMongoId(film._id)) {
        err.id = 'Der Film hat eine ungueltige ID';
    }
    if (isEmpty(film.titel)) {
        err.titel = 'Ein Film muss einen Titel haben';
    } else if (!film.titel.match(/^\w.*/)) {
        err.titel =
            'Ein Filmtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen';
    }
    if (isEmpty(film.medium)) {
        err.medium = 'Das Medium eines Filmes muss gesetzt sein';
    } else if (film.medium !== 'DVD' && film.medium !== 'Blu-Ray') {
        err.medium = 'Das Medium eines Filmes muss DVD oder Blu-Ray sein';
    }
    if (isPresent(film.rating)
        && (film.rating < 0 || film.rating > MAX_RATING)) {
        err.rating = `${film.rating} ist keine gueltige Bewertung`;
    }

    return Object.keys(err).length !== 0 ? err : undefined;
};

export const Film: Model<MDocument> = model(MODEL_NAME, filmSchema);
