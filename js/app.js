import { initializeSearch } from "./shared.js";

async function initializePage() {
  initializeSearch();

  if (document.getElementById("verbos")) {
    const page = await import("./verb-lists.js");
    page.initializeVerbListPage();
  } else if (document.getElementById("vocabulario")) {
    const page = await import("./verb-lists.js");
    page.initializeVocabularyMenu();
  } else if (document.getElementById("conjugaciones")) {
    const page = await import("./conjugations.js");
    page.initializeConjugationsPage();
  } else if (document.getElementById("vocab-lesson-content")) {
    const page = await import("./vocabulary.js");
    page.initializeVocabularyPage();
  }
}

initializePage();
