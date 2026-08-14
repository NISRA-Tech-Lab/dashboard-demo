export let years;
export let first_year;
export let latest_year;
export let last_year;

// ===== UPDATE THE AVAILABLE YEARS =====
//
// Extract the available years from the dataset and update the year values
// displayed throughout the page.
//
// The function determines:
//
//   • every available year
//   • the first (earliest) year
//   • the latest (most recent) year
//   • the year immediately before the latest
//
// These values are stored in the exported variables at the top of this file so
// they can be reused by other modules.
//
// DATA STRUCTURE
//
// data
//   An array of row objects, usually created by Papa Parse from a CSV file.
//
//   This is broadly comparable to an R data frame:
//
//     • the array is similar to the complete data frame
//     • each object is similar to one row
//     • each object property is similar to one column
//
//   Each row is expected to contain a Year column.
//
//   If the optional stat parameter is supplied, the data should also contain a
//   Statistic column.
//
// PARAMETERS
//
// data
//   The CSV rows from which the available years should be extracted.
//
// meta
//   The json metadata for the CSV file, which contains information about the columns.
//
//
// EXPORTED VALUES
//
// After the function runs, the following exported variables are updated:
//
//   years
//     An array containing each unique year in ascending order.
//
//   first_year
//     The earliest available year.
//
//   latest_year
//     The most recent available year.
//
//   last_year
//     The year immediately before latest_year.
//
// PAGE UPDATES
//
// The function replaces the text inside every element with the following
// classes:
//
//   first-year
//     Displays the earliest year.
//
//   latest-year
//     Displays the most recent year.
//
//   last-year
//     Displays the previous year.
//
// RETURNS
//
// This function does not explicitly return a value.
//
// SIDE EFFECTS
//
// The function:
//
//   • sorts the available years
//   • updates the exported year variables
//   • replaces the text of matching HTML elements
export function updateYearSpans(data, meta) {

    const year_column = meta.variables
    .filter(x => x["code"].includes("TLIST"))
    .map(x => x["name"])[0];

    // ===== EXTRACT THE AVAILABLE YEARS =====
    const all_years = data
        .sort((a, b) => a[year_column] - b[year_column])
        .map(row => row[year_column]);

    years = [...new Set(all_years)];

    first_year = years[0];
    latest_year = years[years.length - 1];
    last_year = years[years.length - 2];

    // ===== UPDATE THE PAGE =====
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