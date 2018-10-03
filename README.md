# PhraseApp client

A thin wrapper to handle requests to the PhraseApp API.

[![Dependency Status](https://david-dm.org//birkestroem/phraseapp-client.svg)](https://david-dm.org/birkestroem/phraseapp-client)

## Examples

### List your projects

```javascript
const PhraseAppClient = require('phraseapp-client');

const phraseapp = new PhraseAppClient(
  'https://api.phraseapp.com/v2',
  process.env.PHRASEAPP_ACCESS_TOKEN,
);

(async () => {
	console.log(await phraseapp.listProjects());
})();
```