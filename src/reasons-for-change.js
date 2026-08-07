// ===== IMPORTS =====
// Import the utility functions used to build the page, load datasets,
// create charts and tables, and insert values into the HTML
//
// Keeping these functions in separate modules makes this script easier to read
// and allows the same functionality to be reused across other pages

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a matrix CSV together with its associated metadata
import { insertValue } from "./utils/insert-value.js"; // Inserts a value into a specified HTML element
import { latest_year, updateYearSpans, last_year } from "./utils/update-years.js"; // Provides and updates year-related values
import { barChart } from "./charts/bar-chart.js"; // Creates a grouped bar chart
import { insertTable } from "./charts/insert-table.js"; // Builds and inserts an HTML table
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds controls for expanding charts and tables
import { dateFormat } from "./utils/date-format.js"; // Formats dataset update dates for display
import { downloadButton } from "./utils/download-button.js"; // Adds buttons for downloading the underlying data
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates expandable information boxes

// ===== MAIN EXECUTION =====
// This function runs after the initial HTML document has finished loading
//
// Declaring the function as "async" allows await to be used while datasets
// and shared page components are loaded
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // Insert the shared elements used across the website, including the page head,
    // header, navigation buttons, footer, and expansion controls
    await insertHead("Reasons for change"); // Wait until the document head has been prepared
    insertHeader(); // Adds the page header
    insertNavButtons(); // Adds the navigation buttons
    insertFooter(); // Adds the page footer
    insertExpandButtons(); // Adds controls for opening expanded chart and table views

    // ===== POPULATE PAGE WITH DATA =====
    // Each matrix is now stored in two parts:
    //
    //   1. A CSV file containing observations as rows and columns
    //   2. An entry in data.json containing metadata such as the matrix label,
    //      update date, subject code, and product code
    //
    // readData() returns both parts as a two-item array. Array destructuring is
    // used below to give the CSV data and metadata meaningful names.
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
    //   forEach()   can be used to calculate and add new columns
    //   find()      resembles filtering to one matching row

    // ----- TOTAL POPULATION CHANGE CARD -----
    // Step 1: Load the components of population change matrix
    //
    // COPC01T01.csv contains the observation rows, while the COPC01T01 entry
    // in data.json contains the associated metadata
    const [pop_change_data, pop_change_meta] = await readData("COPC01T01");

    // Read the available years from the CSV rows and update year references
    // displayed throughout the page
    updateYearSpans(pop_change_data, pop_change_meta);

    // Step 2: Filter the data to the latest year
    //
    // Storing the filtered row in pop_change_latest_year means the same filter
    // does not need to be repeated for every card value
    //
    // This is similar to:
    //
    //   pop_change_latest_year <- pop_change_data %>%
    //     filter(Year == latest_year)
    const pop_change_latest_year = pop_change_data
        .filter(row => row["Year"] == latest_year);

    // Extract the starting population from the latest-year row
    //
    // map() selects the requested column from each retained row, similar to:
    //
    //   start_pop <- pop_change_latest_year %>%
    //     pull(`Starting population`)
    const start_pop = pop_change_latest_year
        .map(col => col["Starting population"]);

    // Extract the population at the end of the period
    const end_pop = pop_change_latest_year
        .map(col => col["End population"]);

    // Calculate the total population change during the period
    const pop_change = end_pop - start_pop;

    // Step 3: Display the result
    //
    // toLocaleString() adds thousands separators, for example:
    //   12345 becomes 12,345
    insertValue("pop-change", pop_change.toLocaleString());

    // ----- BIRTHS VERSUS DEATHS CARD -----
    // Extract the number of births recorded during the latest period
    const births_num = pop_change_latest_year
        .map(col => col["Births"]);

    // Extract the number of deaths recorded during the latest period
    const deaths_num = pop_change_latest_year
        .map(col => col["Deaths"]);

    // Subtract deaths from births to calculate natural change
    //
    // A positive result means births exceeded deaths, while a negative result
    // means deaths exceeded births
    const births_deaths = births_num - deaths_num;

    insertValue("pop-births-deaths", births_deaths.toLocaleString());

    // ----- INFLOW CARD -----
    // Select the Total Inflows column from the latest-year row
    const inflows_num = pop_change_latest_year
        .map(col => col["Total Inflows"]);

    insertValue("pop-inflows", inflows_num.toLocaleString());

    // ----- OUTFLOW CARD -----
    // Select the Total Outflows column from the latest-year row
    const outflows_num = pop_change_latest_year
        .map(col => col["Total Outflows"]);

    insertValue("pop-outflows", outflows_num.toLocaleString());

    // ----- NET CHANGE CARD -----
    // Select total net migration from the latest-year row
    //
    // Total Net is the balance between total inflows and total outflows
    const net_num = pop_change_latest_year
        .map(col => col["Total Net"]);

    // Calculate the proportion of total population change attributable to
    // net migration
    //
    // Dividing net migration by the overall population change gives a proportion,
    // and multiplying by 100 converts it to a percentage
    const net_change = (net_num / pop_change) * 100;

    // Display the result rounded to one decimal place
    insertValue("pop-net-change", net_change.toFixed(1));

    // ===== BAR CHART: AGE BREAKDOWN BY SEX =====
    // Create a grouped bar chart showing population by broad age band and sex

    // Load the population matrix containing broad age bands and sex categories
    const [gender_pop_data, gender_pop_meta] = await readData("MYE01T03");

    // Format the update date stored separately in the matrix metadata
    const gender_pop_updated = dateFormat(gender_pop_meta.updated);

    // Filter the CSV rows to the latest year and remove the summary "All" category
    //
    // The retained rows contain the individual broad age bands needed for the
    // chart. Each row includes:
    //
    //   Year
    //   Broad age band (4 cat)
    //   Males
    //   Females
    //
    // This is similar to:
    //
    //   chart_data <- gender_pop_data %>%
    //     filter(
    //       Year == latest_year,
    //       `Broad age band (4 cat)` != "All"
    //     )
    const chart_data = gender_pop_data
        .filter(row =>
            row["Year"] == latest_year &&
            row["Broad age band (4 cat)"] != "All"
        );

    // Draw the standard version of the grouped bar chart
    //
    // The chart function now receives the filtered rows directly rather than
    // requiring separate category and value arrays to be constructed manually
    barChart({
        data: chart_data, // Filtered data-frame-style rows used by the chart
        value: ["Females", "Males"], // Numeric columns to display as separate series
        categories: "Broad age band (4 cat)", // Column used for the x-axis categories
        canvas_id: "population-age-bar", // HTML canvas where the chart is drawn
        expanded_canvas_id: "population-age-bar-expanded", // HTML canvas for the expanded chart
        label_format: ",", // Format large values with thousands separators
        y_label: "Population"
    });

    // ===== TABLE: POPULATION CHANGE BY LOCAL GOVERNMENT DISTRICT =====
    // Load the population totals matrix containing local government district rows
    //
    // MYE01T06.csv contains one row for each combination of year and district
    const [pop_by_lgd_data, pop_by_lgd_meta] = await readData("MYE01T06");

    // Format the matrix update date stored in data.json
    const pop_by_lgd_updated = dateFormat(pop_by_lgd_meta.updated);

    // Step 1: Add comparison values to each latest-year row
    //
    // forEach() visits every row in the data. For latest-year rows, the matching
    // district from the previous year is located and three new calculated columns
    // are added:
    //
    //   last_year_pop
    //   change
    //   change_pct
    //
    // This is conceptually similar to a grouped mutate() in dplyr, where values
    // from two periods are matched by local government district before new
    // variables are calculated
    pop_by_lgd_data.forEach(row => {

        // Read the identifying values from the current row
        const row_year = row["Year"];
        const row_lgd = row["Local Government District"];

        // Only latest-year rows need the comparison columns because these are
        // the rows that will be displayed in the table
        if (row_year == latest_year) {

            // Find the population for the same district in the preceding year
            //
            // filter() matches both the year and district, while map() extracts
            // the Unrounded population value from the matching row
            row["last_year_pop"] = pop_by_lgd_data
                .filter(previous_row =>
                    previous_row["Year"] == last_year &&
                    previous_row["Local Government District"] == row_lgd
                )
                .map(col => col["Unrounded"]);

            // Calculate the numeric population change
            //
            // latest population - previous population
            row["change"] = row["Unrounded"] - row["last_year_pop"];

            // Calculate the percentage population change
            //
            // numeric change / previous population × 100
            row["change_pct"] =
                row["change"] /
                row["last_year_pop"] *
                100;
        }
    });

    // Step 2: Keep only the latest-year rows for the displayed table
    //
    // Each retained row now contains both the original CSV columns and the three
    // calculated comparison columns added above
    const pop_by_lgd_latest_year = pop_by_lgd_data
        .filter(row => row["Year"] == latest_year);

    // Reshape the row-based data into the column-based structure expected by
    // insertTable()
    //
    // Each table column contains:
    //
    //   values: an array containing the values to display
    //   format: instructions describing how those values should be formatted
    //
    // map() is used repeatedly to pull one column from every latest-year row
    const table_data = {

        // District names displayed as text
        "Local Government District": {
            "values": pop_by_lgd_latest_year
                .map(col => col["Local Government District"]),
            "format": "string"
        },

        // Population in the latest year
        [`Population ${latest_year}`]: {
            "values": pop_by_lgd_latest_year
                .map(col => col["Unrounded"]),
            "format": "number"
        },

        // Population in the preceding year
        [`Population ${last_year}`]: {
            "values": pop_by_lgd_latest_year
                .map(col => col["last_year_pop"]),
            "format": "number"
        },

        // Numeric population increase or decrease
        "Change": {
            "values": pop_by_lgd_latest_year
                .map(col => col["change"]),
            "format": "change"
        },

        // Percentage population increase or decrease
        "Change (%)": {
            "values": pop_by_lgd_latest_year
                .map(col => col["change_pct"]),
            "format": "change_percent"
        }
    };

    // Step 3: Insert the table into both the standard and expanded containers
    insertTable("pop-table", "pop-table-expanded", table_data);
    // insertTable("pop-table-expanded", table_data);

    // ===== DOWNLOAD FUNCTIONALITY =====
    // Define the source-matrix filters associated with the table and chart
    //
    // These query objects describe the subset of the original NISRA matrix that
    // users should receive when they download the underlying data

    // Request population values for the previous and latest years
    //
    // rounded_unrounded restricts the download to the Unrounded measure used
    // in the displayed table
    const pop_table_query = {
        "Year": [last_year, latest_year],
        "Rounded or unrounded": "Unrounded"
    };

    // Request the latest-year male and female values for the four broad age bands
    //
    // The source matrix uses category codes rather than the displayed labels:
    //
    //   Sex values 1 and 2 represent the male and female categories
    //   broadage4 values 1 to 4 represent the four individual age bands
    const pop_bar_query = {
        "Year": latest_year, // Restrict the download to the latest year
        "Sex": ["Females", "Males"], // Select both sex categories
        "Broad age band (4 cat)": ["Age 0-15", "Age 16-39", "Age 40-64", "Age 65+"] // Select the four non-summary age bands
    };

    // Add a download button for the data underlying the age breakdown chart
    downloadButton(
        "pop-bar-capture",
        "MYE01T03",
        gender_pop_updated,
        pop_bar_query
    );

    // Add a download button for the data underlying the district table
    downloadButton(
        "pop-table-capture",
        "MYE01T06",
        pop_by_lgd_updated,
        pop_table_query
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
            `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the cards, chart, and table can adapt to different screen sizes and remain mobile friendly.</p>
            <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
            <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,

            // ----- SOURCE BOX -----
            // Identify the matrices used to populate the cards, chart, and table
            `<p>The cards, chart, and table on this page are populated by this script using data from the NISRA Data Portal.</p>
            <p>The main datasets are <strong>COPC01T01</strong> for components of population change, <strong>MYE01T03</strong> for the age breakdown chart, and <strong>MYE01T06</strong> for population totals by local government district.</p>
            <p>Each matrix is loaded as a CSV-style table. Rows are filtered using dimensions such as year, age band, and local government district, and the required value columns are then selected or calculated for the cards, chart, and table.</p>`,

            // ----- DATA MEANING BOX -----
            // Explain the inputs expected by the bar-chart utility
            `<p>This page uses <strong>barChart()</strong> to draw the population breakdown by broad age band and sex.</p>
            <p>The function receives the filtered data rows, the numeric columns to plot as separate series, the column containing the category labels, the canvas ID where the chart should be drawn, and the required number format.</p>`
        ]
    );

}); // End of DOMContentLoaded event listener
