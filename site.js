/* Shared by every YCN NJ page. */
(function () {
  /* ------------------------------------------------------------------
     EDIT THESE LINKS. Paste each Google Form URL between the quotes.
     Any link left empty falls back to an email to the state inbox,
     so nothing on the site is ever a dead end.
     ------------------------------------------------------------------ */
  const LINKS = {
    lcl:    "https://docs.google.com/forms/d/1UYhS-SpGuTPJBoRbWd6klu7wYZXJddHsXnLIn36KJEM/viewform",  // Local Chapter Leader Interest - YCN NJ
    policy: "https://docs.google.com/forms/d/e/1FAIpQLSdUR1ZhtWIwKSgWHwo_g6d8huIlMfxuomDPG_PrO6q08OEJaA/viewform",  // Policy Team Application
    host:   "https://docs.google.com/forms/d/e/1FAIpQLScwSDzGuP5D3pSpzYpoCa_CJOVVJn-XEYsM2CRQOcJjruhG4A/viewform",  // Offer us a space
    book:   "https://docs.google.com/forms/d/e/1FAIpQLSdbLR-_1PwZUBv1T381yempPn4v-GyU_Ox_2jVCaUIDurVjpQ/viewform",  // Book a personalized lesson or civics experience
    partner: "",  // Optional form for school boards / town councils (otherwise opens an email)
    updates: "https://docs.google.com/forms/d/e/1FAIpQLScMV40Cbc3ZPrDLa7sHsSVmzaVbXFWmkcNi0P2aXIXR6vohqQ/viewform",  // Chapter session updates form
  };
  /* Optional: make each chapter card preselect its town in the updates form.
     In the form, open ⋮ → "Get pre-filled link", pick any chapter, click "Get link",
     and copy the "entry.123456789" part of that link into the quotes below.
     Each card sends its data-chapter name (or data-prefill, if set), which must
     match the form's answer option exactly. */
  const UPDATES_CHAPTER_FIELD = "entry.98346331";
  const EMAIL = "youthcivicsnetworknj@gmail.com";

  const SUBJECTS = {
    lcl: "I want to start a YCN NJ chapter",
    policy: "Policy department application",
    host: "Hosting YCN NJ at our venue",
    book: "Booking a personalized lesson",
    partner: "Working with YCN NJ Policy (school board / town council)",
  };
  const BODIES = {
    partner: "Name and role:\nBoard or council:\nTown:\nWhat you'd like to discuss:\n",
    host: "Venue name:\nTown:\nPreferred days/times:\nRoom capacity:\nContact name & phone:\n",
  };
  const mailto = (subject, body = "") =>
    `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}${body ? "&body=" + encodeURIComponent(body) : ""}`;

  document.querySelectorAll("[data-link]").forEach((a) => {
    const key = a.dataset.link;
    if (LINKS[key]) {
      a.href = LINKS[key];
    } else {
      a.href = mailto(SUBJECTS[key], BODIES[key]);
    }
  });
  // Chapter cards (Education page only)
  document.querySelectorAll("[data-chapter]").forEach((a) => {
    const chapter = a.dataset.chapter;
    const answer = a.dataset.prefill || chapter;
    if (LINKS.updates) {
      a.href = UPDATES_CHAPTER_FIELD
        ? `${LINKS.updates}?usp=pp_url&${UPDATES_CHAPTER_FIELD}=${encodeURIComponent(answer)}`
        : LINKS.updates;
    } else {
      a.href = mailto(`Session updates: ${chapter} chapter`,
        "Parent/guardian name:\nChild's grade:\nBest email to reach you:\n");
    }
  });


  // Mobile nav
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", false); }
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     LOADER: shows the green YCN logo while the page loads and while
     the browser goes to another page (forms, slides, other sites).
     ------------------------------------------------------------------ */
  (function () {
    const loader = document.getElementById("loader");
    const MIN_MS = 450;        // keep it up long enough to read as intentional, not a flicker
    let safety;

    const hide = () => { clearTimeout(safety); loader.classList.add("is-hidden"); };
    const show = () => {
      loader.classList.remove("is-hidden");
      clearTimeout(safety);
      safety = setTimeout(hide, 10000); // never leave someone stuck if a page doesn't open
    };

    // First page load
    const finishFirstLoad = () => setTimeout(hide, Math.max(0, MIN_MS - performance.now()));
    if (document.readyState === "complete") finishFirstLoad();
    else window.addEventListener("load", finishFirstLoad);
    setTimeout(hide, 4000); // slow connection: show the page anyway

    // Coming back with the Back/Forward buttons: no loader at all
    const hideInstantly = () => {
      loader.style.transition = "none";
      hide();
      requestAnimationFrame(() => requestAnimationFrame(() => { loader.style.transition = ""; }));
    };
    window.addEventListener("pageshow", (e) => { if (e.persisted) hideInstantly(); });

    // Education <-> Policy: slide the switch, then fade between the pages (no loader).
    const side = (p) => { p = p.replace(/\.html$/, "").replace(/\/index$/, "/"); return p === "/" ? "education" : p === "/policy" ? "policy" : ""; };
    let switching = false;
    // Only the switch gets the page-to-page fade; every other link keeps the loader.
    window.addEventListener("pageswap", (e) => { if (e.viewTransition && !switching) e.viewTransition.skipTransition(); });

    function switchTo(url) {
      switching = true;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const sw = document.querySelector(".site-switch");
      if (sw) sw.dataset.active = side(url.pathname);                      // slide the white pill
      if (!("CSSViewTransitionRule" in window)) document.documentElement.classList.add("switch-leave");
      setTimeout(() => { location.href = url.href; }, reduce ? 0 : 300);  // let the slide finish first
    }
    window.addEventListener("pageshow", (e) => {                          // back after a switch: reset
      if (!e.persisted) return;
      switching = false;
      document.documentElement.classList.remove("switch-leave");
      const sw = document.querySelector(".site-switch");
      if (sw && side(location.pathname)) sw.dataset.active = side(location.pathname);
    });

    // Leaving for another page
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab / window
      if (a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, location.href);
      if (!/^https?:$/.test(url.protocol)) return;                                   // mailto:, tel:
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) return; // same-page jump
      if (a.closest(".site-switch") && url.origin === location.origin && side(url.pathname) === side(location.pathname)) {
        return e.preventDefault();                                           // already on this side
      }
      e.preventDefault();
      if (url.origin === location.origin && side(url.pathname) && side(location.pathname) && side(url.pathname) !== side(location.pathname)) {
        return switchTo(url);
      }
      show();
      // let the loader paint before the browser starts leaving
      requestAnimationFrame(() => requestAnimationFrame(() => { location.href = url.href; }));
    });
  })();

})();
