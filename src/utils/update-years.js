export let years;
export let first_year;
export let latest_year;
export let last_year;

export function updateYearSpans(data, stat = null) {

    let filteredData = data;

    if (stat !== null) {
        filteredData = data.filter(row => row["Statistic"] === stat);
    }

    years = filteredData
        .sort((a, b) => a.Year - b.Year)
        .map(row => row.Year);
    
    first_year = years[0];
    latest_year = years[years.length - 1];
    last_year = years[years.length - 2];

    const first_year_spans = document.getElementsByClassName("first-year");
    for (let i = 0; i < first_year_spans.length; i ++) {
        first_year_spans[i].textContent = first_year;
    }

    const year_spans = document.getElementsByClassName("latest-year");
    for (let i = 0; i < year_spans.length; i ++) {
        year_spans[i].textContent = latest_year;
    }

    const last_year_spans = document.getElementsByClassName("last-year");
    for (let i = 0; i < last_year_spans.length; i ++) {
        last_year_spans[i].textContent = last_year;
    }
}