/**
 * @author David Menger
 */
'use strict';

const assert = require('assert');
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
            lastAction: 'lele'
        });
    });

    it('should obtain user', async function () {
        this.timeout(5000);
        let optimizeSpeed = Date.now();
        const firstVisit = await analyticsStorage.getOrCreateUserSession(pageId, senderId);
        optimizeSpeed = (Date.now() - optimizeSpeed) * 7;
        analyticsStorage.setOptions({ sessionDuration: optimizeSpeed });
        this.timeout(10 * optimizeSpeed);
        let get = await analyticsStorage.getOrCreateUserSession(pageId, senderId);

        assert.strictEqual(firstVisit.sessionId, get.sessionId);

        await new Promise((r) => setTimeout(r, optimizeSpeed));
        get = await analyticsStorage
            .getOrCreateUserSession(pageId, senderId, {}, undefined, true);
        assert.strictEqual(firstVisit.sessionId, get.sessionId);

        const secondVisit = await analyticsStorage.getOrCreateUserSession(pageId, senderId);
        await new Promise((r) => setTimeout(r, optimizeSpeed / 2));
        await analyticsStorage.getOrCreateUserSession(pageId, senderId);
        await new Promise((r) => setTimeout(r, optimizeSpeed / 2));
        get = await analyticsStorage.getOrCreateUserSession(pageId, senderId);
        assert.strictEqual(secondVisit.sessionId, get.sessionId);
        assert.notStrictEqual(secondVisit.sessionId, firstVisit.sessionId);
    });

});
