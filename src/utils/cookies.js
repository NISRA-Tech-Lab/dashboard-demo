import { config } from '../config/config.js';

export function initCookieConsent(options = {}) {
  const {
    bannerId = 'cookie-banner',
    gtmId = 'GTM-WKK8ZWP',
    cookieDomain = '.nisra.gov.uk',
    cookieDays = 365
  } = options;

  const cookieBanner = document.getElementById(bannerId);
  if (!cookieBanner) return;

  const COOKIE_NAME = 'cookie-agreed';
  const ACCEPTED = '2';
  const REJECTED = '0';

  function getCookie(name) {
    const cookies = document.cookie
      ? document.cookie.split('; ')
      : [];

    for (const cookie of cookies) {
      if (cookie.startsWith(`${name}=`)) {
        return decodeURIComponent(
          cookie.substring(name.length + 1)
        );
      }
    }

    return null;
  }

  function setCookie(name, value, days) {
    const expires = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toUTCString();

    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    const rootDomain = cookieDomain.replace(/^\./, '');

    const isProductionDomain =
      hostname === rootDomain ||
      hostname.endsWith(`.${rootDomain}`);

    const domainAttribute = isProductionDomain
      ? `; Domain=${cookieDomain}`
      : '';

    const secureAttribute =
      protocol === 'https:' ? '; Secure' : '';

    document.cookie =
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
      `; Expires=${expires}` +
      `; Path=/` +
      domainAttribute +
      secureAttribute +
      `; SameSite=Lax`;
  }

  function hideBanner() {
    cookieBanner.style.display = 'none';
    cookieBanner.setAttribute('aria-hidden', 'true');
  }

  function showBanner() {
    cookieBanner.style.display = 'block';
    cookieBanner.removeAttribute('aria-hidden');
  }

  function loadGoogleTagManager() {
    if (window.__nisraGtmLoaded) return;

    window.__nisraGtmLoaded = true;

    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js'
    });

    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src =
      `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;

    const firstScript =
      document.getElementsByTagName('script')[0];

    firstScript.parentNode.insertBefore(
      gtmScript,
      firstScript
    );

    const iframe = document.createElement('iframe');
    iframe.src =
      `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';

    document.body.appendChild(iframe);
  }

  // Build the consent banner before loading GTM.
  cookieBanner.classList.add('cookies-infobar');



  cookieBanner.innerHTML = `
    <div class="container">
      <p>
        <strong>Cookies on ${config.title}</strong>
      </p>

      <p>
        This web page places small amounts of information
        known as cookies on your device.

        <a
          href="https://www.nisra.gov.uk/cookies"
          class="cookiesbarlink"
          target="_blank"
          rel="noopener noreferrer"
        >
          Find out more about cookies
        </a>.
      </p>

      <button
        id="accept-cookies"
        class="btn btn-secondary btn-primary"
        type="button"
      >
        Accept cookies
      </button>

      <button
        id="reject-cookies"
        class="btn btn-secondary btn-primary"
        type="button"
      >
        Reject cookies
      </button>
    </div>
  `;

  const acceptBtn =
    cookieBanner.querySelector('#accept-cookies');

  const rejectBtn =
    cookieBanner.querySelector('#reject-cookies');

  const existingConsent =
    getCookie(COOKIE_NAME);

  // Existing consent has already been given.
  if (existingConsent === ACCEPTED) {
    hideBanner();
    loadGoogleTagManager();
    return;
  }

  // Existing consent has already been rejected.
  if (existingConsent === REJECTED) {
    hideBanner();
    return;
  }

  // No previous decision.
  showBanner();

  acceptBtn?.addEventListener('click', () => {
    setCookie(
      COOKIE_NAME,
      ACCEPTED,
      cookieDays
    );

    hideBanner();
    loadGoogleTagManager();
  });

  rejectBtn?.addEventListener('click', () => {
    setCookie(
      COOKIE_NAME,
      REJECTED,
      cookieDays
    );

    hideBanner();
  });
}
