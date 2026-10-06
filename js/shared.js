export async function loadJSON(name) {
  const response = await fetch(`./${name}.json`);
  if (!response.ok) {
    throw new Error(`Could not load ${name}.json (${response.status}).`);
  }
  return response.json();
}

export function showMessage(container, message, className = "error-message") {
  if (!container) return;
  container.textContent = message;
  container.classList.add(className);
}

export async function renderVerbList(container, configName, destination) {
  if (!container) return;

  try {
    const [config, translations] = await Promise.all([
      loadJSON(configName),
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
