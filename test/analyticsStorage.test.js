/**
 * @author David Menger
 */
'use strict';

// const assert = require('assert');
const { Router, Tester, onInteractionHandler } = require('wingbot');
const AnalyticsStorage = require('../src/AnalyticsStorage');
const config = require('../config');

describe('EventsStorage', () => {

    let pageId;
    let senderId;
    const analyticsStorage = new AnalyticsStorage(
        config.tableStorage.storageAccount,
        config.tableStorage.storageAccessKey
    );

    beforeEach(() => {
        pageId = `${Math.floor(Date.now() * Math.random())}`;
        senderId = `${Math.floor(Date.now() * Math.random())}`;
    });

    it('should insert the event', async () => {
        await analyticsStorage.storeEvent({
            type: 'h',
            pageId,
            senderId,
            conversationId: 'x',
            sessionId: 'y',
            category: 'Cat',
            label: 'La',
            value: Date.now()
        });
    });

    it('should insert the interaction', async () => {
        await analyticsStorage.storeInteractionView({
            pageId,
            senderId,
            allActions: '',
            conversationId: 'x',
            sessionId: 'y',
            action: 'sasa',
            lastAction: 'lele',
            sessionCount: 0,
            sessionDuration: 0
        });
    });

    it('should obtain user', async function () {
        this.timeout(5000);

        const bot = new Router();

        bot.use('start', (req, res) => {
            res.text('hello');
        });

        bot.use((req, res) => {
            res.text('fallback');
        });

        const t = new Tester(bot);

        t.processor.on('interaction', onInteractionHandler({ throwException: true }, analyticsStorage).onInteraction);

        await t.postBack('start');

        await t.text('hello');
    });

});
