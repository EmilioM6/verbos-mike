# Verbos de Mike

A static Spanish verb conjugation and vocabulary site.

## Project layout

- The HTML pages live in the project root.
- `css/` contains the shared stylesheet.
- `js/` contains the page router and page-specific rendering modules.
- `config/` contains the verb-list and conjugation configuration JSON files.
- `data/` contains the conjugation, translation, and vocabulary content JSON files.

## Adding vocabulary for a verb

Add the verb to `config/vocab_config.json`, then add a matching entry to
`data/vocabulario.json`. Each vocabulary entry can include `related_words` and
an ordered `time_groups` array. A time group contains its heading, topic, and
tense cards. Example text is an array of plain strings and optional `em` or
`strong` parts, for example:

```json
["Yo ", {"em": "bailo"}, " ", {"strong": "ballet"}, "."]
```

Verb translations live in `data/traducciones.json`.

Run the site through a local web server so the browser can load its modules and
JSON files. The GitHub Pages workflow deploys the repository root, including
these asset folders.
