import { appendFormattedText, configContainsVerb, createVerbPageLink, loadConfig, loadJSON, showMessage } from "./shared.js";

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
      const example = document.createElement("p");
      example.classList.add("vocab-example");
      appendFormattedText(example, word.example);
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
    appendFormattedText(example, sentence);
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
