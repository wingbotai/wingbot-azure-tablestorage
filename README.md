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
app.processor.on('interaction', onInteraction);
```
## How to run tests
Create secretKey.json in `./config`

```json
{
    "key":"INSERT_KEY_HERE"
}
```
```
npm run test
```
