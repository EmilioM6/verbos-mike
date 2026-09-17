const searchForm = document.getElementById("search-form");

searchForm.addEventListener("submit", handleSearch);

function handleSearch(event) {
    event.preventDefault();

    const searchValue = document.getElementById("mySearch").value.trim();

    if (searchValue) {
        window.location.href = `conjugaciones.html?verbo=${encodeURIComponent(searchValue)}`;
    }
}