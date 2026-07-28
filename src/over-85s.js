import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { stackedPercentageChart } from "./charts/stacked-percentage-chart.js";
// import { barChart } from "./charts/bar-chart.js";
import { treemapChart } from "./charts/treemap-chart.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";
import { dateFormat } from "./utils/date-format.js";
import { downloadButton } from "./utils/download-button.js";
import { chart_colours, text_colours } from "./config/colours.js";
import { populateInfoBoxes } from "./utils/info-boxes.js";
import { sectorNameTidy } from "./utils/to-title-case.js";
import { reshapeForTreemap } from "./utils/reshape-for-treemap.js";
import { barChart } from "./charts/bar-chart.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // Total population

    const [over_85_data, over_85_meta] = await readData("MYE01T025");
    const MYE01T025_stat = "Mid-year population estimate"; // This is the specific statistic within the dataset we want
    updateYearSpans(over_85_data); // Updates year labels on the page
    const comparison_year = latest_year - 10

    const over_85_updated = dateFormat(over_85_meta.updated);

    over_85_data.forEach(row => {
      row["over_85"] = Object.keys(row)
        .filter(key => key.includes("Age"))
        .map(key => row[key])
        .reduce((sum, value) => sum + value, 0)
    })

    // Population over 85 
    // Filter data for latest year, select columns that match the substring "Age" and sum
    const pop_over_85 = over_85_data
      .filter(row =>
        row["Year"] == latest_year &&
        row["Sex"] == "All persons"
      )
      .map(col => col["over_85"]);

    insertValue("pop-over-85", pop_over_85.toLocaleString());

    // Population over 85 ten years ago
    const pop_over_85_comparison = over_85_data
      .filter(row =>
        row["Year"] == comparison_year &&
        row["Sex"] == "All persons"
      )
      .map(col => col["over_85"]);
      
    insertValue("pop-over85-10yrs", pop_over_85_comparison.toLocaleString());

    // Female Population over 85 ten years ago
    const pop_over_85_female = over_85_data
      .filter(row =>
        row["Year"] == comparison_year &&
        row["Sex"] == "Females"
      )
      .map(col => col["over_85"]);

    const female_over_85_pct = (pop_over_85_female / pop_over_85) * 100;
    insertValue("female-over-85", female_over_85_pct.toFixed(1));

    // Male Population over 85
    const pop_over_85_male = over_85_data
      .filter(row =>
        row["Year"] == latest_year &&
        row["Sex"] == "Males"
      )
      .map(col => col["over_85"]);

    const male_over85_pct = (pop_over_85_male / pop_over_85) * 100;
    insertValue("male-over-85", male_over85_pct.toFixed(1));

    // Male Population over 85 ten years ago
    const pop_over_85_male_10yrs = over_85_data
      .filter(row =>
        row["Year"] == comparison_year &&
        row["Sex"] == "Males"
      )
      .map(col => col["over_85"]);

    const male_over_85_pct_10yrs = (pop_over_85_male_10yrs / pop_over_85_comparison) * 100;
    insertValue("male-over-85-10yrs", male_over_85_pct_10yrs.toFixed(1));
    
    const comparison_spans = document.getElementsByClassName("comparison-year");
    for (let i = 0; i < comparison_spans.length; i ++) {
      comparison_spans[i].textContent = comparison_year;
    }


    
    // Stacked bar chart
    // Define the year range

    const over_85_bar_data = over_85_data
      .filter(row =>
        row["Sex"] != "All persons" &&
        row["Year"] >= comparison_year
      );
    

  barChart({
    data: over_85_bar_data,
    value: "over_85",
    categories: "Year",
    bars: "Sex",
    canvas_id: "pop-stacked-bar",
    label_format: "%",
    stacked: true
  })

  barChart({
    data: over_85_bar_data,
    value: "over_85",
    categories: "Year",
    bars: "Sex",
    canvas_id: "pop-stacked-bar-expanded",
    label_format: "%",
    stacked: true
  })

  // Tree map

  const [pop_age_data, pop_age_meta] = await readData("MYE01T03");
  
  updateYearSpans(pop_age_data); // Updates year labels on the page
  const pop_age_updated = dateFormat(pop_age_meta.updated);
  
  const treemap_data = pop_age_data
    .filter(row =>
      row["Broad age band (4 cat)"] != "All" &&
      row["Year"] == latest_year
    )
  
  treemapChart({
    data: treemap_data,
    categories: "Broad age band (4 cat)",
    value: "All persons",
    canvas_id: "pop-tree-map"
  });

  treemapChart({
    data: treemap_data,
    categories: "Broad age band (4 cat)",
    value: "All persons",
    canvas_id: "pop-tree-map-expanded"
  });

  // ===== DOWNLOAD FUNCTIONALITY =====  

  // Create a list of the last ten years
  const ten_yrs_ago = latest_year - 10
  const year_range = [];
  for (let y = ten_yrs_ago; y <= latest_year; y++) {
    year_range.push(String(y));
  }

  const pop_stacked_query = {
      "TLIST(A1)": year_range, // Latest year only
      "broadage4": "All", // All age groups combined
      "Sex": ["1", "2"] // Genders (1=Male, 2=Female)
  };

  const pop_treemap_query = {
      "TLIST(A1)": latest_year, // Latest year only
      "broadage7": ["1, 2", "3", "4"], // All age groups combined
      "Sex": "All" // All people
  };

  // Create download buttons that allow users to download the underlying data
  downloadButton("stacked-bar-capture", "MYE01T025", over_85_updated, pop_stacked_query);
  downloadButton("tree-map-capture", "MYE01T03", pop_age_updated, pop_treemap_query);

  
  
  // ===== INFO BOXES - HELP AND METADATA =====
  // Populate the expandable info boxes with definitions and help text
  // Takes 3 arrays: box titles, and their corresponding content
  populateInfoBoxes(
      ["Definitions", "Source", "What does the data mean?"], // Box titles
      [
          // Content for "Definitions" box
          `<p>The layout for this page is built in the dashboard HTML template using Bootstrap 5 grid classes such as <code>row</code> and <code>col</code> so the charts and summary cards can adapt to different screen sizes and remain mobile friendly.</p>
          <p>For guidance on the Bootstrap layout system, see <a href="https://getbootstrap.com/docs/5.3/layout/grid/" target="_blank" rel="noopener noreferrer">Bootstrap 5 grid documentation</a>.</p>
          <p>The page has also been checked for accessibility so the content is easier to use with assistive technologies.</p>`,
          
          // Content for "Source" box  
          `<p>The top cards on this page are populated from this script using data from the NISRA Data Portal.</p>
          <p>The main datasets used are <strong>MYE01T025</strong> for the over-85 population figures and <strong>MYE01T03</strong> for the age-group breakdown used in the tree map.</p>
          <p>Values are selected by following the structure and column order shown in the relevant data matrix on the NISRA Data Portal.</p>`,

          // Content for "What does the data mean?" box
          `<p>This page uses two charting functions.</p>
          <p><strong>stackedPercentageChart()</strong> is used for the stacked percentage chart and requires the labels, the stacked values for each series, the years, and the canvas ID.</p>
          <p><strong>treemapChart()</strong> is used for the age-group tree map and requires the raw data, the statistic name, the year, the category list, the group key, and the canvas ID.</p>`
      ]
  );


})

