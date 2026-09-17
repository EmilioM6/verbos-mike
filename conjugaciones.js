const pronombres = [
    ["1s", "Yo"], 
    ["2s", "Tú"], 
    ["3s", "Él/Ella/Usted"], 
    ["1p", "Nosotros"], 
    ["2p", "Ustedes"],
    ["3p", "Ellos/Ellas"]
]

// const order = 

async function loadJSON(nombre_json) {
    try {
      const response = await fetch(`./${nombre_json}.json`);
      const data = await response.json(); // Parses JSON to a JavaScript object
      return data;
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
}

function createTable(verbo_data) {
    const newTable = document.createElement("table");
    for (const tuple of pronombres) {
        const key = tuple[0];
        const pronombre = tuple[1];

        const newRow = document.createElement("tr");

        const newPronombre = document.createElement("th");
        newPronombre.textContent = pronombre

        const newConjugacion = document.createElement("th");
        newConjugacion.textContent = verbo_data[key];

        // add to table

        newRow.appendChild(newPronombre);
        newRow.appendChild(newConjugacion);
        newTable.appendChild(newRow)
    }
    return newTable
}

// presente, pasado, futuro, conditional etc
function ConjugateGroup(conjugation_type, type_data, required_conjugations) {
    if (required_conjugations.length == 0) {
        return
    }

    const conjugaciones = document.getElementById("conjugaciones");

    const typeHeader = document.createElement("h2");
    typeHeader.textContent = conjugation_type
    conjugaciones.appendChild(typeHeader);

    for (const conjugacion of required_conjugations) {
        const ConjugacionHeader = document.createElement("h3");
        ConjugacionHeader.textContent = conjugacion
        conjugaciones.appendChild(ConjugacionHeader);
        if (!Object.hasOwn(type_data, conjugacion)) {
            const errorContainer = document.getElementById('error-display');
            errorContainer.innerText = ''; // Clear any previous errors
            try {
                throw new Error("conjugation does not exist in database"); // internal check
            } catch (error) {
                errorContainer.innerText = `Error: ${error.message}`;
            }
            return
        }
        const Table = createTable(type_data[conjugacion]);
        conjugaciones.appendChild(Table);
    }
}


async function conjugar_verbo(){
    let verbos_data = await loadJSON("verbos");

    const params = new URLSearchParams(window.location.search);
    const verbo = params.get("verbo");

    // check if verb exists in verbos.json
    if (!Object.hasOwn(verbos_data, verbo)) {
        const errorContainer = document.getElementById('error-display');
        errorContainer.innerText = ''; // Clear any previous errors
        try {
            throw new Error("verb does not exist in database");
        } catch (error) {
            errorContainer.innerText = `Error: ${error.message}`;
        }
        return
    }

    //reduce to needed verb
    verbos_data = verbos_data[verbo];

    const config = await loadJSON("verbos_config");
    const typo_config = config.typo;

    const conjugaciones = document.getElementById("conjugaciones");
    const verboHeader = document.createElement("h1");
    verboHeader.textContent = verbo;
    conjugaciones.appendChild(verboHeader)

    // Visual order is important below. loop not possible and this 
    // looks better than forcing order through array or something 
    ConjugateGroup("presente", verbos_data.indicativo, typo_config.indicativo.presente)
    ConjugateGroup("pasado", verbos_data.indicativo, typo_config.indicativo.pasado)
    ConjugateGroup("futuro", verbos_data.indicativo, typo_config.indicativo.futuro)

    ConjugateGroup("condicional", verbos_data.condicional, typo_config.condicional);
    ConjugateGroup("subjuntivo", verbos_data.subjuntivo, typo_config.subjuntivo);
    ConjugateGroup("imperativo", verbos_data.imperativo, typo_config.imperativo);

    ConjugateGroup("formas_no_personales", verbos_data.formas_no_personales, typo_config.formas_no_personales);
}

conjugar_verbo();