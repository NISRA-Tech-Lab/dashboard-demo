import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year, last_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";
import { getMaxEntry } from "./utils/get-max-entry.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();

    // Calculate values for insertion into homepage cards below

    // Fetch data for headline population value and update year spans across the page
    const MYE01T05 = await readData("MYE01T05");
    const MYE01T05_stat = "Population totals";
    updateYearSpans(MYE01T05, MYE01T05_stat);

    // Display the headline population value by taking the unrounded population estimate for the latest year and formatting with commas
    const headline_1 = (MYE01T05.data[MYE01T05_stat][latest_year]["Rounded"]).toLocaleString();
    insertValue("headline-1", headline_1);

    // In this example we will fetch the components of population change data and compare two values
    const COPC01T01 = await readData("COPC01T01");
    const COPC01T01_stat = "Components of population change";
   
    const natural_change = COPC01T01.data[COPC01T01_stat][latest_year]["Natural Change"];
    const net_migration = COPC01T01.data[COPC01T01_stat][latest_year]["Total Net"];
    const total_change = Math.abs(COPC01T01.data[COPC01T01_stat][latest_year]["End population"] - COPC01T01.data[COPC01T01_stat][latest_year]["Starting population"]);

    let headline_2_reason;
    let headline_2_value;
    if (Math.abs(natural_change) > Math.abs(net_migration)) {
        headline_2_reason = "natural change";
        headline_2_value = ((natural_change / total_change) * 100).toFixed(0);
    } else {
        headline_2_reason = "net migration";
        headline_2_value = ((net_migration / total_change) * 100).toFixed(0);
    }

    insertValue("headline-2-value", headline_2_value)
    insertValue("headline-2-reason", headline_2_reason)

    // The net migration value will also be displayed in the third card.
    const headline_3 = (((net_migration / 100).toFixed(0)) * 100).toLocaleString();
    insertValue("headline-3", headline_3);

    // Median age displayed in the fourth card
    const MA01T01 = await readData("MA01T01");
    const MA01T01_stat = "Median Age";
    const headline_4 = MA01T01.data[MA01T01_stat][latest_year]["All persons"].toFixed(0);

    insertValue("headline-4", headline_4);

    const MYE01T025 = await readData("MYE01T025");
    const MYE01T025_stat = "Mid-year population estimate";

    let all_over_85 = 0;

    const over_85_ages = Object.keys(MYE01T025.data[MYE01T025_stat][latest_year]["All persons"]);

    for (let i = 0; i < over_85_ages.length; i++) {
        all_over_85 += MYE01T025.data[MYE01T025_stat][latest_year]["All persons"][over_85_ages[i]];
    }

    const headline_5 = (all_over_85 / MYE01T05.data[MYE01T05_stat][latest_year]["Unrounded"] * 100).toFixed(1)

    insertValue("headline-5", headline_5);

    const MYE01T06 = await readData("MYE01T06");
    const MYE01T06_stat = "Population totals";

    const LGDs = Object.keys(MYE01T06.data[MYE01T06_stat][latest_year])
        .filter(x => x !== "Northern Ireland");

    let LGD_change = {};

    for (let i = 0; i < LGDs.length; i++) {
        const LGD = LGDs[i];
        const latest_pop = MYE01T06.data[MYE01T06_stat][latest_year][LGD]["Unrounded"];
        const last_pop = MYE01T06.data[MYE01T06_stat][latest_year - 10][LGD]["Unrounded"];
        LGD_change[LGD] = (latest_pop - last_pop) / last_pop * 100;
    }

    const max_LGD = getMaxEntry(LGD_change);

    const headline_6_value = max_LGD.value.toFixed(0);
    const headline_6_place = max_LGD.key;

    insertValue("headline-6-place", headline_6_place);
    insertValue("headline-6-value", headline_6_value);

})