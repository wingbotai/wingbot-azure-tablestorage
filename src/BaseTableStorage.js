/**
 * @author David Menger
 */
'use strict';

const { TableClient, AzureNamedKeyCredential } = require('@azure/data-tables');

const LEN = 4;
const MAX = (36 ** (LEN + 1)) - 1;

const MAX_TS = 9999999999999;

const UPPERCASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class BaseTableStorage {

    /**
      *
      * @param {string} accountName
      * @param {string|Promise<string>} accountKey
      */
    constructor (accountName, accountKey) {
        this._accountName = accountName;
        this._accountKey = accountKey;
        this._url = `https://${accountName}.table.core.windows.net`;

        this._tcs = new Map();

        // random seed
        this._s = Math.floor(Math.random() * MAX);
        this._i = Math.floor(Math.random() * MAX)
            .toString(36)
            .padStart(LEN, '0');

        this._sessionSequence = Math.floor(Math.random() * UPPERCASE_CHARS.length);
        this._sessionInstance = UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)];
    }

    _id () {
        const ts = (MAX_TS - Date.now()).toString(36).padStart(9, '0');
        if (this._s < MAX) {
            this._s++;
        } else {
            this._s = 0;
        }
        const seq = this._s.toString(36).padStart(LEN, '0');
        return `${ts}${this._i}${seq}`;
    }

    /**
      * Returns ID with 000.. at the end
      *
      * @param {Date} date
      * @returns {string}
      */
    _lowerId (date) {
        const ts = (MAX_TS - date.getTime()).toString(36).padStart(9, '0');
        return `${ts}${''.padStart(LEN * 2, '0')}`;
    }

    /**
      * Returns ID with zzz.. at the end
      *
      * @param {Date} date
      * @returns {string}
      */
    _upperId (date) {
        const ts = (MAX_TS - date.getTime()).toString(36).padStart(9, '0');
        return `${ts}${''.padStart(LEN * 2, 'z')}`;
    }

    _inverseTimestamp (ts) {
        this._sessionSequence = (this._sessionSequence + 1) % UPPERCASE_CHARS.length;

        const sidChar = UPPERCASE_CHARS[this._sessionSequence];

        const firstRandChar = UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)];
        const secondRandChar = UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)];

        return `${(MAX_TS - ts).toString(36)}${sidChar}${this._sessionInstance}${firstRandChar}${secondRandChar}`;
    }

    _dateFromInversedTimestamp (inverseTimestamp) {
        const clean = inverseTimestamp.replace(/[A-Z]+$/, '');
        const num = parseInt(clean, 36);
        return new Date(MAX_TS - num);
    }

    async _createTableAndGetClient (tableName) {
        const key = await Promise.resolve(this._accountKey);
        const credentials = new AzureNamedKeyCredential(this._accountName, key);
        const tc = new TableClient(this._url, tableName, credentials);
        try {
            await tc.createTable();
        } catch (e) {
            if (e.statusCode !== 409) {
                throw e;
            }
        }
        return tc;
    }

    /**
      *
      * @returns {Promise<TableClient>}
      */
    _getTableClient (tableName) {
        let tc = this._tcs.get(tableName);
        if (!tc) {
            tc = this._createTableAndGetClient(tableName);
            this._tcs.set(tableName, tc);
        }
        return tc;
    }

    _setTypes (types) {
        return Object.keys(types)
            .reduce((o, k) => Object.assign(o, {
                [`${k}@odata.type`]: k[types]
            }), {});
    }

}

module.exports = BaseTableStorage;
