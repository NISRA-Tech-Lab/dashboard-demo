import { insertHeader, insertFooter, insertHead, insertNavButtons } from "./utils/page-layout.js";
import { readData } from "./utils/read-data.js";
import { insertValue } from "./utils/insert-value.js";
import { latest_year, updateYearSpans, first_year } from "./utils/update-years.js";
import { toTitleCase } from "./utils/to-title-case.js";
import { config } from "./config/config.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("Home");
    insertHeader();
    insertNavButtons();
    insertFooter();

    // Insert values into page cards

    const card_1_value = (123456).toLocaleString();
    insertValue("card-1-value", card_1_value);

    const card_2_value = 5.67;
    insertValue("card-2-value", card_2_value);

    const card_3_value = 2.89;
    insertValue("card-3-value", card_3_value);

    const card_4_value = (9876).toLocaleString();
    insertValue("card-4-value", card_4_value);

    const card_5_area = "Example Region A";
    insertValue("card-5-area", card_5_area);

    const card_5_value = (45678).toLocaleString();
    insertValue("card-5-value", card_5_value);

    const card_6_area = "Example Region B";
    insertValue("card-6-area", card_6_area);

    const card_6_value = (12345).toLocaleString();
    insertValue("card-6-value", card_6_value);

})