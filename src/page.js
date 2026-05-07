import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { getSectors } from "./utils/get-sectors.js";
import { config } from "./config/config.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();

    if (!config.show_projections) {
        document.getElementById("projections-card").classList.add("d-none");
    } 

    // Insert values into homepage cards
    const GHGEMSSNS = await readData("GHGEMSSNS");
    const stat = "CO2 equivalent emissions";
    updateYearSpans(GHGEMSSNS, stat);

    // Change in Emissions
    const ghg_value = GHGEMSSNS.data[stat][latest_year]["Northern Ireland"]["Grand total"]["All pollutants"] / 1000;

    insertValue("total-ghg", ghg_value.toFixed(2));

    // Sectors
    const sectors = getSectors(GHGEMSSNS.data[stat][latest_year]["Northern Ireland"]);

    let sector_totals = {};
    let base_differences = {};

    for (let i = 0; i < sectors.length; i ++) {
        let sector_value = GHGEMSSNS.data[stat][latest_year]["Northern Ireland"][sectors[i]]["All pollutants"]
        let base_value = GHGEMSSNS.data[stat][first_year]["Northern Ireland"][sectors[i]]["All pollutants"];
        
        sector_totals[sectors[i]] = sector_value;
        base_differences[sectors[i]] = (base_value - sector_value) / base_value * 100;
    }

    const max_sector = Object.entries(sector_totals)
        .filter(([_, value]) => typeof value === "number" && !Number.isNaN(value))
        .reduce((max, current) => current[1] > max[1] ? current : max)[0];

    const max_sector_value = sector_totals[max_sector] / 1000;
    const max_sector_pct = (max_sector_value / ghg_value * 100).toFixed(0);

    const max_sector_name = toTitleCase(max_sector.replace(" total", ""));
    
    insertValue("max-sector-pct", max_sector_pct);
    insertValue("max-sector-name", max_sector_name);
    
    // Sector Comparisons
    const max_change_sector = Object.entries(base_differences)
        .filter(([_, value]) => typeof value === "number" && !Number.isNaN(value))
        .reduce((max, current) => current[1] > max[1] ? current : max)[0];

    const max_change_sector_value = base_differences[max_change_sector].toFixed(0);
    const max_change_sector_name = toTitleCase(max_change_sector.replace(" total", ""));

    insertValue("max-change-sector-value", max_change_sector_value);
    insertValue("max-change-sector-name", max_change_sector_name);

    const pfg_value = GHGEMSSNS.data[stat]["2019"]["Northern Ireland"]["Grand total"]["All pollutants"] / 1000;
    insertValue("pfg-value", pfg_value.toFixed(2));

    const co2_value = GHGEMSSNS.data[stat][latest_year]["Northern Ireland"]["Grand total"]["CO2"]/ 1000 / ghg_value * 100;
    insertValue("co2-value", co2_value.toFixed(0));
    
    insertFooter();

})