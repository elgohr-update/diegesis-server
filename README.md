# diegesis-server
An Apollo-based Server that Caches Scripture from Remote Sources and Serves Them via a Unified GraphQL Interface.

## Installation
```
npm install
cd src
node index.js
```

## Configuration
- There are few constants at the top of `src/index.js`
- New org handlers go in `orgHandlers`

## Writing a new org handler
Look at the `eBible` example. Your org handler directory should include
- JSON called `org.json` containing a unique `name` and `translationDir`.
- a module called `translations.js` that returns `getTranslationsCatalog` and `fetchUsfm`

The catalog representation produced by `getTranslationsCatalog` is currently very simple, to make adoption by multiple organizations as painless as posssible. The required fields are
- id
- languageCode
- languageName
- title
- description
- copyright
