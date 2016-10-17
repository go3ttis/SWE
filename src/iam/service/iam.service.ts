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

// Alternativen zu bcrypt:
//  scrypt: https://www.tarsnap.com/scrypt.html
//  Argon2: https://github.com/p-h-c/phc-winner-argon2
//  SHA-Algorithmen und PBKDF2 sind anfaelliger bei Angriffen mittels GPUs
import {compare, hash} from 'bcrypt';
import {promisify} from 'bluebird';
import {Request} from 'express';
import {readFileSync} from 'fs';
import {decode, IHeader, IPayload, ISignOptions, IToken, sign, verify} from 'jws';
import * as uuid from 'node-uuid';
import {join} from 'path';

// Statt JWT (nahezu) komplett zu implementieren, koennte man z.B. Passport
// verwenden
import {isBlank, isEmpty, JWT_CONFIG, log, logger, SALT_ROUNDS} from '../../shared/index';
import {RolesService, UsersService} from './index';

export interface LoginResult {
    token: string;
    token_type: 'Bearer';
    expires_in: number;
    roles?: Array<string>;
}

export class IamService {
    private static RSA_PRIVATE_KEY: Buffer =
        readFileSync(join(__dirname, 'jwt', 'rsa.pem'));
    private static RSA_PUBLIC_KEY: Buffer =
        readFileSync(join(__dirname, 'jwt', 'rsa.public.pem'));
    private static ECDSA_PRIVATE_KEY: Buffer =
        readFileSync(join(__dirname, 'jwt', 'ecdsa.pem'));
    private static ECDSA_PUBLIC_KEY: Buffer =
        readFileSync(join(__dirname, 'jwt', 'ecdsa.public.pem'));

    private readonly rolesService: RolesService = new RolesService();
    private readonly usersService: UsersService = new UsersService();

    // mit Ideen von der Function sign() im Package express-jwt
    @log
    async login(req: Request): Promise<LoginResult|undefined> {
        logger.debug(`body: ${JSON.stringify(req.body)}`);
        const username: string = req.body.username;
        logger.debug(`username: ${username}`);
        if (isEmpty(username)) {
            return undefined;
        }
        const user: any = this.usersService.findByUsername(username);
        logger.debug(`user: ${JSON.stringify(user)}`);

        const password: string = req.body.password;
        logger.debug(`password: ${password}`);
        const passwordCheck: boolean = await this.checkPassword(user, password);
        if (!passwordCheck) {
            return undefined;
        }

        const header: IHeader = {typ: JWT_CONFIG.typ, alg: JWT_CONFIG.alg};
        // akt. Datum in Sek. seit 1.1.1970 UTC
        const nowSeconds: number = Math.floor(Date.now() / 1000);
        const payload: IPayload = {
            // issued at (in Sek. seit 1.1.1970 UTC)
            iat: nowSeconds,
            // issuer
            iss: JWT_CONFIG.issuer,
            // subject (ID aus LDAP oder Active Directory, NICHT username o.ae.)
            sub: user._id,
            // JWT ID (hier: als generierte UUID)
            jti: uuid.v4(),
            // expiration time
            exp: nowSeconds + JWT_CONFIG.expiration
            // nbf = not before
        };
        logger.debug(`payload: ${JSON.stringify(payload)}`);

        let secretOrPrivateKey: string|Buffer|undefined = undefined;
        if (this.isHMAC(JWT_CONFIG.alg)) {
            secretOrPrivateKey = JWT_CONFIG.secret;
        } else if (this.isRSA(JWT_CONFIG.alg)) {
            secretOrPrivateKey = IamService.RSA_PRIVATE_KEY;
        } else if (this.isECDSA(JWT_CONFIG.alg)) {
            secretOrPrivateKey = IamService.ECDSA_PRIVATE_KEY;
        }
        const signOptions: ISignOptions = {
            header: header,
            payload: payload,
            secret: secretOrPrivateKey as string | Buffer,
            encoding: JWT_CONFIG.encoding
        };
        const token: string = sign(signOptions);

        return {
            token: token,
            token_type: JWT_CONFIG.bearer,
            expires_in: JWT_CONFIG.expiration,
            roles: user.roles
        };
    }

    // Mit Ideen von der Function verify() im Package express-jwt
    // Exceptions bzw. Errors gemaess OAuth 2
    //  https://tools.ietf.org/html/rfc6749#section-5.2
    //  https://tools.ietf.org/html/rfc6750#section-3.1
    @log
    validateJwt(req: Request): void {
        // Die "Field Names" beim Request Header unterscheiden nicht zwischen
        // Gross- und Kleinschreibung (case-insensitive)
        // https://tools.ietf.org/html/rfc7230
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
        const auth: string = req.header('Authorization');
        if (isEmpty(auth)) {
            logger.debug('Kein Header-Field Authorization');
            throw new AuthorizationInvalidError(
                'Kein Header-Field Authorization');
        }
        logger.debug(`Authorization = ${auth}`);

        // Destructuring in ES 2015
        const [scheme, tokenString]: Array<string> = auth.split(' ');
        if (isEmpty(tokenString)) {
            logger.debug(
                'Fehler beim Header-Field Authorization: '
                + JSON.stringify(auth));
            throw new AuthorizationInvalidError(
                'Fehler beim Header-Field Authorization: '
                + JSON.stringify(auth));
        }

        const bearerRegExp: RegExp = new RegExp(`^${JWT_CONFIG.bearer}$`, 'i');
        if (!scheme.match(bearerRegExp)) {
            logger.debug(
                'Das Schema beim Header-Field Authorization muss ' +
                `${JWT_CONFIG.bearer} sein`);
            throw new TokenInvalidError(
                'Das Schema beim Header-Field Authorization muss ' +
                `${JWT_CONFIG.bearer} sein`);
        }

        const [, payloadBase64, signatureBase64]: Array<string> =
            tokenString.split('.');
        if (isEmpty(signatureBase64)) {
            logger.debug('Der Token besteht nicht aus 3 Teilen.');
            throw new TokenInvalidError(
                'Der Token besteht nicht aus 3 Teilen.');
        }
        if (payloadBase64.trim() === '') {
            logger.debug('Die Payload des Tokens ist leer.');
            throw new TokenInvalidError('Die Payload des Tokens ist leer.');
        }

        let tokenDecoded: IToken;
        try {
            tokenDecoded = decode(tokenString);
        } catch (err) {
            logger.debug('Der JWT-Token kann nicht decodiert werden');
            throw new TokenInvalidError(
                'Der JWT-Token kann nicht decodiert werden');
        }
        if (isBlank(tokenDecoded)) {
            logger.debug(
                'Decodieren des Token-Strings liefert kein Token-Objekt');
            throw new TokenInvalidError(
                'Decodieren des Token-Strings liefert kein Token-Objekt');
        }

        // Destructuring in ES 2015
        const {header, payload}: IToken = tokenDecoded;
        if (header.alg !== JWT_CONFIG.alg) {
            logger.debug(`Falscher ALgorithmus im Header: ${header.alg}`);
            throw new TokenInvalidError(
                `Falscher ALgorithmus im Header: ${header.alg}`);
        }

        let secretOrPublicKey: string|Buffer|undefined = undefined;
        if (this.isHMAC(JWT_CONFIG.alg)) {
            secretOrPublicKey = JWT_CONFIG.secret;
        } else if (this.isRSA(JWT_CONFIG.alg)) {
            secretOrPublicKey = IamService.RSA_PUBLIC_KEY;
        } else if (this.isECDSA(JWT_CONFIG.alg)) {
            secretOrPublicKey = IamService.ECDSA_PUBLIC_KEY;
        }

        let valid: boolean = true;
        try {
            valid = verify(
                tokenString, header.alg, secretOrPublicKey as string | Buffer);
        } catch (e) {
            logger.debug(
                `Der Token-String ist mit ${header.alg} nicht verifizierbar`);
            throw new TokenInvalidError(
                `Der Token-String ist mit ${header.alg} nicht verifizierbar`);
        }
        if (!valid) {
            throw new TokenInvalidError(`Ungueltiger Token: ${tokenString}`);
        }

        const {exp, iss, sub}: IPayload = payload;
        if (isBlank(exp) || typeof exp !== 'number'
            || Math.floor(Date.now() / 1000) >= payload.exp) {
            logger.debug('Der Token ist abgelaufen');
            throw new TokenExpiredError(`Abgelaufener Token: ${exp}`);
        }

        if (iss !== JWT_CONFIG.issuer) {
            logger.debug(`Falscher issuer: ${iss}`);
            throw new TokenInvalidError(`Falscher issuer: ${iss}`);
        }

        const user: any = this.usersService.findById(sub);
        if (user === undefined) {
            logger.debug(`Falsche User-Id: ${sub}`);
            throw new TokenInvalidError(`Falsche User-Id: ${sub}`);
        }

        // Request-Objekt um id erweitern
        logger.debug(`id: ${sub}`);
        const tmp: any = req;
        tmp.id = sub;
    }

    // bereits erledigt durch Validierung des Tokens
    // Basic Authentifizierung: ueberladen bzw. neu implementieren
    @log
    isLoggedIn(req: Request): boolean {
        return true;
    }

    @log
    hasAnyRole(req: Request, roles: Array<string>): boolean {
        const tmp: any = req;
        const user: any = this.usersService.findById(tmp.id);
        roles = this.rolesService.getNormalizedRoles(roles) as Array<string>;
        return this.userHasAnyRole(user, roles);
    }

    @log
    userHasAnyRole(user: any, roles: Array<string>): boolean {
        if (isBlank(user) || isBlank(roles) || roles.length === 0) {
            return false;
        }

        const userRoles: Array<string> = user.roles;
        let found: boolean = false;
        roles.forEach(role => {
            if (userRoles.find(userRole => userRole === role) !== undefined) {
                logger.debug(`Vorhandene Rolle: ${role}`);
                found = true;
            }
        });

        return found;
    }

    @log
    async checkPassword(user: any, password: string): Promise<boolean> {
        if (isBlank(user)) {
            logger.debug('Kein User-Objekt');
            Promise.resolve(false);
        }

        // Beispiel:
        //  $2a$12$50nIBzoTSmFEDGI8nM2iYOO66WNdLKq6Zzhrswo6p1MBmkER5O/CO
        //  $ als Separator
        //  2a: Version von bcrypt
        //  12: 2**12 Iterationen mit dem
        //  die ersten 22 Zeichen kodieren einen 16-Byte Wert fuer den Salt
        //  danach das chiffrierte Passwort
        const comparePromisified: (data: any, encrypted: string) =>
            Promise<boolean> = promisify(compare) as any;
        const result: boolean =
            await comparePromisified(password, user.password);
        logger.debug(`result: ${result}`);
        return result;
    }

    @log
    register(req: Request): void {
        logger.debug(`body: ${JSON.stringify(req.body)}`);
        const username: string = req.body.username;
        logger.debug(`username: ${username}`);
        const password: string = req.body.password;
        logger.debug(`password: ${password}`);

        hash(password, SALT_ROUNDS, (err: Error, encrypted: string) => {
            // encrypted enthaelt den Hashwert *und* Salt
            logger.debug(`encrypted: ${encrypted}`);
        });
    }

    toString(): string {
        return 'IamService';
    }

    // HMAC = Keyed-Hash MAC (= Message Authentication Code)
    private isHMAC(alg: string): boolean {
        return alg.startsWith('HS');
    }

    // RSA = Ron Rivest, Adi Shamir, Leonard Adleman
    private isRSA(alg: string): boolean {
        return alg.startsWith('RS');
    }

    // ECDSA = elliptic curve digital signature algorithm
    private isECDSA(alg: string): boolean {
        return alg.startsWith('ES');
    }
}


// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript#answer-5251506
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Error

export class AuthorizationInvalidError implements Error {
    name: string = 'AuthorizationInvalidError';

    constructor(public message: string) {
        logger.debug('AuthorizationInvalidError.constructor()');
    }
}

export class TokenInvalidError implements Error {
    name: string = 'TokenInvalidError';

    constructor(public message: string) {
        logger.debug('TokenInvalidError.constructor()');
    }
}

export class TokenExpiredError implements Error {
    name: string = 'TokenExpiredError';

    constructor(public message: string) {
        logger.debug('TokenExpiredError.constructor()');
    }
}
