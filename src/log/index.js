/**
 * @author wingbot.ai
 */
'use strict';
const moduleLoggerFactory = require('./moduleLoggerFactory');
const config = require('../../config');

/** @typedef {import('./moduleLoggerFactory').ModuleLoggerWithClose} ModuleLoggerWithClose */

/** @type {ModuleLoggerWithClose} */
let logger;

if (config.appInsights) {
    // @ts-ignore
    const appInsights = module.require('applicationinsights');

    appInsights.setup(config.appInsights).start();

    logger = moduleLoggerFactory(config.verboseLog, ({
        level, message, exception, data
    }) => {
        if (exception) {
            appInsights.defaultClient.trackException({
                exception
            });
        }

        appInsights.defaultClient.trackEvent({
            name: `${level}: ${message}`,
            properties: {
                level,
                message,
                error: exception ? exception.message : null,
                stack: exception ? exception.stack : null,
                ...Object.keys(data)
                    .reduce((o, k) => {
                        let value = data[k];
                        const isObject = value && typeof value === 'object';
                        try {
                            if (isObject) {
                                value = JSON.stringify(data[k], null, 2);
                            }
                        } catch (e) {
                            value = `{${isObject ? Object.keys(value) : typeof value}`;
                        }
                        return Object.assign(o, {
                            [k]: value
                        });
                    }, {})
            }
        });
    });
} else {
    logger = moduleLoggerFactory(config.verboseLog);
}

// overide logger here
module.exports = logger;
