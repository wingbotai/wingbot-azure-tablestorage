/**
 * @author Vojtech Jedlicka
 */
'use strict';

const onAction = require('./src/onAction');
const AnalyticsStorage = require('./src/analyticsStorage');

module.exports.createOnInteractionHandler = onAction;
module.exports.AnalyticsStorage = AnalyticsStorage;
