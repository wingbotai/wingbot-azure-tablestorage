/**
 * @author wingbot.ai
 */
'use strict';

const { replaceDiacritics } = require('webalize');
const { ai } = require('wingbot');
const anonymize = require('./anonymize');

/** @typedef {import('wingbot/src/Processor').InteractionEvent} InteractionEvent */

function factoryOnActionEvent ({
    enabled,
    throwException = false,
    log = console
},
analyticsStorage) {
    /**
      * @param {InteractionEvent} event
      */
    return async function onInteraction ({
        req,
        actions,
        lastAction,
        // state,
        // data,
        skill,
        tracking
    }) {
        if (!enabled) {
            return;
        }
        try {
            const nonInteractive = !!req.campaign;
            const {
                pageId,
                senderId,
                timestamp
            } = req;

            // log.log('creating session', { pageId, senderId });

            const {
                sessionId,
                conversationId
            } = await analyticsStorage
                .getOrCreateUserSession(pageId, senderId, {
                    cd1: (req.state.user && req.state.user.department) || 'unknown'
                }, timestamp, nonInteractive);

            // log.log('session created', { sessionId, conversationId });

            const [{
                intent = '',
                score = 0
            } = {}] = req.intents;

            const text = anonymize(
                replaceDiacritics(req.text()).replace(/\s+/g, ' ').toLowerCase().trim()
            );

            const [action = '(none)', ...otherActions] = actions;

            let winnerAction = '';
            let winnerScore = 0;
            let winnerIntent = '';
            let winnerEntities = [];
            let winnerTaken = false;

            const winners = req.aiActions();

            if (winners.length > 0) {
                [{
                    action: winnerAction = '(none)',
                    sort: winnerScore = 0,
                    intent: { intent: winnerIntent, entities: winnerEntities = [] }
                }] = winners;

                winnerTaken = action === winnerAction;
            }

            const expected = req.expected() ? req.expected().action : '';

            const isContextUpdate = req.isSetContext();
            const isNotification = !!req.campaign;
            const isAttachment = req.isAttachment();
            const isQuickReply = req.isQuickReply();
            const isPassThread = !!req.event.pass_thread_control;
            const isText = !isQuickReply && req.isText();
            const isPostback = req.isPostBack();

            const allActions = actions.join(',');
            const requestAction = req.action();

            // log.log('storeInteractionView', {
            //     pageId,
            //     senderId,
            //     action,
            //     allActions,
            //     requestAction: req.action() || '(none)',
            //     conversationId,
            //     sessionId,
            //     expected,
            //     expectedTaken: requestAction === expected,
            //     isContextUpdate,
            //     isAttachment,
            //     isNotification,
            //     isQuickReply,
            //     isPassThread,
            //     isText,
            //     isPostback,
            //     winnerAction,
            //     winnerIntent,
            //     winnerEntities: winnerEntities.map((e) => e.entity).join(','),
            //     winnerScore,
            //     winnerTaken,
            //     intent,
            //     intentScore: score,
            //     entities: req.entities.map((e) => e.entity).join(','),
            //     nonInteractive,
            //     lastAction,
            //     prevAction: lastAction,
            //     skill,
            //     text
            // });

            await analyticsStorage.storeInteractionView({
                pageId,
                senderId,
                action,
                allActions,
                requestAction: req.action() || '(none)',
                conversationId,
                sessionId,
                expected,
                expectedTaken: requestAction === expected,
                isContextUpdate,
                isAttachment,
                isNotification,
                isQuickReply,
                isPassThread,
                isText,
                isPostback,
                winnerAction,
                winnerIntent,
                winnerEntities: winnerEntities.map((e) => e.entity).join(','),
                winnerScore,
                winnerTaken,
                intent,
                intentScore: score,
                entities: req.entities.map((e) => e.entity).join(','),
                nonInteractive,
                lastAction,
                prevAction: lastAction,
                skill,
                text,
                cd1: req.state.lang
            }, req.timestamp);

            let prevAction = action;

            await Promise.all(
                otherActions.map((a) => {
                    // log.log('storeInteractionView', {
                    //     pageId,
                    //     senderId,
                    //     action: a,
                    //     allActions,
                    //     conversationId,
                    //     sessionId,
                    //     nonInteractive: false,
                    //     lastAction,
                    //     prevAction,
                    //     skill,
                    //     isGoto: true
                    // });

                    const r = analyticsStorage.storeInteractionView({
                        pageId,
                        senderId,
                        action: a,
                        allActions,
                        conversationId,
                        sessionId,
                        nonInteractive: false,
                        lastAction,
                        prevAction,
                        skill,
                        isGoto: true,
                        cd1: req.state.lang
                    }, req.timestamp);

                    prevAction = a;

                    return r;
                })
            );

            await Promise.all(
                tracking.events.map(({
                    type, category, action: eventAction, label, value
                }) => analyticsStorage.storeEvent({
                    pageId,
                    senderId,
                    conversationId,
                    sessionId,
                    lastAction,
                    type,
                    category,
                    action: eventAction,
                    label,
                    value,
                    cd1: req.state.lang
                }, req.timestamp))
            );

            if (nonInteractive) {
                // no user event
                return;
            }

            if (req.isText()) {
                // log.log('storeEvent', {
                //     type: 'conversation',
                //     pageId,
                //     senderId,
                //     conversationId,
                //     sessionId,
                //     lastAction,
                //     category: 'Intent: Detection',
                //     action: intent,
                //     label: text,
                //     value: score >= ai.confidence ? 0 : 1
                // });

                await analyticsStorage
                    .storeEvent({
                        type: 'conversation',
                        pageId,
                        senderId,
                        conversationId,
                        sessionId,
                        lastAction,
                        category: 'Intent: Detection',
                        action: intent,
                        label: text,
                        value: score >= ai.confidence ? 0 : 1,
                        cd1: req.state.lang
                    }, timestamp);
            }

            const notHandled = actions.some((a) => a.match(/\*$/)) && !req.isQuickReply();

            let actionCategory = 'User: ';
            let label = '(none)';
            const value = notHandled ? 1 : 0;

            if (req.isSticker()) {
                actionCategory += 'Sticker';
                label = req.attachmentUrl(0);
            } else if (req.isImage()) {
                actionCategory += 'Image';
                label = req.attachmentUrl(0);
            } else if (req.hasLocation()) {
                actionCategory += 'Location';
                const { lat, long } = req.getLocation();
                label = `${lat}, ${long}`;
            } else if (req.isAttachment()) {
                actionCategory += 'Attachement';
                label = req.attachment(0).type;
            } else if (req.isText()) {
                actionCategory += 'Text';
                label = text;
            } else if (req.isQuickReply()) {
                actionCategory += 'Quick reply';
                label = text;
            } else if (req.isReferral() || req.isOptin()) {
                actionCategory = req.isOptin()
                    ? 'Entry: Optin'
                    : 'Entry: Referral';
            } else if (req.isPostBack()) {
                actionCategory += 'Button - bot';
                label = req.data.postback.title || '(unknown)';
            } else {
                actionCategory += 'Other';
            }

            // log.log('storeEvent', {
            //     type: 'conversation',
            //     pageId,
            //     senderId,
            //     conversationId,
            //     sessionId,
            //     lastAction,
            //     category: actionCategory,
            //     action,
            //     label,
            //     value
            // });

            await analyticsStorage
                .storeEvent({
                    type: 'conversation',
                    pageId,
                    senderId,
                    conversationId,
                    sessionId,
                    lastAction,
                    category: actionCategory,
                    action,
                    label,
                    value,
                    cd1: req.state.lang
                }, timestamp);
        } catch (e) {
            if (throwException) {
                throw e;
            }
            log.error('failed sending logs', e);
        }
    };
}

module.exports = {
    factoryOnActionEvent
};
