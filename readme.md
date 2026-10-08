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
{
  "text": ["Yo ", {"em": "bailo"}, " ", {"strong": "ballet"}, "."],
  "audio": "audio/bailar/presente/presente/example-01.mp3"
}
```

Each sentence example and related-word example is an object with `text` and
`audio` fields. `text` uses the formatted-parts array shown above. `audio` is
the project-relative path to that example's MP3, or `null` until the recording
is added. Store recordings under `audio/<verb>/` and set the matching path in
the JSON; the vocabulary page shows a speaker button and a speed toggle beside
the sentence. Recordings play at 0.9× by default; selecting the orange “Slow”
button changes playback to 0.5×.

Verb translations live in `data/traducciones.json`.

Run the site through a local web server so the browser can load its modules and
JSON files. The GitHub Pages workflow deploys the repository root, including
these asset folders.
