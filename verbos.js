import { initializeSearch } from "./js/shared.js";

async function initializePage() {
  initializeSearch();

  if (document.getElementById("verbos")) {
    const page = await import("./js/verb-lists.js");
    page.initializeVerbListPage();
  } else if (document.getElementById("vocabulario")) {
    const page = await import("./js/verb-lists.js");
    page.initializeVocabularyMenu();
  } else if (document.getElementById("conjugaciones")) {
    const page = await import("./js/conjugations.js");
    page.initializeConjugationsPage();
  } else if (document.getElementById("vocab-lesson-content")) {
    const page = await import("./js/vocabulary.js");
    page.initializeVocabularyPage();
  }
}

initializePage();
