# Vocabulary audio

Keep one MP3 per vocabulary example under a folder named for its verb and
tense, then set that example's `audio` field in `data/vocabulario.json` to the
project-relative file path. For example,
`audio/bailar/presente/presente/example-01.mp3`.

The vocabulary clips are generated with the OpenAI text-to-speech API using
the `cedar` and `marin` voices. Each sentence is assigned one of those voices
independently at random, with equal probability. Parenthetical English glosses
and grammar notes are omitted from the spoken sentence. Speech uses OpenAI's
default speed. The vocabulary page discloses that the audio is AI-generated.

Examples with `"audio": null` have no recording yet. The vocabulary page shows
an `MP3 not added` label for those entries and a play button once a path is
provided.

## Generate missing linked MP3 files

From the project root, set your API key in the terminal environment and run the
script:

```sh
export OPENAI_API_KEY="your-api-key"
python3 scripts/generate_openai_audio.py
```

The script takes its spoken input from each example's `text` in
`data/vocabulario.json` and removes parenthetical glosses. It skips any example
whose linked MP3 already exists, and generates only missing files. It does not
use, transcribe, or send existing MP3 audio to OpenAI. It stages all missing
audio before adding files, and will never overwrite an existing MP3. Examples
with `"audio": null` need an audio path added before the script can generate
them. Use `python3 scripts/generate_openai_audio.py --dry-run` to preview only
the missing sentences and voice assignments without API calls or file changes.

The API key is read from the `OPENAI_API_KEY` environment variable; keep it in
your terminal environment and out of the repository.

The script currently uses the Speech API model `gpt-4o-mini-tts`. OpenAI's
documentation schedules that model to shut down on January 6, 2027. Spanish is
supported, though the built-in voices are currently optimized for English, so
listen to the generated clips to confirm the Peruvian pronunciation meets your
needs before relying on them.
