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
    // MYE01T05 is the code for the population totals dataset
    const MYE01T05 = await readData("MYE01T05");
    const MYE01T05_stat = "Population totals"; // This is the specific statistic within the dataset we want
    updateYearSpans(MYE01T05, MYE01T05_stat); // Updates year labels across the page

    // Step 2: Extract the headline figure and display it with commas for readability
    const headline_1 = (MYE01T05.data[MYE01T05_stat][latest_year]["Rounded"]).toLocaleString();
    insertValue("headline-1", headline_1);

    // ----- REASONS FOR CHANGE CARD -----
    // Step 1: Fetch the components of population change dataset
    // This lets us compare natural change and net migration
    const COPC01T01 = await readData("COPC01T01");
    const COPC01T01_stat = "Components of population change";

    // Step 2: Extract the values we want to compare
    const natural_change = COPC01T01.data[COPC01T01_stat][latest_year]["Natural Change"];
    const net_migration = COPC01T01.data[COPC01T01_stat][latest_year]["Total Net"];
    const total_change = Math.abs(COPC01T01.data[COPC01T01_stat][latest_year]["End population"] - COPC01T01.data[COPC01T01_stat][latest_year]["Starting population"]);

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
    const MA01T01 = await readData("MA01T01");
    const MA01T01_stat = "Median Age";
    const headline_4 = MA01T01.data[MA01T01_stat][latest_year]["All persons"].toFixed(0);

    insertValue("headline-4", headline_4);

    // ----- PEOPLE AGED 85+ CARD -----
    // Fetch the age breakdown dataset and add up all the values for people aged 85 and over
    const MYE01T025 = await readData("MYE01T025");
    const MYE01T025_stat = "Mid-year population estimate";

    let all_over_85 = 0;

    // ===== WHY USE A LOOP HERE? =====
    // We need to add together many age-group values, one by one
    // A loop is perfect for this because it repeats the same step automatically
    // Instead of writing each age group separately, we can process them all in a single loop
    const over_85_ages = Object.keys(MYE01T025.data[MYE01T025_stat][latest_year]["All persons"]);

    for (let i = 0; i < over_85_ages.length; i++) {
        all_over_85 += MYE01T025.data[MYE01T025_stat][latest_year]["All persons"][over_85_ages[i]];
    }

    const headline_5 = (all_over_85 / MYE01T05.data[MYE01T05_stat][latest_year]["Unrounded"] * 100).toFixed(1);
    insertValue("headline-5", headline_5);

    // ----- FASTEST-GROWING LGD CARD -----
    // Fetch the population totals dataset again so we can compare local government districts
    const MYE01T06 = await readData("MYE01T06");
    const MYE01T06_stat = "Population totals";

    // Ignore Northern Ireland so the comparison only covers local government districts
    const LGDs = Object.keys(MYE01T06.data[MYE01T06_stat][latest_year])
        .filter(x => x !== "Northern Ireland");

    let LGD_change = {};

    // ===== WHY USE A LOOP HERE? =====
    // We need to calculate a percentage change for each local authority in turn
    // The loop saves us from writing the same calculation many times by hand
    for (let i = 0; i < LGDs.length; i++) {
        const LGD = LGDs[i];
        const latest_pop = MYE01T06.data[MYE01T06_stat][latest_year][LGD]["Unrounded"];
        const last_pop = MYE01T06.data[MYE01T06_stat][latest_year - 10][LGD]["Unrounded"];
        LGD_change[LGD] = (latest_pop - last_pop) / last_pop * 100;
    }

    // Find the district with the largest percentage increase
    const max_LGD = getMaxEntry(LGD_change);
    const headline_6_value = max_LGD.value.toFixed(0);
    const headline_6_place = max_LGD.key;

    insertValue("headline-6-place", headline_6_place);
    insertValue("headline-6-value", headline_6_value);

});