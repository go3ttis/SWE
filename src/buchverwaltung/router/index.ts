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

// Einlesen von application/json im Request-Rumpf
// Fuer multimediale Daten (Videos, Bilder, Audios): raw-body
import {json} from 'body-parser';
import {Router} from 'express';

import {isAdmin, isAdminMitarbeiter, validateJwt} from '../../iam/router/iam.request-handler';
import {internalError, notFound, validateMongoId} from '../../shared/index';
import {deleteFn, getById, getByQuery, post, put} from './buecher.request-handler';

// http://expressjs.com/en/api.html
// Ein Router ist eine "Mini-Anwendung" mit Express

// Beispiele fuer "Middleware" bei Express:
// * Logging, z.B. von Requests
// * Authentifizierung
// * Rumpf bei POST- und PUT-Requests einlesen
// * Aufruf der naechsten Middleware-Funktion
// d.h. eine Variation der Patterns
// * Filter (Interceptoren)
// * Chain of Responsibility und

// Express 5:
//  * Promises statt Callbacks
//  * Verbesserte Handhabung von Query Strings
//  * Zusaetzliche Syntax beim Routing

// Spring 5: "Functional Web Interface" analog zu Express

const buecherRouter: Router = Router();
buecherRouter.route('/')
    .get(getByQuery)
    .post(validateJwt, isAdminMitarbeiter, json(), post)
    .put(validateJwt, isAdminMitarbeiter, json(), put);

const idParam: string = 'id';
buecherRouter.param(idParam, validateMongoId)
    .get(`/:${idParam}`, getById)
    .delete(`/:${idParam}`, validateJwt, isAdmin, deleteFn);

buecherRouter.get('*', notFound);
buecherRouter.use(internalError);

export default buecherRouter;
