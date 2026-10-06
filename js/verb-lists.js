import { renderVerbList } from "./shared.js";

export function initializeVerbListPage() {
  renderVerbList(
    document.getElementById("verbos"),
    "verbos_config",
    "conjugaciones.html"
  );
}

export function initializeVocabularyMenu() {
  renderVerbList(
    document.getElementById("vocabulario"),
    "vocab_config",
    "vocab.html"
  );
}
