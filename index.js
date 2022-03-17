/**
 * @author Vojtech Jedlicka
 */
'use strict';

const createOnInteractionHandler = require('./src/createOnInteractionHandler');
const AnalyticsStorage = require('./src/AnalyticsStorage');
const BaseTableStorage = require('./src/BaseTableStorage');

module.exports = {
    BaseTableStorage,
    AnalyticsStorage,
    createOnInteractionHandler
};
