# Wingbot azure tablestorage

```
npm i wingbot-azure-tablestorage
```

## Usage
```javascript
const analyticsStorage = new AnalyticsStorage(accountName, accountKey, options?);

/**
  * @param {object} options
  * @param {boolean} options.enabled
  * @param {boolean} options.throwException
  * @param {function} options.anonymize
  * @param {Log} options.log
  * @param {AnalyticsStorage} analyticsStorage
  * 
  */
const onInteraction = createOnInteractionHandler ({ 
  enabled, 
  throwException = false, 
  log = console, 
  anonymize = text => text 
}, analyticsStorage);
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
