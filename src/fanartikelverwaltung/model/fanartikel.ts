import {Document as MDocument, Model, model, Schema} from 'mongoose';
import {DB_CONFIG, isEmpty, isMongoId, isPresent, MAX_RATING} from '../../shared/index';

const fanartikelSchema: Schema = new Schema(
    {
      titel: {type: String, required: true, unique: true},
      art: String,
      rating: Number,
      hersteller: {type: String, required: true},
      datum: Date,
      preis: {type: Number, required: true},
      rabatt: Number,
      lieferbar: Boolean,
      schlagwoerter: {type: [String], index: true},
      email: {type: String, required: true, uniqueCaseInsensitive: true},
      Haendler: [Schema.Types.Mixed]
    },
    {collection: 'artikel'});

fanartikelSchema.set('autoIndex', DB_CONFIG.autoIndex);

// fuer ein Document (-Objekt) die Methode toJSON bereitstellen
fanartikelSchema.set('toJSON', {getters: true, virtuals: false});

const MODEL_NAME: string = 'Fanartikel';



export function validateFanartikel(fanartikel: any): any {
    'use strict';

    let err: any = {};

    if (!fanartikel.isNew && !isMongoId(fanartikel._id)) {
        err.id = 'Der Artikel hat eine ungueltige ID';
    }
    if (isEmpty(fanartikel.titel)) {
        err.titel = 'Ein Fanartikel muss einen Titel haben';
    } else if (!fanartikel.titel.match(/^\w.*/)) {
        err.titel =
            'Ein Artikeltitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen';
    }
    if (isEmpty(fanartikel.art)) {
        err.art = 'Die Art eines Artikels muss gesetzt sein';
    } else if (fanartikel.art !== 'KLEIDUNG' && fanartikel.art !== 'DIGITAL') {
        err.art = 'Die Art eines Artikels muss KLEIDUNG oder DIGITAL sein';
    }
    if (isPresent(fanartikel.rating)
        && (fanartikel.rating < 0 || fanartikel.rating > MAX_RATING)) {
        err.rating = `${fanartikel.rating} ist keine gueltige Bewertung`;
    }
    if (isEmpty(fanartikel.hersteller)) {
        err.hersteller = 'Der Hersteller des Artikels muss gesetzt sein';
    } else if (
        fanartikel.hersteller !== 'IWI_VERLAG'
        && fanartikel.hersteller !== 'HSKA_VERLAG'
        && fanartikel.hersteller !== 'ADIDAS') {
        err.hersteller =
            'Der Hersteller eines Artikels muss IWI_VERLAG,HSKA_VERLAG oder ADIDAS sein';
    }
    if (isPresent(fanartikel.email)
        && !fanartikel.email.match(
               /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
        err.email = `${fanartikel.email} ist keine gueltige Email-Adresse`;
    }

    return Object.keys(err).length !== 0 ? err : undefined;
};

export const Fanartikel: Model<MDocument> = model(MODEL_NAME, fanartikelSchema);
