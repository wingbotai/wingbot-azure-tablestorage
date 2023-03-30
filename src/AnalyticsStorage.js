/**
 * @author David Menger
 */
'use strict';

const { TrackingCategory, TrackingType } = require('wingbot');
const BaseTableStorage = require('./BaseTableStorage');

/* eslint max-len: 0 */

/** @typedef {import('wingbot/src/analytics/onInteractionHandler').IAnalyticsStorage} IAnalyticsStorage */
/** @typedef {import('wingbot/src/analytics/onInteractionHandler').IGALogger} IGALogger */
/** @typedef {import('wingbot/src/analytics/onInteractionHandler').SessionMetadata} SessionMetadata */
/** @typedef {import('wingbot/src/analytics/onInteractionHandler').GAUser} GAUser */
/** @typedef {import('wingbot/src/analytics/onInteractionHandler').Event} Event */

/**
 * @typedef {object} AnalyticsEvent
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string} conversationId
 * @prop {string} sessionId
 * @prop {string} [category]
 * @prop {string} type
 * @prop {string} [label]
 * @prop {number} [value]
 * @prop {string} [action]
 * @prop {string} [cd1]
 * @prop {string} [cd2]
 * @prop {string} [cd3]
 * @prop {string} [cd4]
 * @prop {string} [cd5]
 * @prop {string} [cd6]
 * @prop {string} [cd7]
 * @prop {string} [cd8]
 * @prop {string} [lastAction]
 * @prop {boolean} [nonInteractive]
 * @prop {string} [skill]
 */

/**
 * @typedef {object} InteractionView
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string} conversationId
 * @prop {string} sessionId
 * @prop {string} action
 * @prop {string} [allActions]
 * @prop {string} [requestAction]
 * @prop {boolean} [isPassThread]
 * @prop {boolean} [isQuickReply]
 * @prop {boolean} [isPostback]
 * @prop {boolean} [isAttachment]
 * @prop {boolean} [isContextUpdate]
 * @prop {boolean} [isNotification]
 * @prop {boolean} [isText]
 * @prop {boolean} [isGoto]
 * @prop {string} [expected]
 * @prop {boolean} [expectedTaken]
 * @prop {string} [intent]
 * @prop {string} [entities]
 * @prop {string} [intentScore]
 * @prop {string} [entities]
 * @prop {string} [lastAction]
 * @prop {string} [prevAction]
 * @prop {string} [winnerIntent]
 * @prop {boolean} [winnerTaken]
 * @prop {string} [winnerAction]
 * @prop {string} [winnerEntities]
 * @prop {number} [winnerScore]
 * @prop {string} [cd1]
 * @prop {string} [cd2]
 * @prop {string} [cd3]
 * @prop {string} [cd4]
 * @prop {string} [cd5]
 * @prop {string} [cd6]
 * @prop {string} [cd7]
 * @prop {string} [cd8]
 * @prop {string} [text]
 * @prop {boolean} [nonInteractive]
 * @prop {string} [skill]
 * @prop {string} [prevSkill]
 * @prop {string} [pathname]
 * @prop {boolean} [didHandover]
 * @prop {boolean} [withUser]
 * @prop {number} [feedback]
 * @prop {string} [userId]
 * @prop {string} [responseTexts]
 * @prop {number} sessionCount,
 * @prop {number} sessionDuration
 */

/**
 * @typedef {object} UserMetadata
 * @prop {string} [cd1]
 * @prop {string} [cd2]
 * @prop {string} [cd3]
 * @prop {string} [cd4]
 * @prop {string} [cd5]
 * @prop {string} [cd6]
 * @prop {string} [cd7]
 * @prop {string} [cd8]
 */

const USERS_TABLE = 'users';
const SESSIONS_TABLE = 'sessions';
const INTERACTIONS_TABLE = 'interactions';
const EVENTS_TABLE = 'events';

/**
 * @class {AnalyticsStorage}
 * @implements IAnalyticsStorage
 */
class AnalyticsStorage extends BaseTableStorage {
    /**
     *
     * @param {string} accountName
     * @param {string|Promise<string>} accountKey
     */
    constructor (accountName, accountKey) {
        super(accountName, accountKey);

        /** @type {IGALogger} */
        this._logger = console;

        this.hasExtendedEvents = true;
    }

    /**
     * @param {IGALogger} logger
     */
    setDefaultLogger (logger) {
        this._logger = logger;
    }

    /**
     *
     * @param {AnalyticsEvent} event
     * @param {number} timestamp
     */
    async storeEvent (event, timestamp = null) {
        const tc = await this._getTableClient(EVENTS_TABLE);

        await tc.createEntity({
            rowKey: this._id(),
            partitionKey: event.pageId,
            ts: timestamp ? new Date(timestamp) : new Date(),
            category: '',
            label: '',
            action: '',
            skill: '',
            lastAction: '',
            cd1: '',
            cd2: '',
            cd3: '',
            cd4: '',
            cd5: '',
            cd6: '',
            cd7: '',
            cd8: '',
            nonInteractive: false,
            value: 0,
            lang: '',
            ...event
        });
    }

    /**
     *
     * @param {InteractionView} event
     * @param {number} timestamp
     */
    async storeInteractionView (event, timestamp = null) {
        const tc = await this._getTableClient(INTERACTIONS_TABLE);

        await tc.createEntity({
            rowKey: this._id(),
            partitionKey: event.pageId,
            ts: timestamp ? new Date(timestamp) : new Date(),
            text: '',
            intent: '',
            requestAction: '',
            intentScore: 0,
            entities: '',
            winnerIntent: '',
            winnerAction: '',
            winnerEntities: '',
            winnerScore: 0,
            winnerTaken: false,
            action: '',
            expected: '',
            expectedTaken: false,
            skill: '',
            prevSkill: '',
            cd1: '',
            cd2: '',
            cd3: '',
            cd4: '',
            cd5: '',
            cd6: '',
            cd7: '',
            cd8: '',
            isText: false,
            isGoto: false,
            isQuickReply: false,
            isPostback: false,
            isAttachment: false,
            isContextUpdate: false,
            isNotification: false,
            isPassThread: false,
            lastAction: '',
            prevAction: '',
            lang: '',
            nonInteractive: false,
            responseTexts: '',
            didHandover: false,
            feedback: null,
            ...event
        });
    }

    _conversationId (pageId, senderId) {
        return `${pageId}|${senderId}`;
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} sessionId
     * @param {SessionMetadata} [metadata]
     * @param {number} [ts]
     * @param {boolean} [nonInteractive]
     * @returns {Promise}
     */
    async createUserSession (
        pageId,
        senderId,
        sessionId,
        metadata = {},
        ts = Date.now(),
        nonInteractive = false
    ) {
        const tcSessions = await this._getTableClient(SESSIONS_TABLE);
        const nowDate = new Date(ts);

        const conversationId = this._conversationId(pageId, senderId);

        const {
            sessionCount = 0,
            browserName = null,
            deviceType = null,
            osName = null
        } = metadata;

        await tcSessions.upsertEntity({
            partitionKey: conversationId,
            rowKey: sessionId,
            senderId,
            pageId,
            conversationId,
            sessionStarted: nowDate,
            lastInteraction: nowDate,
            sessionCount,
            interactions: nonInteractive ? 0 : 1,
            browserName,
            deviceType,
            osName
        }, 'Replace');
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {string} sessionId
     * @param {Event[]} events
     * @param {GAUser} [user]
     * @param {number} [ts]
     * @param {boolean} [nonInteractive]
     * @param {boolean} [sessionStarted]
     * @param {SessionMetadata} [metadata]
     * @returns {Promise}
     */
    async storeEvents (
        pageId,
        senderId,
        sessionId,
        events,
        user = null,
        ts = Date.now(),
        nonInteractive = false,
        sessionStarted = false,
        metadata = {}
    ) {
        const partitionKey = pageId;
        const rowKey = senderId;
        const conversationId = this._conversationId(pageId, senderId);

        const nowDate = new Date(ts);
        const tcSessions = await this._getTableClient(SESSIONS_TABLE);
        const tcUsers = await this._getTableClient(USERS_TABLE);

        let dbUser = null;
        try {
            dbUser = await tcUsers.getEntity(partitionKey, rowKey);
        } catch (e) {
            if (e.statusCode !== 404) {
                throw e;
            }
        }

        const {
            sessionCount = 0,
            sessionDuration = 0,
            responseTexts = [],
            skill = null,
            prevSkill = null,
            didHandover,
            feedback
        } = metadata;

        const { id = null, ...userMeta } = user || {};

        await tcUsers.upsertEntity({
            partitionKey,
            rowKey,
            updated: new Date(),
            conversationId,
            userId: id,
            ...userMeta,
            ...(dbUser ? {} : { created: nowDate }),
            sessionId,
            ...(nonInteractive ? {} : { lastInteraction: nowDate }),
            ...(sessionStarted ? { sessionStarted, sessionId } : {})
        }, 'Merge');

        if (!sessionStarted && !nonInteractive) {
            let session = null;
            try {
                session = await tcSessions.getEntity(conversationId, sessionId);
            } catch (e) {
                if (e.statusCode !== 404) {
                    throw e;
                }
            }

            await tcSessions.updateEntity({
                partitionKey: conversationId,
                rowKey: sessionId,
                lastInteraction: nowDate,
                // @ts-ignore
                interactions: session ? session.interactions + 1 : 1
            }, 'Merge');
        }

        if (events.length === 0) {
            return;
        }

        await Promise.all(
            events.map((e) => {
                switch (e.type) {
                    case 'page_view':
                        return this.storeInteractionView({
                            action: '*',
                            ...e,
                            pageId,
                            sessionId,
                            senderId,
                            conversationId,
                            sessionCount,
                            sessionDuration,
                            ...(e.category === 'Bot: Interaction'
                                ? {
                                    responseTexts: responseTexts.join('\n'),
                                    skill,
                                    prevSkill,
                                    didHandover,
                                    feedback
                                }
                                : {})
                        }, ts);
                    default:
                        return this.storeEvent({
                            ...e,
                            pageId,
                            sessionId,
                            senderId,
                            conversationId,
                            ...(e.type === TrackingType.CONVERSATION_EVENT
                                ? {
                                    responseTexts: responseTexts.join('\n')
                                }
                                : {})
                        }, ts);
                }
            })
        );
    }
}

module.exports = AnalyticsStorage;
