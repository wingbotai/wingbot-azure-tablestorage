'use strict';

const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

let client;

function getAuthorizedClient () {
    if (client) {
        return client;
    }

    const credential = new DefaultAzureCredential();

    client = new SecretClient(process.env.KEYVAULT_DOMAIN, credential);

    return client;
}

async function resolveValue (value) {
    try {
        const res = await Promise.resolve(value);
        return res;
    } catch (e) {
        return null;
    }
}

async function getKeyvaultSecret (key, defaultValue = null, filter = (s) => s) {
    if (!process.env.KEYVAULT_DOMAIN) {
        return filter(await resolveValue(defaultValue));
    }
    try {
        const kvClient = getAuthorizedClient();
        const secret = await kvClient.getSecret(key);

        return filter(secret.value) || filter(await resolveValue(defaultValue));
    } catch (e) {
        return filter(await resolveValue(defaultValue));
    }
}

module.exports = getKeyvaultSecret;
