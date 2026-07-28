// ===== IMPORTS =====
// Import utility functions that will help build the page layout and populate it with data
// These are small, reusable functions stored in separate files to keep code organized

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Functions to build page structure
import { readData } from "./utils/read-data.js"; // Fetches data from external source (e.g., JSON file)
import { insertValue } from "./utils/insert-value.js"; // Places values into HTML elements on the page
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js"; // Handles year-related calculations
import { toTitleCase } from "./utils/to-title-case.js"; // Converts text to Title Case format
import { config } from "./config/config.js"; // Configuration settings
import { getMaxEntry } from "./utils/get-max-entry.js"; // Finds the largest value in an object

// ===== MAIN EXECUTION =====
// This runs AFTER the entire HTML page has loaded (DOMContentLoaded event)
// The "async" keyword allows us to use "await" inside this function to pause and wait for data to load
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // These functions insert the header, footer, navigation buttons, and other page elements into the HTML
    await insertHead("Home"); // "await" pauses here until the page head is ready
    insertHeader(); // Adds header to the page
    insertNavButtons(); // Adds navigation buttons
    insertFooter(); // Adds footer to the page

    // ===== POPULATE PAGE WITH DATA =====
    // This section gathers data, extracts the values we need, and places them into homepage cards

    // ----- HEADLINE POPULATION CARD -----
    // Step 1: Fetch the dataset that contains the headline population total
    // pop_totals_data is the code for the population totals dataset
    const [pop_totals_data, pop_totals_meta] = await readData("MYE01T05");
    updateYearSpans(pop_totals_data); // Updates year labels across the page

    // Step 2: Extract the headline figure and display it with commas for readability
    const headline_1 = pop_totals_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Unrounded"]);

    insertValue("headline-1", headline_1.toLocaleString());

    // ----- REASONS FOR CHANGE CARD -----
    // Step 1: Fetch the components of population change dataset
    // This lets us compare natural change and net migration
    const [pop_change_data, pop_change_meta] = await readData("COPC01T01");

    // Step 2: Extract the values we want to compare
    const natural_change = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Natural Change"]);
        
    const net_migration = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Total Net"]);

    const end_population = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["End population"]);

    const starting_population = pop_change_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Starting population"]);

    const total_change = Math.abs(end_population - starting_population);

    // Step 3: Decide which factor contributed more to total change and show the percentage
    let headline_2_reason;
    let headline_2_value;
    if (Math.abs(natural_change) > Math.abs(net_migration)) {
        headline_2_reason = "natural change";
        headline_2_value = ((natural_change / total_change) * 100).toFixed(0);
    } else {
        headline_2_reason = "net migration";
        headline_2_value = ((net_migration / total_change) * 100).toFixed(0);
    }

    insertValue("headline-2-value", headline_2_value);
    insertValue("headline-2-reason", headline_2_reason);

    // ----- NET MIGRATION CARD -----
    // The net migration value is also shown in the third card
    const headline_3 = (((net_migration / 100).toFixed(0)) * 100).toLocaleString();
    insertValue("headline-3", headline_3);

    // ----- MEDIAN AGE CARD -----
    // Fetch the median age dataset and display the latest value
    const [median_age_data, median_age_meta] = await readData("MA01T01");

    const headline_4 = median_age_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["All persons"])

    insertValue("headline-4", headline_4);

    // ----- PEOPLE AGED 85+ CARD -----
    // Fetch the age breakdown dataset and add up all the values for people aged 85 and over
    const [over_85_data, over_85_meta] = await readData("MYE01T025");

    const all_over_85 = Object.entries(
        over_85_data.find(
            row => row["Year"] == latest_year && row["Sex"] == "All persons"
        )
    )
        .filter(([col, value]) => col !== "Year" && typeof value === "number")
        .reduce((sum, [, value]) => sum + value, 0);

    

    // ===== WHY USE A LOOP HERE? =====
    // We need to add together many age-group values, one by one
    // A loop is perfect for this because it repeats the same step automatically
    // Instead of writing each age group separately, we can process them all in a single loop

    const headline_5 = (all_over_85 / headline_1 * 100).toFixed(1);
    insertValue("headline-5", headline_5);

    // ----- FASTEST-GROWING LGD CARD -----
    // Fetch the population totals dataset again so we can compare local government districts
    const [pop_by_lgd_data, pop_by_lgd_meta] = await readData("MYE01T06");

    // ===== WHY USE A LOOP HERE? =====
    // We need to calculate a percentage change for each local authority in turn
    // The loop saves us from writing the same calculation many times by hand
    Object.keys(pop_by_lgd_data).forEach(row => {
        const row_year = pop_by_lgd_data[row]["Year"];
        const row_lgd = pop_by_lgd_data[row]["Local Government District"];
        if (row_year == latest_year) {
            const unrounded_10 = pop_by_lgd_data
                .filter(row => row["Year"] == latest_year - 10 && row["Local Government District"] == row_lgd)
                .map(col => col["Unrounded"]);
            pop_by_lgd_data[row]["10 year growth"] = (pop_by_lgd_data[row].Unrounded - unrounded_10) / unrounded_10 * 100;
        }
    })

    const max_LGD_value = Math.max(
        ...pop_by_lgd_data
            .filter(row => row["Year"] == latest_year && row["Local Government District"] != "Northern Ireland")
            .map(col => col["10 year growth"])
    );

    const headline_6_place = pop_by_lgd_data
        .filter(row => row["Year"] == latest_year && row["10 year growth"] == max_LGD_value)
        .map(col => col["Local Government District"])
    
    const headline_6_value = max_LGD_value.toFixed(0);


    insertValue("headline-6-place", headline_6_place);
    insertValue("headline-6-value", headline_6_value);

});