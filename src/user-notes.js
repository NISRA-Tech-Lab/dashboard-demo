import { insertHeader, insertFooter, insertNavButtons, insertHead } from "./utils/page-layout.js";
import { initCookieConsent } from "./utils/cookies.js";

window.addEventListener("DOMContentLoaded", async () => {

    await insertHead("User notes");
    initCookieConsent();
    insertHeader();
    insertNavButtons();
    insertFooter();

});