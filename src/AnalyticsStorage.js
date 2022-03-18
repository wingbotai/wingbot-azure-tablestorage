/**
 * @author David Menger
 */
'use strict';
const BaseTableStorage = require('./BaseTableStorage');

/**
 * @typedef {object} AnalyticsEvent
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string} conversationId
 * @prop {string} sessionId
 * @prop {string} category
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
 * @typedef {object} AnalyticsOptions
 * @prop {number} [sessionDuration] - duration of a session im ms
 */

/**
 * @typedef {object} InteractionView
 * @prop {string} pageId
 * @prop {string} senderId
 * @prop {string} conversationId
 * @prop {string} sessionId
 * @prop {string} action
 * @prop {string} allActions
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

class AnalyticsStorage extends BaseTableStorage {
    /**
     *
     * @param {string} accountName
     * @param {string|Promise<string>} accountKey
     * @param {AnalyticsOptions} options
     */
    constructor (accountName, accountKey, options = {}) {
        super(accountName, accountKey);

        this._options = {
            sessionDuration: 3600000
        };
        Object.assign(this._options, options);
    }

    /**
     * @param {AnalyticsOptions} options
     */
    setOptions (options) {
        Object.assign(this._options, options);
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
            nonInteractive: false,
            ...event
        });
    }

    _conversationId (pageId, senderId) {
        return `${pageId}|${senderId}`;
    }

    _getDate (input) {
        if (input instanceof Date) {
            return input;
        }
        if (input.type === 'DateTime') {
            return new Date(input.value);
        }
        return new Date(input);
    }

    /**
      *
      * @param {number} leftOffset
      * @param {Date} left
      * @param {Date} right
      * @returns
      */
    _isDateOffsetGreaterOrEqual (leftOffset, left, right) {
        return (this._getDate(left).getTime() + leftOffset) >= this._getDate(right).getTime();
    }

    /**
     *
     * @param {string} pageId
     * @param {string} senderId
     * @param {UserMetadata} metadata
     * @param {number} [ts]
     * @param {boolean} [nonInteractive]
     * @returns
     */
    async getOrCreateUserSession (
        pageId, senderId, metadata = {}, ts = Date.now(), nonInteractive = false
    ) {
        const tcUsers = await this._getTableClient(USERS_TABLE);
        const tcSessions = await this._getTableClient(SESSIONS_TABLE);

        const partitionKey = pageId;
        const rowKey = senderId;
        const nowDate = new Date(ts);

        let user = null;
        try {
            user = await tcUsers.getEntity(partitionKey, rowKey);
        } catch (e) {
            if (e.statusCode !== 404) {
                throw e;
            }
        }

        let sessionStarted = null;
        let sessionId;
        const conversationId = this._conversationId(pageId, senderId);

        if (user && (nonInteractive || this._isDateOffsetGreaterOrEqual(
            // @ts-ignore
            this._options.sessionDuration, user.lastInteraction, nowDate
        ))) {
            // @ts-ignore
            sessionId = user.sessionId;
        } else {
            sessionStarted = nowDate;
            sessionId = this._inverseTimestampHash(sessionStarted.getTime(), conversationId);
        }

        await tcUsers.upsertEntity({
            partitionKey,
            rowKey,
            updated: new Date(),
            conversationId,
            ...metadata,
            ...(user ? {} : { created: nowDate }),
            ...(nonInteractive ? {} : { lastInteraction: nowDate }),
            ...(sessionStarted ? { sessionStarted, sessionId } : {})
        }, 'Merge');

        let session;

        if (!sessionStarted && !nonInteractive) {
            session = await tcSessions.getEntity(conversationId, sessionId);

            if (session) {
                await tcSessions.updateEntity({
                    partitionKey: conversationId,
                    rowKey: sessionId,
                    lastInteraction: nowDate,
                    // @ts-ignore
                    interactions: session.interactions + 1
                }, 'Merge');
            } else {
                // session start probably failed before
                sessionStarted = this._dateFromInversedTimestamp(sessionId);
            }
        }

        if (sessionStarted) {
            await tcSessions.upsertEntity({
                partitionKey: conversationId,
                rowKey: sessionId,
                senderId,
                pageId,
                conversationId,
                sessionStarted,
                lastInteraction: nowDate,
                interactions: nonInteractive ? 0 : 1
            }, 'Replace');
        }

        return {
            sessionId,
            conversationId
        };
    }
}

module.exports = AnalyticsStorage;
