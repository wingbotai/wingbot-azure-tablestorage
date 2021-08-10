# Wingbot azure tablestorage

```
npm i wingbot-azure-tablestorage
```

## Usage
```javascript
const analyticsStorage = new AnalyticsStorage(accountName, accountKey, options?);

/**
  * @param {InteractionEvent} event
  */
const onInteraction = onAction ({ enabled, throwException = false }, analyticsStorage);
...
onInteraction({
    req,
    actions,
    lastAction,
    skill,
    tracking
});
```
## How to run test
Create secretKey.json in `./config`

```json
{
    "key":"INSERT_KEY_HERE"
}
```
```
npm run test
```
