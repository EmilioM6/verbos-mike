async function loadJSON(nombre_json) {
    try {
      const response = await fetch(`./${nombre_json}.json`);
      const data = await response.json(); // Parses JSON to a JavaScript object
      return data;
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
}

// index.html
async function createVerbos() {
  const verbos = document.getElementById("verbos");
  if (!verbos) return;

  const config = await loadJSON("verbos_config");
  const traducciones = await loadJSON("traducciones");

  const endings = config.terminaciones;
  const newDiv = document.createElement("div");
  newDiv.classList.add("verb-list");

  for (const ending in endings) {
      const group = document.createElement("section");
      group.classList.add("verb-group");

      const newHeader = document.createElement("h2");
      newHeader.textContent = `Verbos con "${ending}"`;
      group.appendChild(newHeader);

      const linksContainer = document.createElement("div");
      linksContainer.classList.add("verb-grid");

      for (const verbo of endings[ending]) {
          const newA = document.createElement("a");

          newA.classList.add("verb-link");
          newA.href =
              `conjugaciones.html?verbo=${encodeURIComponent(verbo)}`;

          const verboName = document.createElement("span");
          verboName.classList.add("verb-name");
          verboName.textContent = verbo;

          const translation = document.createElement("span");
          translation.classList.add("verb-translation");
          translation.textContent = traducciones[verbo] ?? "";

          newA.appendChild(verboName);
          newA.appendChild(translation);

          linksContainer.appendChild(newA);
      }

      group.appendChild(linksContainer);
      newDiv.appendChild(group);
  }

  verbos.appendChild(newDiv);
}

// vocab.html
async function createVerbosConVocab() {
  const vocabulario = document.getElementById("vocabulario");
  if (!vocabulario) return;

  const config = await loadJSON("vocab_config");

  const traducciones = await loadJSON("traducciones");

  const endings = config.terminaciones;
  const newDiv = document.createElement("div");
  newDiv.classList.add("verb-list");

  for (const ending in endings) {
      const group = document.createElement("section");
      group.classList.add("verb-group");

      const newHeader = document.createElement("h2");
      newHeader.textContent = `Verbos con "${ending}"`;
      group.appendChild(newHeader);

      const linksContainer = document.createElement("div");
      linksContainer.classList.add("verb-grid");

      for (const verbo of endings[ending]) {
          const newA = document.createElement("a");

          newA.classList.add("verb-link");
          newA.href =
              `vocab.html?verbo=${encodeURIComponent(verbo)}`;

          const verboName = document.createElement("span");
          verboName.classList.add("verb-name");
          verboName.textContent = verbo;

          const translation = document.createElement("span");
          translation.classList.add("verb-translation");
          translation.textContent = traducciones[verbo] ?? "";

          newA.appendChild(verboName);
          newA.appendChild(translation);

          linksContainer.appendChild(newA);
      }

      group.appendChild(linksContainer);
      newDiv.appendChild(group);
  }

  vocabulario.appendChild(newDiv);
}

function appendVocabMarkup(parent, markup) {
  const template = document.createElement("template");
  template.innerHTML = markup;

  function copyNode(source) {
    if (source.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(source.textContent);
    }

    if (source.nodeType !== Node.ELEMENT_NODE) {
      return document.createTextNode("");
    }

    const tagName = source.tagName.toLowerCase();
    if (tagName !== "em" && tagName !== "strong") {
      return document.createTextNode(source.textContent);
    }

    const element = document.createElement(tagName);
    for (const child of source.childNodes) {
      element.appendChild(copyNode(child));
    }
    return element;
  }

  for (const child of template.content.childNodes) {
    parent.appendChild(copyNode(child));
  }
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
      const example = document.createElement("p");
      example.classList.add("vocab-example");
      appendVocabMarkup(example, word.example);
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
  caption.append(document.createTextNode(tense.title));
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
    appendVocabMarkup(example, sentence);
    row.appendChild(example);
    body.appendChild(row);
  }
  table.appendChild(body);
  return table;
}

async function renderVocabularyLesson() {
  const content = document.getElementById("vocab-lesson-content");
  if (!content) return;

  const title = document.getElementById("vocab-title");
  const error = document.getElementById("vocab-error");
  const params = new URLSearchParams(window.location.search);
  const verbo = params.get("verbo")?.trim().toLowerCase();

  const [config, translations, vocabularies] = await Promise.all([
    loadJSON("vocab_config"),
    loadJSON("traducciones"),
    loadJSON("vocabulario")
  ]);

  const availableVerbs = Object.values(config?.terminaciones ?? {}).flat();
  if (!verbo || !availableVerbs.includes(verbo)) {
    error.textContent = "Choose a verb from the vocabulary menu.";
    return;
  }

  const lesson = vocabularies?.[verbo];
  if (!lesson) {
    error.textContent = `Vocabulary for “${verbo}” hasn’t been added yet.`;
    return;
  }

  const translation = translations?.[verbo];
  title.textContent = `${verbo}${translation ? ` (${translation})` : ""}`;
  document.title = `Vocabulario: ${verbo}`;

  if (lesson.related_words) {
    content.appendChild(createRelatedWordsCard(lesson.related_words));
  }

  for (const timeGroup of lesson.time_groups ?? []) {
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
    content.appendChild(group);
  }
}

// conjugaciones.html
const pronombres = [
  ["1s", "Yo"], 
  ["2s", "Tú"], 
  ["3s", "Él/Ella/Usted"], 
  ["1p", "Nosotros"], 
  ["2p", "Ustedes"],
  ["3p", "Ellos/Ellas"]
]

const nombresConjugaciones = {
  // Indicativo
  "presente": "Presente",
  "presente_progresivo": "Presente Progresivo",
  "pretérito_perfecto_simple": "Pretérito",
  "pretérito_perfecto_compuesto": "Pretérito Perfecto",
  "pretérito_imperfecto": "Imperfecto",
  "futuro_simple": "Futuro",

  // Condicional
  "simple": "Condicional",

  // Subjuntivo
  "pretérito_imperfecto_ra": "Pasado",

  // Imperativo
  "afirmativo": "Positivo",
  "negativo": "Negativo"
};

function createTable(verbo_data, titulo) {
  const newTable = document.createElement("table");
  newTable.classList.add("conjugation-table");

  const caption = document.createElement("caption");
  caption.textContent = nombresConjugaciones[titulo] ?? titulo;
  newTable.appendChild(caption);

  for (const tuple of pronombres) {
      const key = tuple[0];
      const pronombre = tuple[1];

      // Skip pronouns that don't exist for this conjugation
      if (!(key in verbo_data) || verbo_data[key] === null) {
        continue;
      }

      const newRow = document.createElement("tr");

      const newPronombre = document.createElement("th");
      newPronombre.textContent = pronombre;

      const newConjugacion = document.createElement("td");
      newConjugacion.textContent = verbo_data[key];

      newRow.appendChild(newPronombre);
      newRow.appendChild(newConjugacion);
      newTable.appendChild(newRow);
  }

  return newTable;
}

// presente, pasado, futuro, conditional etc
function conjugateGroup(conjugation_type, type_data, required_conjugations) {
  if (required_conjugations.length == 0) {
      return
  }

  const conjugaciones = document.getElementById("conjugaciones");

  const typeHeader = document.createElement("h2");
  typeHeader.classList.add("group-title");
  typeHeader.textContent = conjugation_type
  conjugaciones.appendChild(typeHeader);

  for (const conjugacion of required_conjugations) {
      if (!Object.hasOwn(type_data, conjugacion)) {
          const errorContainer = document.getElementById('error-display');
          errorContainer.innerText = ''; // Clear any previous errors
          try {
              throw new Error("conjugation does not exist"); // internal check
          } catch (error) {
              errorContainer.innerText = `Error: ${error.message}`;
          }
          return
      }
      const Table = createTable(type_data[conjugacion], conjugacion);
      conjugaciones.appendChild(Table);
  }
}


async function conjugarVerbo(){
  const conjugaciones = document.getElementById("conjugaciones");
  if (!conjugaciones) return;
  let verbos_data = await loadJSON("verbos");

  const params = new URLSearchParams(window.location.search);
  const verbo = params.get("verbo");

  // check if verb exists in verbos.json
  if (!Object.hasOwn(verbos_data, verbo)) {
      const errorContainer = document.getElementById('error-display');
      errorContainer.innerText = ''; // Clear any previous errors
      try {
          throw new Error("Choose another verb or try infinitive form");
      } catch (error) {
          errorContainer.innerText = `Error: ${error.message}`;
      }
      return
  }

  //reduce to needed verb
  verbos_data = verbos_data[verbo];

  const config = await loadJSON("verbos_config");
  const traducciones = await loadJSON("traducciones");
  const typo_config = config.typo;

  const verboHeader = document.createElement("h1");
  verboHeader.classList.add("verb-title");

  const translation = traducciones[verbo] ? ` (${traducciones[verbo]})` : "" ;
  verboHeader.textContent = `${verbo}${translation}`;
  conjugaciones.appendChild(verboHeader)

  // Visual order is important below. loop not possible and this 
  // looks better than forcing order through array or something 
  conjugateGroup("presente", verbos_data.indicativo, typo_config.indicativo.presente)
  conjugateGroup("pasado", verbos_data.indicativo, typo_config.indicativo.pasado)
  conjugateGroup("futuro", verbos_data.indicativo, typo_config.indicativo.futuro)

  conjugateGroup("condicional", verbos_data.condicional, typo_config.condicional);
  conjugateGroup("subjuntivo", verbos_data.subjuntivo, typo_config.subjuntivo);
  conjugateGroup("imperativo", verbos_data.imperativo, typo_config.imperativo);

  conjugateGroup("formas_no_personales", verbos_data.formas_no_personales, typo_config.formas_no_personales);
}

conjugarVerbo();
createVerbos();
createVerbosConVocab();
renderVocabularyLesson();

const searchForm = document.getElementById("search-form");

if (searchForm) {
    searchForm.addEventListener("submit", handleSearch);
}

function handleSearch(event) {
    event.preventDefault();

    const searchInput = document.getElementById("mySearch");

    if (!searchInput) return;

    const searchValue = searchInput.value.trim().toLowerCase();

    if (searchValue) {
        window.location.href =
            `./conjugaciones.html?verbo=${encodeURIComponent(searchValue)}`;
    }
}
