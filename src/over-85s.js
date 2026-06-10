import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { createBarChart, createLineChart, insertTable } from "./utils/charts.js";
import { insertExpandButtons } from "./utils/expand-buttons.js";
import { dateFormat } from "./utils/date-format.js";
import { downloadButton } from "./utils/download-button.js";

import { text_colours, chart_colours,  get_tree_data } from "./utils/charts.js";
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

    const MYE01T025_updated = dateFormat(MYE01T025.updated);

    const raw = MYE01T025.data[MYE01T025_stat];
    
    // Stacked bar chart
    // Define the year range
    const tenyrs_previous = latest_year - 10

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

  function createStackedPercentageChart({
      labels,        
      stacked_values,    
      years,
      canvas_id
    }) {

    // Convert values to percentages
    const percentages = years.map((_, i) => {
      const total = stacked_values.reduce((sum, arr) => sum + arr[i], 0);
      return stacked_values.map(arr => (arr[i] / total) * 100);
    });

    // Transpose → datasets per category
    const datasets = labels.map((label, datasetIndex) => ({
      label,
      data: percentages.map(row => Number(row[datasetIndex].toFixed(1))),
      rawData: stacked_values[datasetIndex],
      backgroundColor: chart_colours[datasetIndex]
    }));

    new Chart(document.getElementById(canvas_id), {
      type: "bar",
      data: {
        labels: years,
        datasets
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: {
            stacked: true,
            max: 100,
            ticks: {
              callback: value => value + "%"
            }
          }
        },
        plugins: {

          tooltip: {
            callbacks: {
              label: function(ctx) {
                const rawValue = ctx.dataset.rawData[ctx.dataIndex];
                const pct = ctx.raw;

                return `${ctx.dataset.label}: ${rawValue.toLocaleString()}`;
              }
            }
          },

          datalabels: {
            color: (ctx) => text_colours[ctx.datasetIndex],
            formatter: (value) => value.toFixed(1) + "%",
            anchor: "centre",
            align: "centre"
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  createStackedPercentageChart({
    labels: genders,
    stacked_values,
    years,
    canvas_id: "pop-stacked-bar"
  });

  createStackedPercentageChart({
    labels: genders,
    stacked_values,
    years,
    canvas_id: "pop-stacked-bar-expanded"
  });

  // Tree map
  function createTreemapChart({
      raw_data,     
      stat,         
      year,         
      categories,   
      group_key,    
      canvas_id,
    }) {

    // Build chart data dynamically
    const data_for_year = raw_data[stat][year];

    const tree = categories.map(category => ({
      label: category,
      value: data_for_year[category][group_key]
    }));

    new Chart(document.getElementById(canvas_id), {
      type: "treemap",
      data: {
        datasets: [{
          tree: tree,
          key: "value",
          groups: ["label"],

          backgroundColor: (ctx) =>
            chart_colours[ctx.dataIndex % chart_colours.length],

          borderWidth: 1,
          borderColor: "#ffffff",

          labels: {
            display: true,
            align: "center",
            position: "center",

            color: (ctx) =>
              text_colours[ctx.dataIndex % text_colours.length],

            formatter: (ctx) => {
              const label = ctx.raw?.g;
              const value = ctx.raw?.v;

              if (!label || value == null) return null;

              return [
                label,
                value.toLocaleString()
              ];
            }
          }
        }]
      },
      options: {
        plugins: {
          legend: { display: false },

          // Tooltip for hover labels
          
tooltip: {
  enabled: true,   // 
  callbacks: {
    label: function(ctx) {
      return `${ctx.raw.label}: ${ctx.raw.value.toLocaleString()}`;
    }
  }
}

        }
      }
    });
  }

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

  createTreemapChart({
    raw_data: MYE01T03.data,
    stat: MYE01T03_stat,
    year: latest_year,
    categories: Age_Groups,
    group_key: "All persons",
    canvas_id: "pop-tree-map"
  });

  createTreemapChart({
    raw_data: MYE01T03.data,
    stat: "Mid-year population estimate",
    year: latest_year,
    categories: Age_Groups,
    group_key: "All persons",
    canvas_id: "pop-tree-map-expanded"
  });

  // ===== DOWNLOAD FUNCTIONALITY =====
  const pop_stacked_query = {
      "TLIST(A1)": latest_year, // Latest year only
      "broadage4": "All", // All age groups combined
      "Sex": ["1", "2"] // Genders (1=Male, 2=Female)
  };

  const pop_treemap_query = {
      "TLIST(A1)": latest_year, // Latest year only
      "broadage7": ["1, 2", "3", "4"], // All age groups combined
      "Sex": ["1"]
  };

  // Create download buttons that allow users to download the underlying data
  downloadButton("stacked-bar-capture", "MYE01T25", MYE01T025_updated, pop_stacked_query);
  downloadButton("tree-map-capture", "MYE01T03", MYE01T03_updated, pop_treemap_query);

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

  
  // ===== INFO BOXES - HELP AND METADATA =====
  // Populate the expandable info boxes with definitions and help text
  // Takes 3 arrays: box titles, and their corresponding content
  populateInfoBoxes(
      ["Definitions", "Source", "What does the data mean?"], // Box titles
      [
          // Content for "Definitions" box
          `<p>The data used to populate this page comes from the NISRA Data Portal...</p>`,
          
          // Content for "Source" box  
          `<h3>Line chart functionality</h3>
          <p>The function <em>createLineChart</em> is used to generate the line chart...</p>
          <h3>Pie chart functionality</h3>
          <p>The function <em>createPieChart</em> is used to generate the pie chart...</p>`,

          // Content for "What does the data mean?" box
          `<p>Accessibility and best practice information goes here...</p>`
      ]
  );

  document.getElementById("latest-year").textContent = latest_year;
  document.getElementById("last-year").textContent = last_year;    
  document.getElementById("tenyrs-previous").textContent = tenyrs_previous;

})

