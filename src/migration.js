// ===== IMPORTS =====
// Import the utility functions used to build the page, load datasets,
// create charts, and insert values into the HTML
//
// Keeping these functions in separate modules makes this script easier to read
// and allows the same functionality to be reused across other pages

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a matrix CSV together with its associated metadata
import { insertValue } from "./utils/insert-value.js"; // Inserts a value into a specified HTML element
import { latest_year, updateYearSpans, last_year } from "./utils/update-years.js"; // Provides and updates year-related values
import { lineChart } from "./charts/line-chart.js"; // Creates a line chart
import { barChart } from "./charts/bar-chart.js"; // Creates vertical or horizontal bar charts
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds controls for expanding chart sections
import { downloadButton } from "./utils/download-button.js"; // Adds buttons for downloading the underlying data
import { dateFormat } from "./utils/date-format.js"; // Formats dataset update dates for display
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates expandable information boxes

// ===== MAIN EXECUTION =====
// This function runs after the initial HTML document has finished loading
//
// Declaring the function as "async" allows await to be used while datasets
// and shared page components are loaded
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // Insert the shared elements used across the website, including the page head,
    // header, navigation buttons, footer, and chart expansion controls
    await insertHead("Migration"); // Wait until the document head has been prepared
    insertHeader(); // Adds the page header
    insertNavButtons(); // Adds the navigation buttons
    insertFooter(); // Adds the page footer
    insertExpandButtons(); // Adds controls for opening expanded chart views

    // ===== POPULATE PAGE WITH DATA =====
    // Each matrix is now stored in two parts:
    //
    //   1. A CSV file containing observations as rows and columns
    //   2. An entry in data.json containing metadata such as the matrix label,
    //      update date, subject code, and product code
    //
    // readData() returns both parts as a two-item array. Array destructuring is
    // used below to give the CSV rows and metadata meaningful names.
    //
    // The CSV data is represented as an array of row objects. This is similar
    // to working with a data frame in R:
    //
    //   JavaScript array       R data frame
    //   ----------------       ------------
    //   one object             one row
    //   one object property    one column
    //   array of objects       complete data frame
    //
    // JavaScript array methods can therefore be chained together in a pipeline
    // resembling common dplyr operations:
    //
    //   filter()    resembles filter()
    //   map()       resembles pull(), select(), or transmute()
    //   Math.max()  resembles max()
    //   Math.min()  resembles min()

    // ----- NET MIGRATION CARD -----
    // Step 1: Load the net migration matrix
    //
    // MIG01T02.csv contains the observation rows, while the MIG01T02 entry in
    // data.json contains the associated metadata
    const [migration_data, migration_meta] = await readData("MIG01T02");

    // Read the available years from the CSV rows and update year references
    // displayed throughout the page
    updateYearSpans(migration_data);

    // Format the matrix update date stored separately in the metadata
    const migration_updated = dateFormat(migration_meta.updated);

    // Step 2: Select total net migration for the latest year
    //
    // Three conditions identify the summary row required for the card:
    //
    //   Year equals the latest available year
    //   Broad age band equals "All"
    //   Sex equals "All persons"
    //
    // map() then extracts the Total Net column from the matching row
    //
    // This is similar to:
    //
    //   migration_data |>
    //     filter(
    //       Year == latest_year,
    //       `Broad age band (7 cat)` == "All",
    //       Sex == "All persons"
    //     ) |>
    //     pull(`Total Net`)
    const pop_change_value = migration_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (7 cat)"] == "All" &&
            row["Sex"] == "All persons"
        )
        .map(col => col["Total Net"]);

    // Format the net migration value with an explicit sign
    //
    // Positive values receive a plus sign, negative values receive a minus sign,
    // and zero is displayed without either sign
    const pop_change =
        pop_change_value > 0
            ? `+ ${pop_change_value.toLocaleString()}`
            : pop_change_value < 0
                ? `- ${Math.abs(pop_change_value).toLocaleString()}`
                : `${pop_change_value}`;

    // Insert the formatted value into the net migration card
    insertValue("pop-change", pop_change.toLocaleString());

    // ----- ANNUAL PERCENTAGE CHANGE CARD -----
    // Select the same summary measure for the preceding year
    const pop_change_last = migration_data
        .filter(row =>
            row["Year"] == last_year &&
            row["Broad age band (7 cat)"] == "All" &&
            row["Sex"] == "All persons"
        )
        .map(col => col["Total Net"]);

    // Calculate the percentage change between the previous and latest values
    //
    // Math.abs(pop_change_last) is used in the denominator so that the percentage
    // is measured against the size of the preceding value even when it is negative
    const pop_change_pct_value =
        ((pop_change_value - pop_change_last) /
            Math.abs(pop_change_last)) *
        100;

    // Format the result with an explicit sign and no decimal places
    const pop_change_pct =
        pop_change_pct_value > 0
            ? `+ ${pop_change_pct_value.toFixed(0)}`
            : pop_change_pct_value < 0
                ? `- ${Math.abs(pop_change_pct_value).toFixed(0)}`
                : `${pop_change_pct_value.toFixed(0)}`;

    insertValue("pop-change-pct", pop_change_pct);

    // ----- LARGEST NET GAIN AND LOSS CARDS -----
    // Filter the migration data to age-specific summary rows for the latest year
    //
    // The "All" age row is removed because the cards should compare individual
    // age bands rather than the overall total
    //
    // Sex is restricted to "All persons" so each age band has one combined value
    const age_group_data = migration_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Sex"] == "All persons" &&
            row["Broad age band (7 cat)"] != "All"
        );

    // Pull the Total Net column into a simple numeric array
    //
    // This is similar to:
    //
    //   age_group_data |>
    //     pull(`Total Net`)
    const net_values = age_group_data
        .map(col => col["Total Net"]);

    // Find the largest and smallest net migration values across the age bands
    const max_net = Math.max(...net_values);
    const min_net = Math.min(...net_values);

    // Filter to the row containing the largest value and extract its age-band label
    const max_age = age_group_data
        .filter(row => row["Total Net"] == max_net)
        .map(col => col["Broad age band (7 cat)"]);

    // Filter to the row containing the smallest value and extract its age-band label
    const min_age = age_group_data
        .filter(row => row["Total Net"] == min_net)
        .map(col => col["Broad age band (7 cat)"]);

    insertValue("gain-age", max_age);
    insertValue("loss-age", min_age);

    // ----- INWARD MIGRATION FROM OUTSIDE THE UK CARD -----
    // Load the migration-flows matrix
    //
    // MIG01T03 contains migration flows involving the United Kingdom and the
    // rest of the world
    const [migration_flows_data, migration_flows_meta] =
        await readData("MIG01T03");

    // Format the update date stored in the matrix metadata
    const migration_flows_updated =
        dateFormat(migration_flows_meta.updated);

    // Filter the rows to the latest year and extract Rest of World Inflows
    //
    // Because MIG01T03 contains one row per year, only the Year condition is
    // required here
    const row_inflows = migration_flows_data
        .filter(row => row["Year"] == latest_year)
        .map(col => col["Rest of World Inflows"]);

    insertValue("outside-uk", row_inflows.toLocaleString());

    // ===== BAR CHART: NET MIGRATION BY AGE AND SEX =====
    // Prepare the age-by-sex data used by the horizontal bar chart

    // Filter the net migration matrix to:
    //
    //   the latest year
    //   individual age bands rather than the "All" summary row
    //   individual sex categories rather than "All persons"
    //
    // The resulting rows are already in a tidy, long-style structure:
    //
    //   Year | Broad age band | Sex | Total Net
    //
    // This is similar to a filtered tibble that can be passed directly to a
    // plotting function without manually constructing separate arrays
    const migration_chart_data = migration_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (7 cat)"] != "All" &&
            row["Sex"] != "All persons"
        );

    // Draw the standard horizontal bar chart
    //
    // value identifies the numeric column to plot
    // bars identifies the column used to create separate male and female series
    // categories identifies the age-band labels
    // align tells barChart() to draw the bars horizontally
    barChart({
        data: migration_chart_data,
        value: "Total Net",
        bars: "Sex",
        categories: "Broad age band (7 cat)",
        canvas_id: "migration-bar",
        label_format: ",",
        align: "horizontal",
        y_label: "Age"
    });

    // Draw a second copy of the chart for the expanded view
    barChart({
        data: migration_chart_data,
        value: "Total Net",
        bars: "Sex",
        categories: "Broad age band (7 cat)",
        canvas_id: "migration-bar-expanded",
        label_format: ",",
        align: "horizontal",
        y_label: "Age"
    });

    // ===== LINE CHART: MIGRATION FLOWS OVER TIME =====
    // Prepare yearly net migration values for the United Kingdom, rest of the
    // world, and the combined total

    // Pull the Year column from each migration-flow row
    //
    // The order of this array determines the order of values along the x-axis
    const migration_years = migration_flows_data
        .map(col => col["Year"]);

    // Build one numeric array for each line shown on the chart
    //
    // Each map() call pulls one column from the same ordered rows, ensuring that
    // all three series remain aligned with migration_years
    //
    // The resulting structure is:
    //
    //   [
    //     [UK net values],
    //     [rest-of-world net values],
    //     [total net values]
    //   ]
    const lines = [
        migration_flows_data
            .map(col => col["United Kingdom Net"]),

        migration_flows_data
            .map(col => col["Rest of World Net"]),

        migration_flows_data
            .map(col => col["Total Net"])
    ];

    // Draw the standard migration trend chart
    lineChart({
        years: migration_years, // Values displayed along the x-axis
        lines: lines, // Arrays containing the three migration series
        labels: [
            "United Kingdom Net",
            "Rest of World Net",
            "Total Net"
        ], // Labels displayed in the chart legend
        unit: "", // No unit suffix is added to the chart labels
        canvas_id: "migration-line", // HTML canvas where the chart is drawn
        showPoints: false // Draw lines without a marker on every observation
    });

    // Draw a second copy of the same chart for the expanded view
    lineChart({
        years: migration_years,
        lines: lines,
        labels: [
            "United Kingdom Net",
            "Rest of World Net",
            "Total Net"
        ],
        unit: "",
        canvas_id: "migration-line-expanded",
        showPoints: false
    });

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Define the source-matrix filters associated with the charts
    //
    // These query objects describe the subset of the original NISRA matrices
    // users should receive when downloading the underlying data

    // Request the latest-year age-by-sex net migration values
    //
    // The source matrix uses category codes rather than displayed labels:
    //
    //   Sex values 1 and 2 represent male and female
    //   broadage7 values identify the individual age bands
    //   TOTNET identifies the Total Net measure
    const migration_bar_query = {
        "TLIST(A1)": latest_year,
        "broadage7": ["1, 2", "3", "4", "5", "6", "7"],
        "Sex": ["1", "2"],
        "type": "TOTNET"
    };

    // Request the three net migration series displayed on the line chart
    const migration_line_query = {
        "type9": [
            "UKNET",
            "ROWNET",
            "TOTNET"
        ]
    };

    // Add a download button for the age-by-sex bar chart
    downloadButton(
        "migration-bar-capture",
        "MIG01T02",
        migration_updated,
        migration_bar_query
    );

    // Add a download button for the migration-flows line chart
    downloadButton(
        "migration-line-capture",
        "MIG01T03",
        migration_flows_updated,
        migration_line_query
    );

    // ===== INFO BOXES: HELP AND CONTEXT =====
    // Populate the expandable information boxes displayed below the page content
    //
    // populateInfoBoxes() receives:
    //
    //   1. An array containing the box headings
    //   2. An array containing the corresponding HTML content
    //
    // Items at the same array position belong together:
    //
    //   headings[0] is paired with content[0]
    //   headings[1] is paired with content[1]
    //   headings[2] is paired with content[2]
    populateInfoBoxes(
        [
            "Definitions",
            "Source",
            "What does the data mean?"
        ],
        [
            // ----- DEFINITIONS BOX -----
            // Explain how the page layout is constructed and made responsive
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the cards and charts can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,

            // ----- SOURCE BOX -----
            // Identify the matrices used to populate the cards and charts
            `<p>The cards and charts on this page are populated by this script using data from the NISRA Data Portal.</p>
            <p>The main datasets are <strong>MIG01T02</strong> for net migration by year, age band, and sex, and <strong>MIG01T03</strong> for migration flows involving the United Kingdom and the rest of the world.</p>
            <p>Each matrix is loaded as a CSV-style table. Rows are filtered using dimensions such as year, age band, and sex, and the required value columns are then selected for the cards and charts.</p>`,

            // ----- DATA MEANING BOX -----
            // Explain the inputs expected by the two chart utilities
            `<p>This page uses two charting functions.</p>
            <p><strong>barChart()</strong> draws the horizontal age-by-sex migration chart. It receives the filtered data rows, the numeric value column, the column defining the separate bar series, the category column, the canvas ID, the number format, and the chart alignment.</p>
            <p><strong>lineChart()</strong> draws the migration trend over time. It receives the year values, the arrays of values for each line, the line labels, the chart unit, the canvas ID, and the point-display setting.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener