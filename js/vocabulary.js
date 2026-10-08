import { appendFormattedText, configContainsVerb, createVerbPageLink, loadConfig, loadJSON, showMessage } from "./shared.js";

let activeAudio = null;

function createAudioButtonIcon(isPlaying) {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(svgNamespace, "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.classList.add("audio-button-icon");

  const shape = document.createElementNS(svgNamespace, "path");
  shape.setAttribute("fill", "currentColor");
  shape.setAttribute(
    "d",
    isPlaying
      ? "M6 5h4v14H6zm8 0h4v14h-4z"
      : "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
  );
  icon.appendChild(shape);

  return icon;
}

function createExampleContent(example, className = "example-line") {
  const line = document.createElement("div");
  line.classList.add(className);

  const text = document.createElement("span");
  text.classList.add("example-text");
  appendFormattedText(text, example?.text ?? example);
  line.appendChild(text);

  if (typeof example?.audio === "string" && example.audio.trim()) {
    const controls = document.createElement("div");
    controls.classList.add("example-audio-controls");

    const player = document.createElement("audio");
    player.preload = "none";
    player.src = example.audio;
    player.hidden = true;

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.classList.add("audio-play-button");

    const setPlaying = (isPlaying) => {
      playButton.replaceChildren(createAudioButtonIcon(isPlaying));
      playButton.setAttribute("aria-label", isPlaying ? "Pause example audio" : "Play example audio");
      playButton.title = isPlaying ? "Pause audio" : "Play audio";
    };

    setPlaying(false);
    playButton.addEventListener("click", async () => {
      if (!player.paused) {
        player.pause();
        return;
      }

      if (activeAudio && activeAudio !== player) {
        activeAudio.pause();
      }

      try {
        await player.play();
        activeAudio = player;
        setPlaying(true);
      } catch {
        setPlaying(false);
        playButton.setAttribute("aria-label", "Play example audio; audio could not be played");
        playButton.title = "Audio could not be played";
      }
    });
    player.addEventListener("pause", () => {
      setPlaying(false);
      if (activeAudio === player) {
        activeAudio = null;
      }
    });
    player.addEventListener("ended", () => {
      setPlaying(false);
      if (activeAudio === player) {
        activeAudio = null;
      }
    });

    /* Temporarily disabled: restore this block to bring back the slow toggle.
    const recordedSpeechRate = 0.9;
    const slowSpeechRate = 0.5;
    const speedButton = document.createElement("button");
    speedButton.type = "button";
    speedButton.classList.add("audio-speed-button");
    speedButton.textContent = "Slow";
    let isSlow = false;

    const setSpeed = () => {
      speedButton.setAttribute("aria-pressed", String(isSlow));
      speedButton.setAttribute(
        "aria-label",
        isSlow
          ? "Slow speech is on, 0.5 times. Switch off to return to 0.9 times."
          : "Slow speech is off, 0.9 times. Switch on for 0.5 times."
      );
      speedButton.title = isSlow ? "Return to 0.9× speech" : "Slow speech to 0.5×";
      // Adjust playback proportionally because the current recordings are at 0.9×.
      player.playbackRate = isSlow ? slowSpeechRate / recordedSpeechRate : 1;
    };

    setSpeed();
    speedButton.addEventListener("click", () => {
      isSlow = !isSlow;
      setSpeed();
    });
    controls.append(player, playButton, speedButton);
    */

    controls.append(player, playButton);
    line.appendChild(controls);
  } else {
    const missingAudio = document.createElement("span");
    missingAudio.classList.add("audio-pending");
    missingAudio.textContent = "MP3 not added";
    line.appendChild(missingAudio);
  }

  return line;
}

function createRelatedWordsCard(relatedWords) {
  const card = document.createElement("section");
  card.classList.add("vocabulary");

  const heading = document.createElement("h3");
  heading.classList.add("card-title");
  heading.textContent = relatedWords.title;
  card.appendChild(heading);

  for (const word of relatedWords.words ?? []) {
    const item = document.createElement("div");
    item.classList.add("vocab-item");

    const term = document.createElement("div");
    const wordName = document.createElement("strong");
    wordName.textContent = word.term;
    const translation = document.createElement("span");
    translation.textContent = word.translation;
    term.append(wordName, translation);
    item.appendChild(term);

    if (word.example) {
      const example = document.createElement("div");
      example.classList.add("vocab-example");
      example.appendChild(createExampleContent(word.example));
      item.appendChild(example);
    }

    card.appendChild(item);
  }

  return card;
}

function createVocabTenseTable(tense) {
  const table = document.createElement("table");
  table.classList.add("conjugation-table", "vocab-table");

  const caption = document.createElement("caption");
  caption.appendChild(document.createTextNode(tense.title));
  if (tense.note) {
    const note = document.createElement("span");
    note.textContent = ` ${tense.note}`;
    caption.appendChild(note);
  }
  table.appendChild(caption);

  const body = document.createElement("tbody");
  for (const sentence of tense.examples ?? []) {
    const row = document.createElement("tr");
    const example = document.createElement("td");
    example.appendChild(createExampleContent(sentence));
    row.appendChild(example);
    body.appendChild(row);
  }
  table.appendChild(body);
  return table;
}

function createTimeGroup(timeGroup) {
  const group = document.createElement("section");
  group.classList.add("time-group");

  const heading = document.createElement("h2");
  heading.classList.add("group-title");
  heading.textContent = timeGroup.time;
  group.appendChild(heading);

  if (timeGroup.topic) {
    const topic = document.createElement("h3");
    topic.classList.add("study-topic");
    topic.textContent = timeGroup.topic;
    group.appendChild(topic);
  }

  const cards = document.createElement("div");
  cards.classList.add("tense-grid");
  for (const tense of timeGroup.tenses ?? []) {
    cards.appendChild(createVocabTenseTable(tense));
  }
  group.appendChild(cards);
  return group;
}

export async function initializeVocabularyPage() {
  const content = document.getElementById("vocab-lesson-content");
  if (!content) return;

  const heading = document.getElementById("vocab-page-heading");
  const title = document.getElementById("vocab-title");
  const error = document.getElementById("vocab-error");
  try {
    const [config, translations, vocabularies, conjugationConfig] = await Promise.all([
      loadConfig("vocab_config"),
      loadJSON("traducciones"),
      loadJSON("vocabulario"),
      loadConfig("verbos_config").catch(() => null)
    ]);
    const verb = new URLSearchParams(window.location.search).get("verbo")?.trim().toLowerCase();

    if (!verb || !configContainsVerb(config, verb)) {
      throw new Error("Choose a verb from the vocabulary menu.");
    }

    const lesson = vocabularies[verb];
    if (!lesson) {
      throw new Error(`Vocabulary for “${verb}” hasn’t been added yet.`);
    }

    const translation = translations[verb] ? ` (${translations[verb]})` : "";
    title.textContent = `${verb}${translation}`;
    if (configContainsVerb(conjugationConfig, verb)) {
      heading.appendChild(createVerbPageLink("conjugaciones.html", "Go to Conjugations", verb));
    }
    document.title = `Vocabulario: ${verb}`;

    if (lesson.related_words) {
      content.appendChild(createRelatedWordsCard(lesson.related_words));
    }
    for (const timeGroup of lesson.time_groups ?? []) {
      content.appendChild(createTimeGroup(timeGroup));
    }
  } catch (cause) {
    showMessage(error, cause.message);
  }
}
