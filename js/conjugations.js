import { configContainsVerb, createVerbPageLink, loadConfig, loadJSON, showMessage } from "./shared.js";

const pronouns = [
  ["1s", "Yo"],
  ["2s", "Tú"],
  ["3s", "Él/Ella/Usted"],
  ["1p", "Nosotros"],
  ["2p", "Ustedes"],
  ["3p", "Ellos/Ellas"]
];

const conjugationNames = {
  presente: "Presente",
  presente_progresivo: "Presente Progresivo",
  pretérito_perfecto_simple: "Pretérito",
  pretérito_perfecto_compuesto: "Pretérito Perfecto",
  pretérito_imperfecto: "Imperfecto",
  futuro_simple: "Futuro",
  simple: "Condicional",
  pretérito_imperfecto_ra: "Pasado",
  afirmativo: "Positivo",
  negativo: "Negativo"
};

function createConjugationTable(data, title) {
  const table = document.createElement("table");
  table.classList.add("conjugation-table");

  const caption = document.createElement("caption");
  caption.textContent = conjugationNames[title] ?? title;
  table.appendChild(caption);

  for (const [key, pronoun] of pronouns) {
    if (!Object.hasOwn(data, key) || data[key] === null) continue;

    const row = document.createElement("tr");
    const pronounCell = document.createElement("th");
    pronounCell.scope = "row";
    pronounCell.textContent = pronoun;
    const conjugationCell = document.createElement("td");
    conjugationCell.textContent = data[key];
    row.append(pronounCell, conjugationCell);
    table.appendChild(row);
  }

  return table;
}

function renderConjugationGroup(container, label, typeData, names) {
  if (!Array.isArray(names)) {
    throw new Error(`Conjugation settings for “${label}” are missing.`);
  }
  if (names.length === 0) return;

  const heading = document.createElement("h2");
  heading.classList.add("group-title");
  heading.textContent = label;
  container.appendChild(heading);

  for (const name of names) {
    const conjugation = typeData?.[name];
    if (!conjugation || typeof conjugation !== "object") {
      throw new Error(`Conjugation “${name}” is missing from the verb data.`);
    }
    container.appendChild(createConjugationTable(conjugation, name));
  }
}

export async function initializeConjugationsPage() {
  const container = document.getElementById("conjugaciones");
  if (!container) return;

  const error = document.getElementById("error-display");
  try {
    const [verbs, config, translations, vocabularyConfig] = await Promise.all([
      loadJSON("verbos"),
      loadConfig("verbos_config"),
      loadJSON("traducciones"),
      loadConfig("vocab_config").catch(() => null)
    ]);
    const verb = new URLSearchParams(window.location.search).get("verbo")?.trim().toLowerCase();

    if (!verb || !verbs || !Object.hasOwn(verbs, verb)) {
      throw new Error("Choose another verb or try its infinitive form.");
    }

    const data = verbs[verb];
    const typo = config.typo;
    if (!typo) throw new Error("Conjugation settings could not be loaded.");

    const title = document.createElement("h1");
    title.classList.add("verb-title");
    const translation = translations[verb] ? ` (${translations[verb]})` : "";
    title.textContent = `${verb}${translation}`;
    const titleRow = document.createElement("div");
    titleRow.classList.add("verb-page-heading");
    titleRow.appendChild(title);
    if (configContainsVerb(vocabularyConfig, verb)) {
      titleRow.appendChild(createVerbPageLink("vocab.html", "Go to Vocabulary", verb));
    }
    container.appendChild(titleRow);
    document.title = `Conjugaciones: ${verb}`;

    renderConjugationGroup(container, "presente", data.indicativo, typo.indicativo?.presente);
    renderConjugationGroup(container, "pasado", data.indicativo, typo.indicativo?.pasado);
    renderConjugationGroup(container, "futuro", data.indicativo, typo.indicativo?.futuro);
    renderConjugationGroup(container, "condicional", data.condicional, typo.condicional);
    renderConjugationGroup(container, "subjuntivo", data.subjuntivo, typo.subjuntivo);
    renderConjugationGroup(container, "imperativo", data.imperativo, typo.imperativo);
    renderConjugationGroup(container, "formas_no_personales", data.formas_no_personales, typo.formas_no_personales);
  } catch (cause) {
    showMessage(error, `Error: ${cause.message}`);
  }
}
