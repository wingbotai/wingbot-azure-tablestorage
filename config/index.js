/*
 * @author wingbot.ai
 */
'use strict';

const getKeyvaultSecret = require('./getKeyvaultSecret');
const secretKey = require('./secretKey.json').key;

const config = {
    environment: process.env.NODE_ENV || 'development',
    isProduction: false,
    verboseLog: process.env.VERBOSE_LOG_PATTERN || null,

    tableStorage: {
        storageAccount: process.env.AZURE_STORAGE_ACCOUNT || 'donotdropusedintest',
        storageAccessKey: getKeyvaultSecret('storageaccesskey', process.env.AZURE_STORAGE_ACCESS_KEY || secretKey)
    }
};

module.exports = config;
