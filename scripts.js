async function loadJSON(nombre_json) {
    try {
      const response = await fetch(`./${nombre_json}.json`);
      const data = await response.json(); // Parses JSON to a JavaScript object
      return data;
    } catch (error) {
      console.error('Error loading JSON:', error);
    }
}

async function createVerbos(){
    const config = await loadJSON("verbos_config");
    
    const verbos = document.getElementById("verbos");

    // handle each ending
    const endings = config.terminaciones;
    const newDiv = document.createElement("div");

    for (const ending in endings) {
        const newHeader = document.createElement("h2");
        newHeader.textContent = `Verbos con "${ending}"`;
        newDiv.appendChild(newHeader);

        // each verb selected for the ending
        for (const verbo of endings[ending]) {
            console.log(verbo);
            const newA = document.createElement("a");

            newA.href = "conjugaciones.html";
            newA.textContent = verbo;
            newA.style.display = "block";

            newDiv.appendChild(newA);
        }
    }
    verbos.appendChild(newDiv);
}

createVerbos()