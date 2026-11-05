
import { config } from "../config/config.js";

/**
 * Initialise the NISRA cookie consent banner.
 *
 * Requires consent-head.js to have run in the
 * document head before this function is called.
 */
export function initCookieConsent(options = {}) {
  const {
    bannerId = "cookie-banner"
  } = options;

  const consent = window.NISRAConsent;

  if (!consent) {
    console.error(
      "NISRA Consent Mode is not initialised. " +
      "Load consent-head.js before dashboard scripts."
    );
    return;
  }

  const cookieBanner = document.getElementById(bannerId);

  if (!cookieBanner) {
    console.warn(
      `Cookie banner element #${bannerId} not found.`
    );
    return;
  }

  function hideBanner() {
    cookieBanner.style.display = "none";
    cookieBanner.setAttribute("aria-hidden", "true");
  }

  function showBanner() {
    cookieBanner.style.display = "block";
    cookieBanner.removeAttribute("aria-hidden");
  }

  // Build the banner once.
  if (!cookieBanner.dataset.consentInitialised) {
    cookieBanner.dataset.consentInitialised = "true";
    cookieBanner.classList.add("cookies-infobar");

    const container = document.createElement("div");
    container.className = "container";

    const heading = document.createElement("p");
    const strong = document.createElement("strong");

    strong.textContent = `Cookies on ${config.title}`;
    heading.appendChild(strong);

    const description = document.createElement("p");
    description.append(
      "This web page places small amounts of information " +
      "known as cookies on your device. "
    );

    const link = document.createElement("a");
    link.href = "https://www.nisra.gov.uk/cookies";
    link.className = "cookiesbarlink";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Find out more about cookies";

    description.appendChild(link);
    description.append(".");

    const acceptBtn = document.createElement("button");
    acceptBtn.id = "accept-cookies";
    acceptBtn.className =
      "btn btn-secondary btn-primary";
    acceptBtn.type = "button";
    acceptBtn.textContent = "Accept analytics cookies";

    const rejectBtn = document.createElement("button");
    rejectBtn.id = "reject-cookies";
    rejectBtn.className =
      "btn btn-secondary btn-primary";
    rejectBtn.type = "button";
    rejectBtn.textContent = "Reject analytics cookies";

    container.append(
      heading,
      description,
      acceptBtn,
      rejectBtn
    );

    cookieBanner.replaceChildren(container);

    function handleChoice(choice) {
      const saved = consent.setChoice(choice);

      if (saved) {
        hideBanner();
      } else {
        console.warn(
          "Cookie preference could not be saved. " +
          "The banner will reappear on the next page."
        );
        hideBanner();
      }
    }

    acceptBtn.addEventListener("click", () => {
      handleChoice("accepted");
    });

    rejectBtn.addEventListener("click", () => {
      handleChoice("rejected");
    });
  }

  // Expose a way to reopen the banner.
  window.showNisraCookieSettings = function () {
    showBanner();

    const firstButton =
      cookieBanner.querySelector("button");

    firstButton?.focus();
  };

  // Show only when there is no valid saved choice.
  if (consent.getChoice() === null) {
    showBanner();
  } else {
    hideBanner();
  }
}
