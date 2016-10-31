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

const neuerFilm: any = {
    titel: 'Neu',
    rating: 1,
    genre: 'Drama',
    laenge: 118,
    sprache: 'Deutsch',
    medium: 'DVD',
    preis: 0.99,
    ausgeliehen: false
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
describe('filmverwaltung', function(): void {
    const path: string = PATHS.filme;
    const loginPath: string = PATHS.login;

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

    it('Alle Filme', (done: MochaDone): void => {
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

    it('Film zu gegebener ID', (done: MochaDone): void => {
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

    it('Kein Film zu gegebener ID', (done: MochaDone): void => {
        supertest(server)
            .get(`${path}/${idNichtVorhanden}`)
            .expect(404)
            .end(done);
    });

    it('Neuer Film', (done: MochaDone): void => {
        supertest(server)
            .post(`${path}`)
            .set('Authorization', `Bearer ${token}`)
            .send(neuerFilm)
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

    it('Vorhandener Film loeschen', (done: MochaDone): void => {
        supertest(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
            .end(done);
    });

    it('Vorhandener Film loeschen, aber ohne Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .expect(401)
               .end(done);
       });

    it('Vorhandener Film loeschen, aber mit falschem Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .set('Authorization', 'Bearer x')
               .expect(401)
               .end(done);
       });
});
