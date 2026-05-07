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

   
    
    

})