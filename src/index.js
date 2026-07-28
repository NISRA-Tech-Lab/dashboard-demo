// ===== IMPORTS =====
// Import the utility functions used to build the page and populate it with data
// Keeping these functions in separate files makes the main script easier to read and maintain

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions that build the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a matrix CSV and its associated metadata
import { insertValue } from "./utils/insert-value.js"; // Inserts a value into a specified HTML element
import { latest_year, updateYearSpans } from "./utils/update-years.js"; // Utilities for working with the available years

// ===== MAIN EXECUTION =====
// This function runs once the initial HTML document has finished loading
// Declaring the function as "async" allows us to use "await" while external data is loaded
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // Insert the elements that are shared across pages, including the document head,
    // header, navigation buttons, and footer
    await insertHead("Home"); // Wait until the page head has been prepared before continuing
    insertHeader(); // Adds the page header
    insertNavButtons(); // Adds the navigation buttons
    insertFooter(); // Adds the page footer

    // ===== POPULATE PAGE WITH DATA =====
    // Each matrix is now stored as a CSV file rather than as a deeply nested JSON object
    //
    // readData() returns an array containing:
    //   1. The CSV data as an array of row objects
    //   2. The matrix metadata stored in data.json
    //
    // Array methods such as filter(), map(), find(), and reduce() are then used to work
    // with the data in a pipeline similar to filtering, selecting, and summarising a
    // data frame in R

    // ----- HEADLINE POPULATION CARD -----
    // Step 1: Load the population totals matrix
    //
    // Array destructuring gives the two values returned by readData() meaningful names:
    //   pop_totals_data contains the rows from MYE01T05.csv
    //   pop_totals_meta contains the matrix metadata from data.json
    const [pop_totals_data, pop_totals_meta] = await readData("MYE01T05");

    // Use the years available in the population totals data to update year references
    // displayed throughout the page
    updateYearSpans(pop_totals_data);

    // Step 2: Filter the data frame to the latest year
    //
    // This pipeline is similar to:
    //   filter(Year == latest_year) |>
    //   pull(Unrounded)
    //
    // filter() keeps the matching row and map() extracts its Unrounded value
    const headline_1 = pop_totals_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Unrounded"]);

    // Format the population total with thousands separators before inserting it
    // into the first homepage card
    insertValue("headline-1", headline_1.toLocaleString());

    // ----- REASONS FOR CHANGE CARD -----
    // Step 1: Load the components of population change matrix
    //
    // This matrix contains the values needed to compare natural change with
    // net migration
    const [pop_change_data, pop_change_meta] = await readData("COPC01T01");

    // Step 2: Extract each required value for the latest year
    //
    // Each pipeline first filters the rows to the latest year and then selects
    // the relevant value column

    // Natural change is the difference between births and deaths
    const natural_change = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Natural Change"]);

    // Total net migration is the balance of people moving into and out of the area
    const net_migration = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Total Net"]);

    // Population recorded at the end of the period
    const end_population = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["End population"]);

    // Population recorded at the beginning of the period
    const starting_population = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Starting population"]);

    // Calculate the absolute amount of population change during the period
    //
    // Math.abs() ensures that the size of the change is positive, regardless of
    // whether the population increased or decreased
    const total_change = Math.abs(end_population - starting_population);

    // Step 3: Identify which component made the larger contribution
    //
    // Absolute values are used for the comparison so that a large negative
    // contribution is not treated as smaller merely because it has a minus sign
    let headline_2_reason;
    let headline_2_value;

    if (Math.abs(natural_change) > Math.abs(net_migration)) {
        headline_2_reason = "natural change";

        // Express natural change as a percentage of the total population change
        // and round the result to the nearest whole number
        headline_2_value = ((natural_change / total_change) * 100).toFixed(0);
    } else {
        headline_2_reason = "net migration";

        // Express net migration as a percentage of the total population change
        // and round the result to the nearest whole number
        headline_2_value = ((net_migration / total_change) * 100).toFixed(0);
    }

    // Insert both parts of the result into the reasons-for-change card
    insertValue("headline-2-value", headline_2_value);
    insertValue("headline-2-reason", headline_2_reason);

    // ----- NET MIGRATION CARD -----
    // Reuse the latest net migration figure extracted above
    //
    // Divide by 100, round to the nearest whole number, and multiply by 100
    // to round the result to the nearest hundred
    const headline_3 = (((net_migration / 100).toFixed(0)) * 100).toLocaleString();

    insertValue("headline-3", headline_3);

    // ----- MEDIAN AGE CARD -----
    // Step 1: Load the median age matrix
    const [median_age_data, median_age_meta] = await readData("MA01T01");

    // Step 2: Filter the data to the latest year and extract the value for all persons
    //
    // This follows the same data-frame-style filter-and-select pattern used above
    const headline_4 = median_age_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["All persons"]);

    insertValue("headline-4", headline_4);

    // ----- PEOPLE AGED 85+ CARD -----
    // Step 1: Load the population-by-age matrix
    const [over_85_data, over_85_meta] = await readData("MYE01T025");

    // Step 2: Find the row representing all persons in the latest year
    //
    // find() returns the first row that satisfies both conditions:
    //   the Year is the latest available year
    //   the Sex category is "All persons"
    //
    // The wide CSV stores individual ages as separate columns, so the selected
    // row contains identifiers such as Year and Sex followed by numeric age values
    const all_over_85 = Object.entries(
        over_85_data.find(
            row => row["Year"] == latest_year && row["Sex"] == "All persons"
        )
    )
        // Convert the selected row into [column name, value] pairs
        //
        // Remove the Year identifier and retain only entries whose values are numeric
        // This excludes text-based identifier columns such as Sex
        .filter(([col, value]) => col !== "Year" && typeof value === "number")

        // Add together the remaining numeric age columns
        //
        // reduce() performs a summarising operation similar to:
        //   summarise(total = sum(value))
        //
        // The accumulator named "sum" starts at zero and is increased by each value
        .reduce((sum, [, value]) => sum + value, 0);

    // Step 3: Calculate the percentage of the total population aged 85 and over
    //
    // Divide the summed age values by the headline population total, multiply by
    // 100, and retain one decimal place
    const headline_5 = (all_over_85 / headline_1 * 100).toFixed(1);

    insertValue("headline-5", headline_5);

    // ----- FASTEST-GROWING LGD CARD -----
    // Step 1: Load the population totals by local government district
    const [pop_by_lgd_data, pop_by_lgd_meta] = await readData("MYE01T06");

    // Step 2: Add a calculated "10 year growth" field to each latest-year row
    //
    // The CSV data is an array of row objects, similar to a data frame where each
    // object is a row and each object property is a column
    //
    // forEach() visits each row in turn. For rows belonging to the latest year,
    // the corresponding population from ten years earlier is found and used to
    // calculate percentage growth
    Object.keys(pop_by_lgd_data).forEach(row => {

        // Read the year and district from the current row
        const row_year = pop_by_lgd_data[row]["Year"];
        const row_lgd = pop_by_lgd_data[row]["Local Government District"];

        // The growth calculation is only required for latest-year rows
        if (row_year == latest_year) {

            // Find the row for the same district ten years earlier and extract
            // its unrounded population value
            const unrounded_10 = pop_by_lgd_data
                .filter(row =>
                    row["Year"] == latest_year - 10 &&
                    row["Local Government District"] == row_lgd
                )
                .map(col => col["Unrounded"]);

            // Calculate percentage growth:
            //   (latest population - earlier population) / earlier population × 100
            //
            // Store the result as a new column on the current row
            pop_by_lgd_data[row]["10 year growth"] =
                (pop_by_lgd_data[row].Unrounded - unrounded_10) /
                unrounded_10 *
                100;
        }
    });

    // Step 3: Find the largest ten-year growth value
    //
    // First filter the data to:
    //   latest-year rows only
    //   local government districts only, excluding the Northern Ireland total
    //
    // map() then extracts the calculated growth column, and Math.max() identifies
    // the largest value
    const max_LGD_value = Math.max(
        ...pop_by_lgd_data
            .filter(row =>
                row["Year"] == latest_year &&
                row["Local Government District"] != "Northern Ireland"
            )
            .map(col => col["10 year growth"])
    );

    // Step 4: Find the district associated with the maximum growth value
    //
    // Filter the latest-year rows to the one whose calculated growth equals the
    // maximum, then extract its local government district name
    const headline_6_place = pop_by_lgd_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["10 year growth"] == max_LGD_value
        )
        .map(col => col["Local Government District"]);

    // Round the growth percentage to the nearest whole number for display
    const headline_6_value = max_LGD_value.toFixed(0);

    insertValue("headline-6-place", headline_6_place);
    insertValue("headline-6-value", headline_6_value);

});