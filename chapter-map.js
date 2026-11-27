/* 3D chapter map (Education page). Reads each chapter's name, status and
   sign-up link from the chapter cards below it, so the cards stay the one
   place to edit chapter details. To add a chapter: add its card, then add
   its spot to PLACES (x, y on the 377 × 670 map; see the note there). */
(function () {
  const root = document.getElementById("chapter-map");
  if (!root) return;

  /* Map spots. x/y are on the same 377 × 670 grid as NJ_PATH:
     x = (longitude + 75.62) × 195.1 + 20,  y = (41.40 − latitude) × 255 + 20.
     h = pin height before anything is picked, low = height while another is picked,
     fly = [tilt, turn, zoom] when picked. */
  const PLACES = {
    "Ridgewood":      { x: 313.4, y: 127.4, h: 185,  low: 28, fly: [58, -34, 1.55] },
    "Chatham":        { x: 261.3, y: 188.3, h: 130, low: 62, fly: [60, -8, 1.7] },
    "New Providence": { x: 258.0, y: 199.0, h: 70,  low: 24, fly: [60, 18, 1.7] },
    "Montgomery":     { x: 203.4, y: 268.4, h: 26,  low: 28, fly: [56, -26, 1.55] },
    "Bridgeton":      { x: 95.3,  y: 523.1, h: 60,  low: 28, fly: [54, 22, 1.5] },
  };
  const VIRTUAL = "Virtual";
  const VIRTUAL_FLY = [50, -16, 0.95];
  const VIRTUAL_SPOT = { x: 147, y: 101 };   // where the "Virtual" label floats (northwest corner)
  const START = { tilt: 56, rot: -16, zoom: 1 };
  const W = 377, H = 670;
  const NJ_PATH = "M200.6,31.0 L277.5,71.0 L356.7,122.0 L353.5,132.2 L341.8,160.2 L330.1,188.3 L326.2,198.5 L316.5,208.7 L304.8,213.8 L297.0,224.0 L287.2,236.8 L283.3,249.5 L297.0,257.1 L310.6,262.2 L324.3,269.9 L332.1,257.1 L337.9,269.9 L339.9,300.5 L336.0,320.9 L330.1,348.9 L324.3,377.0 L320.4,402.5 L316.5,438.2 L302.8,473.9 L279.4,504.5 L254.1,540.2 L222.9,563.1 L199.5,598.8 L176.0,632.0 L150.7,649.8 L146.8,644.7 L160.4,606.5 L144.8,583.6 L115.6,578.4 L92.2,568.2 L62.9,535.1 L37.6,514.7 L31.7,484.1 L41.5,458.6 L59.0,430.5 L96.1,412.7 L115.6,400.0 L131.2,382.1 L156.5,361.7 L183.8,346.4 L195.5,338.8 L185.8,320.9 L170.2,303.0 L150.7,287.7 L129.2,269.9 L127.3,241.8 L103.9,229.1 L101.9,201.1 L121.4,178.1 L125.3,155.2 L115.6,129.6 L146.8,101.6 L164.3,78.6 L181.9,48.0 Z";

  const SVG = "http://www.w3.org/2000/svg";
  const el = (tag, cls, parent) => { const n = document.createElement(tag); if (cls) n.className = cls; if (parent) parent.appendChild(n); return n; };
  const svgEl = (tag, attrs, parent) => { const n = document.createElementNS(SVG, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };

  // Chapters, from the cards
  const chapters = [];
  document.querySelectorAll("#chapters .chapter:not(.chapter-new)").forEach((card) => {
    const link = card.querySelector("[data-chapter]");
    if (!link) return;
    const name = link.dataset.chapter;
    const status = card.querySelector(".status");
    const tag = card.querySelector("h3 span:not(.new)");
    chapters.push({
      name, link,
      status: status ? status.textContent.trim() : "",
      go: !!(status && status.classList.contains("status-go")),
      region: name === VIRTUAL ? "All of New Jersey" : (tag ? tag.textContent.trim() : "New Jersey"),
      place: PLACES[name] || null,
    });
  });
  const pinned = chapters.filter((c) => c.place);
  const hasVirtual = chapters.some((c) => c.name === VIRTUAL);

  // ---- Build the stage ----
  const stage = el("div", "cmap-stage", root);
  el("p", "cmap-hint", stage).textContent = "Pick a chapter to fly there";
  const plane = el("div", "cmap-plane", stage);
  plane.style.width = W + "px"; plane.style.height = H + "px";

  for (let i = 14; i >= 1; i--) {   // the block's sides: stacked copies of the outline
    const s = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, "aria-hidden": "true" }, plane);
    s.style.transform = `translateZ(${-i * 1.5}px)`;
    svgEl("path", { d: NJ_PATH, fill: i > 9 ? "#00190f" : i > 4 ? "#002619" : "#003d29" }, s);
  }
  const top = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "Map of New Jersey showing YCN NJ chapters" }, plane);
  top.style.transform = "translateZ(1px)";
  const pat = svgEl("pattern", { id: "cmap-dots", width: 10, height: 10, patternUnits: "userSpaceOnUse" }, svgEl("defs", {}, top));
  svgEl("circle", { cx: 5, cy: 5, r: 1.1, fill: "#3f9591", "fill-opacity": ".55" }, pat);
  svgEl("path", { d: NJ_PATH, fill: "#1e6f60", stroke: "#3f9591", "stroke-width": 2, "stroke-linejoin": "round" }, top);
  svgEl("path", { d: NJ_PATH, fill: "url(#cmap-dots)" }, top);

  const stand = (parent) => el("div", "cmap-stand", parent);   // faces the viewer whatever the tilt
  const buttons = {};   // name → [map button, list button]

  let ghost, vAnchor;
  if (hasVirtual) {
    ghost = svgEl("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: "cmap-ghost", "aria-hidden": "true" }, plane);
    svgEl("path", { d: NJ_PATH }, ghost);
    vAnchor = el("div", "cmap-pin cmap-virtual", plane);
    vAnchor.style.left = VIRTUAL_SPOT.x + "px"; vAnchor.style.top = VIRTUAL_SPOT.y + "px";
    const st = stand(vAnchor);
    el("span", "cmap-vstem", st);
    const b = el("button", "cmap-chip", st);
    b.type = "button"; b.textContent = "Virtual · all of NJ";
    buttons[VIRTUAL] = [b];
  }

  pinned.forEach((c) => {
    const pin = el("div", "cmap-pin", plane);
    pin.style.left = c.place.x + "px"; pin.style.top = c.place.y + "px";
    pin.style.setProperty("--dot", c.go ? "#7fd3b8" : "#c69c6e");
    el("span", "cmap-pulse", pin);
    el("span", "cmap-dot", pin);
    const st = stand(pin);
    el("span", "cmap-stem", st);
    const b = el("button", "cmap-chip", st);
    b.type = "button";
    el("span", "cmap-chip-dot", b);
    b.appendChild(document.createTextNode(c.name));
    c.pin = pin;
    buttons[c.name] = [b];
  });

  const controls = el("div", "cmap-controls", stage);
  const reset = el("button", "cmap-reset", controls);
  reset.type = "button"; reset.textContent = "Reset view";
  const legend = el("div", "cmap-legend", stage);
  legend.innerHTML = '<span><i class="go"></i>Venue confirmed</span><span><i class="plan"></i>In planning</span>' +
    (hasVirtual ? '<span><i class="virtual"></i>Virtual</span>' : "");

  // ---- Side panel ----
  const panel = el("div", "cmap-panel", root);
  const list = el("div", "cmap-list", panel);
  chapters.forEach((c) => {
    const b = el("button", "cmap-row", list);
    b.type = "button";
    const dot = el("span", "cmap-row-dot", b);
    dot.style.background = c.name === VIRTUAL ? "#d5c8aa" : c.go ? "#7fd3b8" : "#c69c6e";
    b.appendChild(document.createTextNode(c.name));
    (buttons[c.name] = buttons[c.name] || []).push(b);
  });
  const card = el("div", "cmap-card", panel);
  card.setAttribute("aria-live", "polite");
  const cRegion = el("p", "cmap-card-region", card);
  const cName = el("h3", "cmap-card-name", card);
  const cStatus = el("p", "cmap-card-status", card);
  const cActions = el("div", "cmap-card-actions", card);
  const cLink = el("a", "btn btn-light", cActions);
  cLink.textContent = "Get session updates";
  const cStart = el("a", "cmap-card-start", cActions);
  cStart.textContent = "Start one in your town →";
  cStart.href = window.YCN ? window.YCN.linkFor("lcl") : "#join";

  // ---- State ----
  let sel = null, view = { tilt: START.tilt, rot: START.rot, zoom: START.zoom, ox: 0, oy: 0 };

  function fit() {   // scale the whole map to the stage
    const s = Math.min(stage.clientHeight / 752, stage.clientWidth / 760);
    stage.style.setProperty("--fit", Math.max(0.45, s).toFixed(3));
  }

  function render() {
    plane.style.transform =
      `translateY(calc(40px * var(--fit))) scale(calc(var(--fit) * ${view.zoom})) rotateX(${view.tilt}deg) rotateZ(${view.rot}deg) translate(${view.ox}px, ${view.oy}px)`;
    root.style.setProperty("--untilt", -view.tilt + "deg");
    root.style.setProperty("--unrot", -view.rot + "deg");
    root.classList.toggle("has-sel", !!sel);
    root.classList.toggle("virtual-sel", sel === VIRTUAL);

    pinned.forEach((c) => {
      const on = c.name === sel;
      c.pin.classList.toggle("is-on", on);
      c.pin.style.setProperty("--h", (on ? 150 : sel ? c.place.low : c.place.h) + "px");
    });
    if (vAnchor) vAnchor.classList.toggle("is-on", sel === VIRTUAL);
    for (const name in buttons) buttons[name].forEach((b) => b.setAttribute("aria-pressed", String(name === sel)));

    const c = chapters.find((k) => k.name === sel);
    if (c) {
      cRegion.textContent = c.region;
      cName.textContent = c.name;
      cStatus.textContent = c.status;
      cStatus.style.setProperty("--dot", c.name === VIRTUAL ? "#d5c8aa" : c.go ? "#7fd3b8" : "#c69c6e");
      cLink.href = c.link.href;
      cLink.hidden = false;
    } else {
      cRegion.textContent = "All of New Jersey";
      cName.textContent = "Pick a chapter";
      cStatus.textContent = "Tap a pin or a name to fly there.";
      cStatus.style.setProperty("--dot", "#d5c8aa");
      cLink.hidden = true;
    }
  }

  function pick(name) {
    const c = chapters.find((k) => k.name === name);
    const f = c && c.place ? c.place.fly : VIRTUAL_FLY;
    const turn = f[1] + 360 * Math.round((view.rot - f[1]) / 360);   // shortest way round
    sel = name;
    view = { tilt: f[0], rot: turn, zoom: f[2],
      ox: c && c.place ? Math.round(W / 2 - c.place.x) : 0,
      oy: c && c.place ? Math.round(H / 2 - c.place.y + 40) : 0 };
    render();
  }

  for (const name in buttons) buttons[name].forEach((b) => b.addEventListener("click", () => pick(name)));
  reset.addEventListener("click", () => { sel = null; view = { tilt: START.tilt, rot: START.rot, zoom: START.zoom, ox: 0, oy: 0 }; render(); });

  root.hidden = false;
  fit();
  window.addEventListener("resize", fit);
  render();
})();
