# Vocabulary audio

Keep one MP3 per vocabulary example under a folder named for its verb and
tense, then set that example's `audio` field in `data/vocabulario.json` to the
project-relative file path. For example,
`audio/bailar/presente/presente/example-01.mp3`.

The vocabulary clips are generated with the OpenAI text-to-speech API using
the `cedar` voice. Parenthetical English glosses and grammar notes are omitted
from the spoken sentence. Speech uses OpenAI's default speed. The vocabulary
page discloses that the audio is AI-generated.

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
them. Use `python3 scripts/generate_openai_audio.py --dry-run` to preview the
missing sentences and Cedar voice without API calls or file changes. To limit
generation to selected missing paths, repeat `--only` for each project-relative
MP3 path, for example `--only audio/cantar/presente/presente/example-01-v2.mp3`.
To regenerate every linked vocabulary MP3 with Cedar, including files that
already exist, run `python3 scripts/generate_openai_audio.py --regenerate-all`.
That mode replaces the linked MP3s after all requested clips have been generated.

The API key is read from the `OPENAI_API_KEY` environment variable; keep it in
your terminal environment and out of the repository.

The script currently uses the Speech API model `gpt-4o-mini-tts`. OpenAI's
documentation schedules that model to shut down on January 6, 2027. Spanish is
supported, though the built-in voices are currently optimized for English, so
listen to the generated clips to confirm the Peruvian pronunciation meets your
needs before relying on them.
