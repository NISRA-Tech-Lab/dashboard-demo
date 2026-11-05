
/**
 * NISRA Consent Mode v2
 * Adapted from rap-skeleton/code/consent_head.html
 *
 * Load synchronously in the document head, before GTM.
 */
(function () {
  "use strict";

  if (window.NISRAConsent) return;

  const GTM_CONTAINER_ID = "GTM-KF6WGSG";
  const STORAGE_KEY = "nisra_consent_v2";
  const CONSENT_VERSION = 1;
  const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

  window.dataLayer = window.dataLayer || [];

  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  function consentState(choice) {
    return {
      analytics_storage:
        choice === "accepted" ? "granted" : "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted"
    };
  }

  function removeSavedChoice() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Continue with denied consent.
    }
  }

  function getSavedChoice() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const record = JSON.parse(stored);
      const timestamp = Date.parse(record.timestamp);
      const age = Date.now() - timestamp;

      const validChoice =
        record.choice === "accepted" ||
        record.choice === "rejected";

      const validRecord =
        record.version === CONSENT_VERSION &&
        validChoice &&
        Number.isFinite(timestamp) &&
        age >= 0 &&
        age <= MAX_AGE_MS;

      if (!validRecord) {
        removeSavedChoice();
        return null;
      }

      return record.choice;
    } catch (error) {
      removeSavedChoice();
      return null;
    }
  }

  function saveChoice(choice) {
    const record = {
      version: CONSENT_VERSION,
      choice: choice,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(record)
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // 1. Set denied defaults BEFORE loading GTM.
  window.gtag(
    "consent",
    "default",
    consentState("rejected")
  );

  // 2. Restore any valid saved preference.
  const savedChoice = getSavedChoice();

  if (savedChoice) {
    window.gtag(
      "consent",
      "update",
      consentState(savedChoice)
    );
  }

  // 3. Expose the consent API to the banner.
  window.NISRAConsent = {
    getChoice: getSavedChoice,

    setChoice: function (choice) {
      if (
        choice !== "accepted" &&
        choice !== "rejected"
      ) {
        throw new Error("Invalid consent choice");
      }

      // Apply the choice even if storage is unavailable.
      window.gtag(
        "consent",
        "update",
        consentState(choice)
      );

      const saved = saveChoice(choice);

      window.dataLayer.push({
        event: "nisra_consent_updated",
        consent_choice: choice
      });

      window.dispatchEvent(
        new CustomEvent("nisra_consent_updated", {
          detail: { choice: choice, saved: saved }
        })
      );

      return saved;
    }
  };

  // 4. Load GTM exactly once, after consent setup.
  if (!window.__nisraGtmLoaded) {
    window.__nisraGtmLoaded = true;

    window.dataLayer.push({
      "gtm.start": Date.now(),
      event: "gtm.js"
    });

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtm.js?id=" +
      encodeURIComponent(GTM_CONTAINER_ID);

    const firstScript = document.scripts[0];

    if (firstScript) {
      firstScript.parentNode.insertBefore(
        script,
        firstScript
      );
    } else {
      document.head.appendChild(script);
    }
  }
})();
