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
    logger.info(`Der Server ist gestartet: http://${host}:${port}`);
});

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const idGetVorhanden: string = '000000000000000000000001';
const idNichtVorhanden: string = '000000000000000000000999';

const neuesBuch: any = {
    titel: 'Neu',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 99.9,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28T00:00:00.000Z',
    email: 'theo@test.de',
    autoren: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: ['JAVASCRIPT', 'TYPESCRIPT']
};
const neuesBuchInvalid: any = {
    titel: 'Blabla',
    rating: -1,
    art: 'UNSICHTBAR',
    verlag: 'NO_VERLAG',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '2016-02-01T00:00:00.000Z',
    email: 'fromNowhere',
    autoren: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: []
};
const neuesBuchTitelExistiert: any = {
    titel: 'Alpha',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 99.9,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28T00:00:00.000Z',
    email: 'theo@test.de',
    autoren: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: ['JAVASCRIPT', 'TYPESCRIPT']
};

const geaendertesBuch: any = {
    _id: '000000000000000000000003',
    titel: 'Geaendert',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 33.3,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03T00:00:00.000Z',
    __v: 0,
    autoren: [{nachname: 'Gamma', vorname: 'Claus'}],
    schlagwoerte: ['JAVASCRIPT', 'TYPESCRIPT']
};
const geaendertesBuchIdNichtVorhanden: any = {
    _id: '000000000000000000000999',
    titel: 'Nichtvorhanden',
    rating: 1,
    art: 'DRUCKAUSGABE',
    verlag: 'HSKA_VERLAG',
    preis: 33.3,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03T00:00:00.000Z',
    __v: 0,
    autoren: [{nachname: 'Gamma', vorname: 'Claus'}],
    schlagwoerte: ['JAVASCRIPT', 'TYPESCRIPT']
};
const geaendertesBuchInvalid: any = {
    _id: '000000000000000000000003',
    titel: 'Alpha',
    rating: -1,
    art: 'UNSICHTBAR',
    verlag: 'NO_VERLAG',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '2016-02-01T00:00:00.000Z',
    email: 'fromNowhere',
    __v: 0,
    autoren: [{nachname: 'Test', vorname: 'Theo'}],
    schlagwoerte: []
};

const idDeleteVorhanden: string = '000000000000000000000005';

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
describe('buchverwaltung', function(): void {
    const path: string = PATHS.buecher;
    const loginPath: string = PATHS.login;

    // before(): 1-malige Ausfuehrung vor allen Tests
    // beforeEach(): Ausfuehrung vor jedem einzelnen Test
    // analog: after() und afterEach()

    // Einmaliges Einloggen, um den Authentifizierungs-Token zu erhalten
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

    it('Alle Buecher', (done: MochaDone): void => {
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

    it('Buch zu gegebener ID', (done: MochaDone): void => {
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

    it('Kein Buch zu gegebener ID', (done: MochaDone): void => {
        supertest(server)
            .get(`${path}/${idNichtVorhanden}`)
            .expect(404)
            .end(done);
    });

    it('Buecher mit einem Titel, der ein "a" enthaelt',
       (done: MochaDone): void => {
           supertest(server)
               .get(`${path}?titel=a`)
               .expect(200)
               .expect('Content-Type', /json/)
               .end((err: any, response: any) => {
                   const body: any = response.body;

                   // response.body ist ein JSON-Array mit mind. 1 JSON-Objekt
                   body.should.be.not.empty;

                   // Jedes Buch hat einen Titel mit dem Teilstring 'a'
                   body.map((buch: any) => buch.titel)
                       .forEach((titel: string) => titel.should.contain('a'));

                   done();
               });
       });

    it('Keine Buecher mit einem Titel, der "XX" enthaelt',
       (done: MochaDone): void => {
           supertest(server).get(`${path}?titel=XX`).expect(404).end(done);
       });

    it('Mind. 1 Buch mit dem Schlagwort "javascript"',
       (done: MochaDone): void => {
           const schlagwort: string = 'javascript';

           supertest(server)
               .get(`${path}?${schlagwort}=true`)
               .expect(200)
               .expect('Content-Type', /json/)
               .end((err: any, response: any) => {
                   const body: any = response.body;

                   // response.body ist ein JSON-Array mit mind. 1 JSON-Objekt
                   body.should.be.not.empty;

                   // Jedes Buch hat im Array der Schlagwoerter "javascript"
                   body.map((buch: any) => buch.schlagwoerter)
                       .forEach(
                           (s: Array<string>) =>
                               s.should.contain(`${schlagwort.toUpperCase()}`));

                   done();
               });
       });

    it('Keine Buecher mit dem Schlagwort "csharp"', (done: MochaDone): void => {
        supertest(server).get(`${path}?csharp=true`).expect(404).end(done);
    });

    it('Neues Buch', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(neuesBuch)
            .expect(201)
            .end((err: any, response: any) => {
                const location: string = response.header.location;
                location.should.be.not.empty;

                // Mongo-ID hat 24 Ziffern
                const indexLastSlash: number = location.lastIndexOf('/');
                const idStr: string = location.substring(indexLastSlash + 1);
                idStr.should.match(/[0-9a-f]{24}/);
                done();
            });
    });

    it('Neues Buch mit ungueltigen Daten', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(neuesBuchInvalid)
            .expect(400)
            .end((err: any, response: any) => {
                const body: any = response.body;
                body.art.should.not.be.empty;
                body.rating.should.not.be.empty;
                body.verlag.should.not.be.empty;
                body.email.should.not.be.empty;
                done();
            });
    });

    it('Neues Buch, aber der Titel existiert bereits',
       (done: MochaDone): void => {
           supertest(server)
               .post(`${path}`)
               .set('Authorization', `Bearer ${token}`)
               .send(neuesBuchTitelExistiert)
               .expect(400)
               .end(done);
       });

    it('Neues Buch, aber ohne Token', (done: MochaDone): void => {
        supertest(server).post(`${path}`).send(neuesBuch).expect(401).end(done);
    });

    it('Neues Buch, aber mit falschem Token', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', 'Bearer x')
            .send(neuesBuch)
            .expect(401)
            .end(done);
    });

    it('Vorhandenes Buch aendern', (done: MochaDone): void => {
        supertest(server)
            .put(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(geaendertesBuch)
            .expect(204)
            .end(done);
    });

    it('Nicht-vorhandenes Buch aendern', (done: MochaDone): void => {
        supertest(server)
            .put(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(geaendertesBuchIdNichtVorhanden)
            .expect(400)
            .end((err: any, response: any) => {
                response.body.message.should.contain(
                    'Es gibt kein Buch mit der ID');
                done();
            });
    });

    it('Vorhandenes Buch aendern, aber mit ungueltigen Daten',
       (done: MochaDone): void => {
           supertest(server)
               .put(`${path}`)
               .set('Authorization', `Bearer ${token}`)
               .send(geaendertesBuchInvalid)
               .expect(400)
               .end((err: any, response: any) => {
                   const body: any = response.body;
                   body.art.should.not.be.empty;
                   body.rating.should.not.be.empty;
                   body.verlag.should.not.be.empty;
                   body.email.should.not.be.empty;
                   done();
               });
       });

    it('Vorhandenes Buch aendern, aber ohne Token', (done: MochaDone): void => {
        supertest(server)
            .put(`${path}`)
            .send(geaendertesBuch)
            .expect(401)
            .end(done);
    });

    it('Vorhandenes Buch aendern, aber mit falschem Token',
       (done: MochaDone): void => {
           supertest(server)
               .put(`${path}`)
               .set('Authorization', 'Bearer x')
               .send(geaendertesBuch)
               .expect(401)
               .end(done);
       });

    it('Vorhandenes Buch loeschen', (done: MochaDone): void => {
        supertest(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
            .end(done);
    });

    it('Vorhandenes Buch loeschen, aber ohne Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .expect(401)
               .end(done);
       });

    it('Vorhandenes Buch loeschen, aber mit falschem Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .set('Authorization', 'Bearer x')
               .expect(401)
               .end(done);
       });
});
