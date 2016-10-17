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

import {createTransport, SendMailOptions, Transporter} from 'nodemailer';

import {MAIL_CONFIG} from './config/index';
import {logger} from './logger';

const transporter: Transporter = createTransport(MAIL_CONFIG.transport);

// tslint:disable:one-line
export async function sendMail(
    to: string|string[], subject: string, body: string): Promise<void> {
    'use strict';

    const data: SendMailOptions =
        {from: MAIL_CONFIG.from, to: to, subject: subject, html: body};
    logger.debug(`sendMail(): ${JSON.stringify(data)}`);

    transporter.sendMail(data, (err, info) => {
        if (err) {
            logger.warn(JSON.stringify(err));
            return;
        }

        logger.debug(`Email verschickt: ${info.response}`);
    });
}
// tslint:enable:one-line
