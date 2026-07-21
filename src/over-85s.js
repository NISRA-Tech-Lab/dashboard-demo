import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { stackedPercentageChart } from "./charts/stacked-percentage-chart.js";
import { treemapChart } from "./charts/treemap-chart.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";
import { dateFormat } from "./utils/date-format.js";
import { downloadButton } from "./utils/download-button.js";
import { chart_colours, text_colours } from "./config/colours.js";
import { populateInfoBoxes } from "./utils/info-boxes.js";
import { sectorNameTidy } from "./utils/to-title-case.js";
import { reshapeForTreemap } from "./utils/reshape-for-treemap.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();
    insertExpandButtons();

    // Total population

    const MYE01T025 = await readData("MYE01T025");
    const MYE01T025_stat = "Mid-year population estimate"; // This is the specific statistic within the dataset we want
    updateYearSpans(MYE01T025, MYE01T025_stat); // Updates year labels on the page
    const tenyrs_previous = latest_year - 10

    const MYE01T025_updated = dateFormat(MYE01T025.updated);

    // Population over 85 
    const pop_over85 = MYE01T025.data[MYE01T025_stat][latest_year]["All persons"];
    const total_over85 = Object.values(pop_over85)
      .reduce((sum, val) => sum + val, 0);
    insertValue("pop-over85", total_over85.toLocaleString());

    // Population over 85 ten years ago
    const pop_over85_10yrs = MYE01T025.data[MYE01T025_stat][tenyrs_previous]["All persons"];
    const total_over85_10yrs = Object.values(pop_over85_10yrs)
      .reduce((sum, val) => sum + val, 0);
    insertValue("pop-over85-10yrs", total_over85_10yrs.toLocaleString());

    // Female Population over 85 ten years ago
    const pop_over85_female = MYE01T025.data[MYE01T025_stat][latest_year]["Females"];
    const total_over85_female = Object.values(pop_over85_female)
      .reduce((sum, val) => sum + val, 0);
    const female_over85_pct = (total_over85_female / total_over85) * 100;
    insertValue("female-over85", female_over85_pct.toFixed(1));

    // Male Population over 85
    const pop_over85_male = MYE01T025.data[MYE01T025_stat][latest_year]["Males"];
    const total_over85_male = Object.values(pop_over85_male)
      .reduce((sum, val) => sum + val, 0);
    const male_over85_pct = (total_over85_male / total_over85) * 100;
    insertValue("male-over85", male_over85_pct.toFixed(1));

    // Male Population over 85 ten years ago
    const pop_over85_male_10yrs = MYE01T025.data[MYE01T025_stat][tenyrs_previous]["Males"];
    const total_over85_male_10yrs = Object.values(pop_over85_male_10yrs)
      .reduce((sum, val) => sum + val, 0);
    const male_over85_pct_10yrs = (total_over85_male_10yrs / total_over85_10yrs) * 100;
  insertValue("male-over85-10yrs", male_over85_pct_10yrs.toFixed(1));


    const raw = MYE01T025.data[MYE01T025_stat];
    
    // Stacked bar chart
    // Define the year range
    

    const years = Object.keys(raw).filter(y => y >= tenyrs_previous && y <= latest_year);

    const genders = ["Females", "Males"];

    const female_values = years.map(year =>
        Object.values(raw[year]["Females"])
            .reduce((sum, val) => sum + val, 0)
    );

    const male_values = years.map(year =>
        Object.values(raw[year]["Males"])
            .reduce((sum, val) => sum + val, 0)
    );

    const chart_data = {
      "Females": female_values,
      "Males": male_values
    };    
    
    const percentages = years.map((year, i) => {
      const total = female_values[i] + male_values[i];
      return {
        female: (female_values[i] / total) * 100,
        male: (male_values[i] / total) * 100
      };
    });

    const female_pct = percentages.map(d => Number(d.female.toFixed(1)));
    const male_pct = percentages.map(d => Number(d.male.toFixed(1)));

    const chart_datas = {
      labels: years,   
      datasets: [
          {
              label: "Males",
              data: male_values,
              backgroundColor: chart_colours[0]
          },
          {
              label: "Females",
              data: female_values,
              backgroundColor: chart_colours[1]
          }
      ]
    };

  const labels = ["Female", "Male"];

  const stacked_values = [
    female_values,
    male_values
  ];



  stackedPercentageChart({
    labels: genders,
    stacked_values,
    years,
    canvas_id: "pop-stacked-bar"
  });

  stackedPercentageChart({
    labels: genders,
    stacked_values,
    years,
    canvas_id: "pop-stacked-bar-expanded"
  });

  // Tree map

  const MYE01T03 = await readData("MYE01T03");
  const MYE01T03_stat = "Mid-year population estimate";
  updateYearSpans(MYE01T03, MYE01T03_stat); // Updates year labels on the page
  const MYE01T03_updated = dateFormat(MYE01T03.updated);

  const Age_Groups = [
    "Age 0-15",
    "Age 16-39",
    "Age 40-64",
    "Age 65+"
  ];  

  treemapChart({
    raw_data: MYE01T03.data,
    stat: MYE01T03_stat,
    year: latest_year,
    categories: Age_Groups,
    group_key: "All persons",
    canvas_id: "pop-tree-map"
  });

  treemapChart({
    raw_data: MYE01T03.data,
    stat: "Mid-year population estimate",
    year: latest_year,
    categories: Age_Groups,
    group_key: "All persons",
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
  downloadButton("stacked-bar-capture", "MYE01T025", MYE01T025_updated, pop_stacked_query);
  downloadButton("tree-map-capture", "MYE01T03", MYE01T03_updated, pop_treemap_query);

  
  
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

