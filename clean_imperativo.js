const fs = require("fs");

const inputFile = "verbos.json";
const outputFile = "verbos_clean.json";

// Read JSON
const data = JSON.parse(fs.readFileSync(inputFile, "utf8"));

// Go through every verb
for (const verbo in data) {
    const imperativo = data[verbo]?.imperativo;

    if (!imperativo) {
        continue;
    }

    // Remove Él/Ella/Usted and Ellos/Ellas
    for (const tipo of ["afirmativo", "negativo"]) {
        if (imperativo[tipo]) {
            delete imperativo[tipo]["3s"];
            delete imperativo[tipo]["3p"];
        }
    }
}

// Write cleaned JSON
fs.writeFileSync(
    outputFile,
    JSON.stringify(data, null, 2),
    "utf8"
);

console.log(`Done! Cleaned JSON saved to ${outputFile}`);