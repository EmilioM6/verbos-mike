async function fetchJSON(folder, name) {
  const response = await fetch(`./${folder}/${name}.json`);
  if (!response.ok) {
    throw new Error(`Could not load ${folder}/${name}.json (${response.status}).`);
  }
  return response.json();
}

export function loadJSON(name) {
  return fetchJSON("data", name);
}

export function loadConfig(name) {
  return fetchJSON("config", name);
}

export function showMessage(container, message, className = "error-message") {
  if (!container) return;
  container.textContent = message;
  container.classList.add(className);
}

export function createVerbPageLink(destination, label, verb) {
  const link = document.createElement("a");
  link.classList.add("verb-page-switch");
  link.href = `${destination}?verbo=${encodeURIComponent(verb)}`;
  link.textContent = label;
  return link;
}

export function configContainsVerb(config, verb) {
  return Object.values(config?.terminaciones ?? {})
    .some((verbs) => Array.isArray(verbs) && verbs.includes(verb));
}

export async function renderVerbList(container, configName, destination) {
  if (!container) return;

  try {
    const [config, translations] = await Promise.all([
      loadConfig(configName),
      loadJSON("traducciones")
    ]);
    const list = document.createElement("div");
    list.classList.add("verb-list");

    for (const [ending, verbs] of Object.entries(config.terminaciones ?? {})) {
      const group = document.createElement("section");
      group.classList.add("verb-group");

      const heading = document.createElement("h2");
      heading.textContent = `Verbos con "${ending}"`;

      const links = document.createElement("div");
      links.classList.add("verb-grid");

      for (const verb of verbs) {
        const link = document.createElement("a");
        link.classList.add("verb-link");
        link.href = `${destination}?verbo=${encodeURIComponent(verb)}`;

        const name = document.createElement("span");
        name.classList.add("verb-name");
        name.textContent = verb;

        const translation = document.createElement("span");
        translation.classList.add("verb-translation");
        translation.textContent = translations[verb] ?? "";

        link.append(name, translation);
        links.appendChild(link);
      }

      group.append(heading, links);
      list.appendChild(group);
    }

    container.replaceChildren(list);
  } catch (error) {
    showMessage(container, error.message);
  }
}

export function appendFormattedText(parent, parts = []) {
  for (const part of parts) {
    if (typeof part === "string") {
      parent.appendChild(document.createTextNode(part));
      continue;
    }

    if (!part || typeof part !== "object") continue;
    const tagName = Object.hasOwn(part, "em")
      ? "em"
      : Object.hasOwn(part, "strong")
        ? "strong"
        : null;
    if (!tagName) continue;

    const element = document.createElement(tagName);
    element.textContent = part[tagName];
    parent.appendChild(element);
  }
}

export function initializeSearch() {
  const form = document.getElementById("search-form");
  const input = document.getElementById("mySearch");
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const verb = input.value.trim().toLowerCase();
    if (verb) {
      window.location.href = `./conjugaciones.html?verbo=${encodeURIComponent(verb)}`;
    }
  });
}
