# Vocabulary audio

Keep one MP3 per vocabulary example under a folder named for its verb and
tense, then set that example's `audio` field in `data/vocabulario.json` to the
project-relative file path. For example,
`audio/bailar/presente/presente/example-01.mp3`.

The current clips use the macOS Paulina Mexican Spanish voice at 158 words per
minute (about 0.9× the default speech rate). Parenthetical English glosses and
grammar notes are omitted from the spoken sentence. The vocabulary page plays
each clip at this rate by default; selecting the orange “Slow” button changes
playback to 0.5×.

Examples with `"audio": null` have no recording yet. The vocabulary page shows
an `MP3 not added` label for those entries and a speaker button with a speed
toggle once a path is provided.
