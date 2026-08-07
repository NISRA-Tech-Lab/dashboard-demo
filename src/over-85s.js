// ===== IMPORTS =====
// Import the reusable functions used to build the page, load data,
// create charts, format dates, and insert values into the HTML

import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js"; // Builds the shared page structure
import { readData } from "./utils/read-data.js"; // Loads a CSV dataset together with its metadata
import { insertValue } from "./utils/insert-value.js"; // Inserts a value into a specified HTML element
import { latest_year, updateYearSpans } from "./utils/update-years.js"; // Provides and updates year-related values
import { treemapChart } from "./charts/treemap-chart.js"; // Creates tree map charts
import { insertExpandButtons } from "./utils/expand-buttons.js"; // Adds controls for expanding chart sections
import { dateFormat } from "./utils/date-format.js"; // Formats dataset update dates for display
import { downloadButton } from "./utils/download-button.js"; // Adds buttons for downloading the underlying data
import { populateInfoBoxes } from "./utils/info-boxes.js"; // Populates expandable information boxes
import { barChart } from "./charts/bar-chart.js"; // Creates vertical or horizontal bar charts

// ===== MAIN EXECUTION =====
// Run the page setup and data-processing code after the initial HTML
// document has finished loading
//
// Declaring the function as async allows await to be used while page
// components and datasets are loaded
window.addEventListener("DOMContentLoaded", async () => {

    // ===== BUILD THE PAGE STRUCTURE =====
    // Insert the shared head, header, navigation, footer, and chart
    // expansion controls used across the dashboard
    await insertHead("Over 85s");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // ===== LOAD THE OVER-85 DATA =====
    // readData() returns two items:
    //
    //   1. The parsed CSV rows
    //   2. The metadata entry for the matrix
    //
    // Array destructuring assigns these to over_85_data and over_85_meta
    //
    // The CSV rows work similarly to an R data frame:
    //
    //   JavaScript array of objects   ≈ R data frame
    //   one object                    ≈ one row
    //   one object property           ≈ one column
    const [over_85_data, over_85_meta] = await readData("MYE01T025");

    // Read the available years from the CSV rows and update year labels
    // shown throughout the page
    updateYearSpans(over_85_data, over_85_meta);

    // Set the comparison year to ten years before the latest available year
    const comparison_year = latest_year - 10;

    // Format the matrix update date stored in the metadata
    const over_85_updated = dateFormat(over_85_meta.updated);

    // ===== CALCULATE THE TOTAL AGED 85 AND OVER FOR EACH ROW =====
    // Add a new over_85 property to every CSV row
    //
    // Object.keys(row) returns the column names in the current row
    //
    // filter() keeps only columns whose names contain "Age"
    //
    // map() extracts the values from those age columns
    //
    // reduce() adds the age values together to produce a single total
    //
    // In dplyr terms, this is conceptually similar to mutate() combined
    // with rowSums() across selected columns
    over_85_data.forEach(row => {
      row["over_85"] = Object.keys(row)
        .filter(key => key.includes("Age"))
        .map(key => row[key])
        .reduce((sum, value) => sum + value, 0)
    })

    // ===== LATEST OVER-85 POPULATION CARD =====
    // Filter to the latest-year All persons row and extract the calculated
    // over_85 value
    //
    // This is similar to:
    //
    //   pop_over_85 <- over_85_data %>%
    //     filter(
    //       Year == latest_year,
    //       Sex == "All persons"
    //     ) %>%
    //     pull(over_85)
    const pop_over_85 = over_85_data
      .filter(row =>
        row["Year"] == latest_year &&
        row["Sex"] == "All persons"
      )
      .map(col => col["over_85"]);

    // Display the total using locale-aware thousands separators
    insertValue("pop-over-85", pop_over_85.toLocaleString());

    // ===== OVER-85 POPULATION TEN YEARS EARLIER =====
    // Filter to the comparison-year All persons row and extract the
    // calculated over_85 value
    const pop_over_85_comparison = over_85_data
      .filter(row =>
        row["Year"] == comparison_year &&
        row["Sex"] == "All persons"
      )
      .map(col => col["over_85"]);
      
    // Display the comparison-year total
    insertValue("pop-over85-10yrs", pop_over_85_comparison.toLocaleString());

    // ===== FEMALE SHARE OF THE OVER-85 POPULATION =====
    // Filter to the comparison-year female row and extract the over_85 total
    const pop_over_85_female = over_85_data
      .filter(row =>
        row["Year"] == comparison_year &&
        row["Sex"] == "Females"
      )
      .map(col => col["over_85"]);

    // Calculate the female value as a percentage of the latest-year
    // All persons over-85 total
    const female_over_85_pct = (pop_over_85_female / pop_over_85_comparison) * 100;

    // Display the result rounded to one decimal place
    insertValue("female-over-85", female_over_85_pct.toFixed(1));

    // ===== MALE SHARE OF THE LATEST OVER-85 POPULATION =====
    // Filter to the latest-year male row and extract the over_85 total
    const pop_over_85_male = over_85_data
      .filter(row =>
        row["Year"] == latest_year &&
        row["Sex"] == "Males"
      )
      .map(col => col["over_85"]);

    // Calculate males as a percentage of the latest-year All persons total
    const male_over85_pct = (pop_over_85_male / pop_over_85) * 100;

    // Display the percentage rounded to one decimal place
    insertValue("male-over-85", male_over85_pct.toFixed(1));

    // ===== MALE SHARE TEN YEARS EARLIER =====
    // Filter to the comparison-year male row and extract the over_85 total
    const pop_over_85_male_10yrs = over_85_data
      .filter(row =>
        row["Year"] == comparison_year &&
        row["Sex"] == "Males"
      )
      .map(col => col["over_85"]);

    // Calculate males as a percentage of the comparison-year
    // All persons total
    const male_over_85_pct_10yrs = (pop_over_85_male_10yrs / pop_over_85_comparison) * 100;

    // Display the percentage rounded to one decimal place
    insertValue("male-over-85-10yrs", male_over_85_pct_10yrs.toFixed(1));
    
    // ===== UPDATE COMPARISON-YEAR LABELS =====
    // Find all HTML elements with class="comparison-year"
    const comparison_spans = document.getElementsByClassName("comparison-year");

    // Insert the calculated comparison year into each matching element
    for (let i = 0; i < comparison_spans.length; i ++) {
      comparison_spans[i].textContent = comparison_year;
    }


    
    // ===== STACKED BAR CHART: MALE AND FEMALE SHARES =====
    // Filter the over-85 dataset to:
    //
    //   male and female rows only
    //   years from the comparison year onwards
    //
    // The All persons rows are excluded because the chart segments should
    // contain only the male and female components
    const over_85_bar_data = over_85_data
      .filter(row =>
        row["Sex"] != "All persons" &&
        row["Year"] >= comparison_year
      );
    

  // Draw the standard stacked chart
  //
  // barChart() receives the male and female over-85 population counts
  //
  // Because stacked is true and label_format is "%", barChart()
  // calculates the total for each year and converts each sex value
  // into its percentage share before drawing the chart
  //
  // This is conceptually similar to:
  //
  //   over_85_bar_data %>%
  //     group_by(Year) %>%
  //     mutate(
  //       percentage = over_85 / sum(over_85) * 100
  //     )
  barChart({
    data: over_85_bar_data,
    value: "over_85",
    categories: "Year",
    bars: "Sex",
    canvas_id: "pop-stacked-bar",
    expanded_canvas_id: "pop-stacked-bar-expanded",
    label_format: "%",
    stacked: true,
    y_label: "%"
  })

  // ===== TREE MAP: BROAD AGE STRUCTURE =====
  // Load the broad-age population matrix and its metadata
  const [pop_age_data, pop_age_meta] = await readData("MYE01T03");
  
  // Format the matrix update date stored in the metadata
  const pop_age_updated = dateFormat(pop_age_meta.updated);
  
  // Filter to the latest-year broad age groups and remove the All summary row
  //
  // The remaining rows represent the individual age-band rectangles
  // displayed in the tree map
  const treemap_data = pop_age_data
    .filter(row =>
      row["Broad age band (4 cat)"] != "All" &&
      row["Year"] == latest_year
    )
  
  // Draw the standard tree map
  //
  // categories identifies the column containing the age-band labels
  // value identifies the numeric population column used to size each rectangle
  treemapChart({
    data: treemap_data,
    categories: "Broad age band (4 cat)",
    value: "All persons",
    canvas_id: "pop-tree-map"
  });

  // Draw a second copy of the tree map for the expanded view
  treemapChart({
    data: treemap_data,
    categories: "Broad age band (4 cat)",
    value: "All persons",
    canvas_id: "pop-tree-map-expanded"
  });

  // ===== DOWNLOAD FUNCTIONALITY =====
  // Define the source-matrix filters associated with each chart

  // Build an array containing the latest year and the ten preceding years
  //
  // String() converts each numeric year into text because the download
  // query expects matrix category codes as strings
  const ten_yrs_ago = latest_year - 10
  const year_range = [];

  for (let y = ten_yrs_ago; y <= latest_year; y++) {
    year_range.push(String(y));
  }

  // Request the years and male/female categories used in the stacked chart
  const pop_stacked_query = {
      "Year": year_range, // The complete eleven-year range shown in the chart
      "Sex": ["Females", "Males"] // Male and female categories
  };

  // Request the latest-year broad age groups used in the tree map
  const pop_treemap_query = {
      "Year": latest_year, // Latest year only
      "Broad age band (4 cat)": ["Age 0-15", "Age 16-39", "Age 40-64", "Age 65+"], // Broad age-group categories displayed in the tree map
      "Sex": "All persons" // All persons
  };

  // Add a download button for the stacked male/female chart
  downloadButton("stacked-bar-capture", "MYE01T025", over_85_updated, pop_stacked_query);

  // Add a download button for the broad-age tree map
  downloadButton("tree-map-capture", "MYE01T03", pop_age_updated, pop_treemap_query);

  // ===== INFO BOXES: HELP AND CONTEXT =====
  // Populate the expandable information boxes displayed below the page content
  //
  // The first array contains the box headings
  // The second array contains the corresponding HTML content
  populateInfoBoxes(
      ["Definitions", "Source", "What does the data mean?"], // Information-box headings
      [
          // ----- DEFINITIONS BOX -----
          // Explain how the page layout is built and made responsive
          `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the charts and summary cards can adapt to different screen sizes and remain mobile friendly.</p>
          <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
          <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,
          
          // ----- SOURCE BOX -----
          // Identify the matrices used to populate the cards and charts
          `<p>The cards and charts on this page are populated by this script using data from the NISRA Data Portal.</p>
          <p>The main datasets are <strong>MYE01T025</strong> for population aged 85 and over and <strong>MYE01T03</strong> for the broad age-group breakdown used in the tree map.</p>
          <p>Each matrix is loaded as a CSV-style table. Rows are filtered using fields such as year, sex, and age group, while the required population columns are selected or combined for the cards and charts.</p>`,

          // ----- DATA MEANING BOX -----
          // Explain the inputs expected by the chart functions used on this page
          `<p>This page uses two charting functions.</p>
          <p><strong>barChart()</strong> draws the male and female stacked chart. It receives the filtered CSV rows, the calculated over-85 value column, the year category column, the sex column used to create the separate segments, the canvas ID, and the stacking and label settings. When the chart is stacked and the label format is set to a percentage, the function converts the male and female counts into percentage shares for each year.</p>
          <p><strong>treemapChart()</strong> draws the broad age-group tree map. It receives the filtered latest-year rows, the column containing the age-group labels, the population column used to size each rectangle, and the canvas ID.</p>`
      ]
  );


}) // End of DOMContentLoaded event listener
