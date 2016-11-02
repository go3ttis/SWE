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

// Monatl. Downloads:
//      Mocha   3,5 Mio
//      Tape    1,5 Mio
//
//      Chai    2,5 Mio
//      Should  0,5 Mio

// damit describe() und it() von Mocha verfuegbar sind:
/// <reference path="../../../node_modules/@types/mocha/index.d.ts"/>

// Direkter Aufruf statt "gulp test":
// mocha -R mochawesome dist\buchverwaltung\router\index.spec.js

import * as chai from 'chai';
import * as supertest from 'supertest';

import {app, PATHS} from '../../app';
import {logger, SERVER_CONFIG} from '../../shared';

// -----------------------------------------------------------------------------
// T e s t s e r v e r   m i t   H T T P   s t a t t   H T T P S
// -----------------------------------------------------------------------------
const {host, port}: any = SERVER_CONFIG;
export const server: any = app.listen(port, host, () => {
    const port: number = server.address().port;
    logger.info(`Node ${process.version}`);
    logger.info(
        `Der geilste Server der Welt ist gestartet: http://${host}:${port}`);
});

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idGetVorhanden: string = '000000000000000000000001';
const idNichtVorhanden: string = '000000000000000000000999';

const neuerFanartikel: any = {
    titel: 'Neu2',
    rating: 1,
    art: 'DIGITAL',
    hersteller: 'ADIDAS',
    preis: 99.9,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28T00:00:00.000Z',
    email: 'theo@test.de',
    haendler: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: ['NICHTGEIL']
};
const neuerFanartikelInvalid: any = {
    titel: 'Blabla2',
    rating: -1,
    art: 'UNSICHTBAR',
    hersteller: 'NO_hersteller',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '2016-02-01T00:00:00.000Z',
    email: 'fromNowhere',
    haendler: [{nachname: 'Test2', vorname: 'Theo2'}],
    schlagwoerte: []
};
const neuerFanartikelTitelExistiert: any = {
    titel: 'Alpha',
    rating: 1,
    art: 'KLEIDUNG',
    hersteller: 'HSKA_hersteller',
    preis: 99.9,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28T00:00:00.000Z',
    email: 'theo@test.de',
    haendler: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: ['GEIL']
};

const geaenderterFanartikel: any = {
    _id: '000000000000000000000003',
    titel: 'Geaendert',
    rating: 1,
    art: 'KLEIDUNG',
    hersteller: 'HSKA_VERLAG',
    preis: 33.3,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03T00:00:00.000Z',
    __v: 0,
    haendler: [{nachname: 'Gamma', vorname: 'Claus'}],
    schlagwoerte: ['GEIL', 'NICHTGEIL']
};

const geaenderterFanartikelfalscheDaten: any = {
    _id: '000000000000000000000003',
    titel: 'Alpha',
    rating: -1,
    art: 'UNSICHTBAR',
    hersteller: 'NO_hersteller',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '2016-02-01T00:00:00.000Z',
    email: 'fromNowhere',
    __v: 0,
    haendler: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: []
};

const idDeleteVorhanden: string = '000000000000000000000002';

const loginDaten: any = {
    username: 'admin',
    password: 'p'
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
chai.should();

// JWT fuer Authentifizierung
let token: string;

// tslint:disable:no-unused-expression
describe('fanartikelverwaltung', function(): void {
    const path: string = PATHS.artikel;
    const loginPath: string = PATHS.login;


    before((done): void => {
        supertest(server)
            .post(`${loginPath}`)
            .set('Content-type', `application/x-www-form-urlencoded`)
            .send(loginDaten)
            .expect(200)
            .end((err: any, response: any) => {
                token = response.body.token;
                token.should.be.not.empty;
                // synchroner Before-Hook
                done();
            });
    });

    it('Alle Artikel', (done: MochaDone): void => {
        supertest(server)
            .get(`${path}`)
            // Assertion = Expectation
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err: any, response: any) => {
                // response.body ist ein JSON-Array mit mind. 1 JSON-Objekt
                response.body.should.be.not.empty;
                done();
            });
    });

    it('Fanartikel zu gegebener ID', (done: MochaDone): void => {
        supertest(server)
            .get(`${path}/${idGetVorhanden}`)
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err: any, response: any) => {
                // response.body enthaelt ein JSON-Objekt zur gegebenen ID
                response.body._id.should.be.equal(idGetVorhanden);
                done();
            });
    });

    it('Kein Fanartikel zu gegebener ID', (done: MochaDone): void => {
        supertest(server)
            .get(`${path}/${idNichtVorhanden}`)
            .expect(404)
            .end(done);
    });



    it('Keine Artikel mit dem Schlagwort "fussball"',
       (done: MochaDone): void => {
           supertest(server).get(`${path}?fussball=true`).expect(404).end(done);
       });


    it('Neuer Fanartikel mit Token', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(neuerFanartikel)
            .expect(201)
            .end((err: any, response: any) => {
                const location: string = response.header.location;
                location.should.be.not.empty;


                const indexLastSlash: number = location.lastIndexOf('/');
                const idStr: string = location.substring(indexLastSlash + 1);
                idStr.should.match(/[0-9a-f]{24}/);
                done();
            });
    });
    it('Neuer Fanartikel, aber ohne Token', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .send(neuerFanartikel)
            .expect(401)
            .end(done);
    });

    it('Neuer Fanartikel mit ungueltigen Daten', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(neuerFanartikelInvalid)
            .expect(400)
            .end((err: any, response: any) => {
                const body: any = response.body;
                body.art.should.not.be.empty;
                body.rating.should.not.be.empty;
                body.hersteller.should.not.be.empty;
                body.email.should.not.be.empty;
                done();
            });
    });

    it('Neuer Fanartikel, aber der Titel existiert bereits',
       (done: MochaDone): void => {
           supertest(server)
               .post(`${path}`)
               .set('Authorization', `Bearer ${token}`)
               .send(neuerFanartikelTitelExistiert)
               .expect(400)
               .end(done);
       });



    it('Neuer Fanartikel, aber mit falschem Token', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', 'Bearer x')
            .send(neuerFanartikel)
            .expect(401)
            .end(done);
    });


    it('Vorhandenen Fanartikel aendern, aber mit ungueltigen Daten',
       (done: MochaDone): void => {
           supertest(server)
               .put(`${path}`)
               .set('Authorization', `Bearer ${token}`)
               .send(geaenderterFanartikelfalscheDaten)
               .expect(400)
               .end((err: any, response: any) => {
                   const body: any = response.body;
                   body.art.should.not.be.empty;
                   body.rating.should.not.be.empty;
                   body.hersteller.should.not.be.empty;
                   body.email.should.not.be.empty;
                   done();
               });
       });



    it('Vorhandenen Fanartikel aendern, aber mit falschem Token',
       (done: MochaDone): void => {
           supertest(server)
               .put(`${path}`)
               .set('Authorization', 'Bearer x')
               .send(geaenderterFanartikel)
               .expect(401)
               .end(done);
       });

    it('Vorhandenen Fanartikel loeschen', (done: MochaDone): void => {
        supertest(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
            .end(done);
    });

    it('Vorhandenen Fanartikel loeschen, aber ohne Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .expect(401)
               .end(done);
       });

    it('Vorhandenen Fanartikel loeschen, aber mit falschem Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .set('Authorization', 'Bearer x')
               .expect(401)
               .end(done);
       });
});
