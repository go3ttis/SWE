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

// ToDo neuer Kunde

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
describe('kundenverwaltung', function(): void {
    const path: string = PATHS.kunden;
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

    it('Alle Kunden', (done: MochaDone): void => {
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

    it('Kunde zu gegebener ID', (done: MochaDone): void => {
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

    it('Kein Kunde zu gegebener ID', (done: MochaDone): void => {
        supertest(server)
            .get(`${path}/${idNichtVorhanden}`)
            .expect(404)
            .end(done);
    });

    // ToDo neuer Kunde

    it('Vorhandener Kunde loeschen', (done: MochaDone): void => {
        supertest(server)
            .delete(`${path}/${idDeleteVorhanden}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(204)
            .end(done);
    });

    it('Vorhandener Kunde loeschen, aber ohne Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .expect(401)
               .end(done);
       });

    it('Vorhandener Kunde loeschen, aber mit falschem Token',
       (done: MochaDone): void => {
           supertest(server)
               .delete(`${path}/${idDeleteVorhanden}`)
               .set('Authorization', 'Bearer x')
               .expect(401)
               .end(done);
       });
});
