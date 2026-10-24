#!/usr/bin/env python3
"""Generate OpenAI speech only for linked vocabulary MP3s that are missing."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parent.parent
VOCABULARY_FILE = ROOT / "data" / "vocabulario.json"
API_URL = "https://api.openai.com/v1/audio/speech"
MODEL = "gpt-4o-mini-tts"
VOICE = "cedar"
SPEECH_INSTRUCTIONS = (
    "You are a Peruvian Spanish pronunciation coach. I will give you a Spanish sentence. "
    "Prepare it for text-to-speech so a Spanish learner can clearly hear and understand every word. "
    "Keep the original meaning and use natural Peruvian Spanish pronunciation. Speak at a slow, "
    "clear pace, with brief pauses between meaningful phrases. Pronounce each word distinctly, "
    "but keep the sentence sounding natural. Avoid adding explanations or extra words."
)
MAX_INPUT_CHARACTERS = 4096


def flatten_text(value: object) -> str:
    """Join formatted sentence parts without losing their original spacing."""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "".join(flatten_text(part) for part in value)
    if isinstance(value, dict):
        return "".join(flatten_text(part) for part in value.values())
    return ""


def spoken_sentence(formatted_text: object) -> str:
    # The existing audio guide says parenthetical English glosses and notes are
    # omitted from the spoken audio.
    text = re.sub(r"\s*\([^)]*\)", "", flatten_text(formatted_text))
    return re.sub(r"\s+", " ", text).strip()


def find_examples(node: object):
    if isinstance(node, dict):
        if "text" in node and "audio" in node:
            yield node
            return
        for value in node.values():
            yield from find_examples(value)
    elif isinstance(node, list):
        for value in node:
            yield from find_examples(value)


def safe_audio_path(raw_path: object) -> tuple[PurePosixPath, Path]:
    if not isinstance(raw_path, str) or not raw_path.strip():
        raise ValueError(f"Invalid audio path in {VOCABULARY_FILE.relative_to(ROOT)}: {raw_path!r}")

    relative = PurePosixPath(raw_path)
    if (
        relative.is_absolute()
        or ".." in relative.parts
        or not relative.parts
        or relative.parts[0] != "audio"
        or relative.suffix.lower() != ".mp3"
    ):
        raise ValueError(f"Audio path must be a project-relative MP3 under audio/: {raw_path!r}")

    target = ROOT.joinpath(*relative.parts)
    audio_root = (ROOT / "audio").resolve()
    try:
        target.resolve().relative_to(audio_root)
    except ValueError as error:
        raise ValueError(f"Audio path escapes the audio directory: {raw_path!r}") from error
    return relative, target


def load_jobs(
    selected_paths: set[PurePosixPath] | None = None,
    regenerate_all: bool = False,
) -> tuple[list[tuple[PurePosixPath, Path, str]], int, int]:
    with VOCABULARY_FILE.open(encoding="utf-8") as source:
        vocabulary = json.load(source)

    jobs: list[tuple[PurePosixPath, Path, str]] = []
    seen_paths: set[PurePosixPath] = set()
    linked_paths: set[PurePosixPath] = set()
    existing_count = 0
    unlinked_count = 0
    for example in find_examples(vocabulary):
        if example["audio"] is None:
            unlinked_count += 1
            continue

        relative, target = safe_audio_path(example["audio"])
        if relative in seen_paths:
            raise ValueError(f"More than one example points to the same audio file: {relative}")
        seen_paths.add(relative)
        linked_paths.add(relative)
        if target.is_file():
            existing_count += 1
            if not regenerate_all or (selected_paths is not None and relative not in selected_paths):
                continue
        elif target.exists():
            raise ValueError(f"Audio output path exists but is not a file: {relative}")
        elif selected_paths is not None and relative not in selected_paths:
            continue

        sentence = spoken_sentence(example["text"])
        if not sentence:
            raise ValueError(f"No speakable text for {relative}")
        if len(sentence) > MAX_INPUT_CHARACTERS:
            raise ValueError(f"Text exceeds the {MAX_INPUT_CHARACTERS}-character API limit: {relative}")
        jobs.append((relative, target, sentence))

    if selected_paths is not None:
        unknown_paths = selected_paths - linked_paths
        if unknown_paths:
            formatted = ", ".join(sorted(str(path) for path in unknown_paths))
            raise ValueError(f"--only path(s) are not linked to vocabulary examples: {formatted}")

    return jobs, existing_count, unlinked_count


def request_speech(api_key: str, sentence: str, voice: str) -> bytes:
    # The API receives only sentence text from data/vocabulario.json; existing
    # MP3 bytes are never used as speech input.
    payload = json.dumps(
        {
            "model": MODEL,
            "voice": voice,
            "input": sentence,
            "instructions": SPEECH_INSTRUCTIONS,
            "response_format": "mp3",
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    retryable_statuses = {429, 500, 502, 503, 504}
    for attempt in range(5):
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                audio = response.read()
            if not audio:
                raise RuntimeError("OpenAI returned an empty audio file")
            return audio
        except urllib.error.HTTPError as error:
            details = error.read().decode("utf-8", errors="replace").strip()
            if error.code not in retryable_statuses or attempt == 4:
                raise RuntimeError(
                    f"OpenAI API request failed (HTTP {error.code})"
                    + (f": {details}" if details else "")
                ) from error
            retry_after = error.headers.get("Retry-After")
            try:
                delay = float(retry_after) if retry_after else min(2**attempt, 30)
            except ValueError:
                delay = min(2**attempt, 30)
            time.sleep(max(0, delay))
        except urllib.error.URLError as error:
            if attempt == 4:
                raise RuntimeError(f"Could not reach the OpenAI API: {error.reason}") from error
            time.sleep(min(2**attempt, 30))

    raise RuntimeError("OpenAI API request failed after retries")


def add_missing_audio(
    jobs: list[tuple[PurePosixPath, Path, str]], generated_dir: Path
) -> tuple[int, int]:
    added = 0
    skipped_race = 0
    for relative, target, _ in jobs:
        generated = generated_dir.joinpath(*relative.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        try:
            # Hard-linking publishes the staged file atomically and fails if
            # another process created the destination; it never overwrites.
            os.link(generated, target)
            added += 1
        except FileExistsError:
            print(f"Skipping {relative}; an audio file appeared while generating.")
            skipped_race += 1
    return added, skipped_race


def replace_audio(
    jobs: list[tuple[PurePosixPath, Path, str]], generated_dir: Path
) -> tuple[int, int]:
    added = 0
    replaced = 0
    for relative, target, _ in jobs:
        generated = generated_dir.joinpath(*relative.parts)
        target.parent.mkdir(parents=True, exist_ok=True)
        existed = target.is_file()
        os.replace(generated, target)
        if existed:
            replaced += 1
        else:
            added += 1
    return added, replaced


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate only missing vocabulary MP3s that have an audio path in data/vocabulario.json."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List the missing sentences and Cedar voice assignments without calling the API or changing files.",
    )
    parser.add_argument(
        "--only",
        action="append",
        metavar="AUDIO_PATH",
        help=(
            "Generate only the missing audio file at this project-relative path. "
            "Repeat the option to select multiple paths."
        ),
    )
    parser.add_argument(
        "--regenerate-all",
        action="store_true",
        help="Regenerate every linked vocabulary MP3 with Cedar and replace existing files after generation succeeds.",
    )
    args = parser.parse_args()

    try:
        selected_paths = None
        if args.only:
            selected_paths = {PurePosixPath(raw_path) for raw_path in args.only}
            for raw_path in args.only:
                safe_audio_path(raw_path)

        jobs, existing_count, unlinked_count = load_jobs(selected_paths, args.regenerate_all)
        if args.regenerate_all:
            print(
                f"Selected {len(jobs)} linked MP3s for Cedar regeneration; "
                f"{existing_count} currently exist and will be replaced after generation succeeds."
            )
        else:
            print(
                f"Found {existing_count} existing linked MP3s to keep and {len(jobs)} missing linked MP3s "
                f"selected for Cedar generation."
            )
        if unlinked_count:
            print(f"Skipping {unlinked_count} examples with audio: null; add an audio path to generate them.")

        if args.dry_run:
            for index, (relative, _, sentence) in enumerate(jobs, start=1):
                print(f"[{index}/{len(jobs)}] {VOICE}: {relative} — {sentence}")
            print("Dry run only; no API calls were made and no files were changed.")
            return 0

        if not jobs:
            print("No missing linked MP3s to generate.")
            return 0

        api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY is not set. In the project terminal, run "
                "export OPENAI_API_KEY=\"your-api-key\" and then rerun this script."
            )

        with tempfile.TemporaryDirectory(prefix=".openai-tts-", dir=ROOT) as temporary_directory:
            temporary_root = Path(temporary_directory)
            generated_dir = temporary_root / "generated"

            for index, (relative, _, sentence) in enumerate(jobs, start=1):
                print(f"[{index}/{len(jobs)}] Generating {relative} ({VOICE})", flush=True)
                staged_file = generated_dir.joinpath(*relative.parts)
                staged_file.parent.mkdir(parents=True, exist_ok=True)
                staged_file.write_bytes(request_speech(api_key, sentence, VOICE))

            if args.regenerate_all:
                added, replaced = replace_audio(jobs, generated_dir)
                skipped_race = 0
            else:
                added, skipped_race = add_missing_audio(jobs, generated_dir)
                replaced = 0

        if args.regenerate_all:
            print(f"Added {added} MP3s and replaced {replaced} existing MP3s with Cedar audio.")
        else:
            print(f"Added {added} missing MP3s; existing audio was not replaced.")
        if skipped_race:
            print(f"Skipped {skipped_race} files created by another process during generation.")
        return 0
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        if args.regenerate_all:
            print(
                "Audio replacement starts only after generation completes; a filesystem error during publication may leave a partially updated set.",
                file=sys.stderr,
            )
        else:
            print("Existing MP3 files were left unchanged.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
