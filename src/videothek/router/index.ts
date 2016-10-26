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

import {json} from 'body-parser';
import {Router} from 'express';

import {isAdmin, isAdminMitarbeiter, validateJwt} from '../../iam/router/iam.request-handler';
import {internalError, notFound, validateMongoId} from '../../shared/index';
import {deleteFn, getById, getByQuery, post, put} from './filme.request-handler';

const filmeRouter: Router = Router();
filmeRouter.route('/')
    .get(getByQuery)
    .post(validateJwt, isAdminMitarbeiter, json(), post)
    .put(validateJwt, isAdminMitarbeiter, json(), put);

const idParam: string = 'id';
filmeRouter.param(idParam, validateMongoId)
    .get(`/:${idParam}`, getById)
    .delete(`/:${idParam}`, validateJwt, isAdmin, deleteFn);

filmeRouter.get('*', notFound);
filmeRouter.use(internalError);

export default filmeRouter;
