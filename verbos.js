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
  const config = await loadJSON("verbos_config");
  const traducciones = await loadJSON("traducciones");

  const verbos = document.getElementById("verbos");
  if (!verbos) return;

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

      const newRow = document.createElement("tr");

      const newPronombre = document.createElement("th");
      newPronombre.textContent = pronombre

      const newConjugacion = document.createElement("td");
      newConjugacion.textContent = verbo_data[key];

      // add to table
      newRow.appendChild(newPronombre);
      newRow.appendChild(newConjugacion);
      newTable.appendChild(newRow)
  }
  return newTable
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
  verboHeader.textContent = `${verbo} (${traducciones[verbo]})`;
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
/*
1
2 Presente Progresivo
3 Pretérito
4 Pretérito Perfecto
5 Imperfecto
6 Futuro
7 Condicional
8 Presente
9 Pasado
10 Positivo
*/