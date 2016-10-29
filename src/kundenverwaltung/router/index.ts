import {json} from 'body-parser';
import {Router} from 'express';

import {isAdmin, isAdminMitarbeiter, validateJwt} from '../../iam/router/iam.request-handler';
import {internalError, notFound, validateMongoId} from '../../shared/index';
import {deleteFn, getById, getByQuery, post, put} from './kunden.request-handler';

const kundenRouter: Router = Router();
kundenRouter.route('/')
    .get(getByQuery)
    .post(validateJwt, isAdminMitarbeiter, json(), post)
    .put(validateJwt, isAdminMitarbeiter, json(), put);

const idParam: string = 'id';
kundenRouter.param(idParam, validateMongoId)
    .get(`/:${idParam}`, getById)
    .delete(`/:${idParam}`, validateJwt, isAdmin, deleteFn);

kundenRouter.get('*', notFound);
kundenRouter.use(internalError);

export default kundenRouter;
