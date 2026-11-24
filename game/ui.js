/* Town Hall: the game's screens. Builds everything with DOM methods (no innerHTML of game text). */
(function (TH) {
  const root = document.getElementById("game");
  const live = document.getElementById("game-live");
  let G = null;        // current game
  let R = null;        // current round state

  /* ---------- tiny DOM helper ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (v === false || v == null) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "style") el.setAttribute("style", v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : String(c)); });
    return el;
  }
  const say = (msg) => { live.textContent = ""; setTimeout(() => (live.textContent = msg), 30); };
  function show(...nodes) {
    root.replaceChildren(...nodes);
    const head = root.querySelector("h2, h3");
    if (head) { head.setAttribute("tabindex", "-1"); head.focus({ preventScroll: true }); }
    const top = document.getElementById("play").getBoundingClientRect().top + window.scrollY - 72;
    if (window.scrollY > top) window.scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  const groupOf = (id) => TH.GROUPS.find((g) => g.id === id);
  const levelOf = (id) => TH.LEVELS.find((l) => l.id === id);

  /* ---------- shared pieces ---------- */
  function statusBar() {
    const n = G.round + 1, total = G.rounds.length;
    return h("div", { class: "g-status" },
      h("div", { class: "g-status-top" },
        h("span", { class: "g-round" }, `Problem ${Math.min(n, total)} of ${total}`),
        h("span", { class: "g-budget" + (G.budget < 15000 ? " is-low" : "") }, h("span", { class: "g-label" }, "Town budget "), TH.money(G.budget))),
      h("div", { class: "g-meters" }, TH.GROUPS.map((g) => {
        const v = G.happiness[g.id];
        return h("div", { class: "g-meter" },
          h("span", { class: "g-meter-name" }, h("span", { "aria-hidden": "true" }, g.icon + " "), h("span", { class: "g-meter-label" }, g.name)),
          h("span", { class: "g-bar", role: "meter", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": v, "aria-label": `${g.name} happiness` },
            h("span", { class: "g-bar-fill" + (v < 35 ? " is-low" : v > 70 ? " is-high" : ""), style: `width:${v}%` })),
          h("span", { class: "g-meter-val" }, v));
      })));
  }

  function personCard(issue) {
    const g = groupOf(issue.from);
    return h("div", { class: "g-request" },
      h("p", { class: "g-request-from" }, h("span", { "aria-hidden": "true" }, g.icon + " "), issue.person, " · ", g.name),
      h("p", { class: "g-request-story" }, "“" + issue.story + "”"));
  }

  function effectChips(plan) {
    const chips = [];
    Object.keys(TH.CARES).forEach((k) => {
      const v = plan.effects[k] || 0;
      if (!v) return;
      const arrows = (v > 0 ? "▲" : "▼").repeat(Math.abs(v));
      chips.push(h("span", { class: "g-chip " + (v > 0 ? "is-up" : "is-down") },
        h("span", { "aria-hidden": "true" }, arrows + " "), TH.CARES[k].label,
        h("span", { class: "sr-only" }, ` ${v > 0 ? "up" : "down"} ${Math.abs(v)}`)));
    });
    return h("div", { class: "g-chips" }, chips);
  }
  const costText = (c) => (c > 0 ? "Costs " + TH.money(c) : c < 0 ? "Earns " + TH.money(c) : "Free");

  function avatar(m) {
    return h("span", { class: "g-avatar", style: `background:${m.color}`, "aria-hidden": "true" }, m.name[0]);
  }

  /* ---------- screens ---------- */
  function intro() {
    show(h("div", { class: "g-card g-intro" },
      h("p", { class: "kicker" }, "A YCN NJ civics game"),
      h("h2", null, "Welcome to the Lantern Hill town council!"),
      h("p", { class: "g-lede" }, "You were just elected to the council of Lantern Hill, a small town in New Jersey. Residents are bringing you their problems. Can you help them, keep the budget healthy, and win your council's votes?"),
      h("ol", { class: "g-how" },
        h("li", null, h("strong", null, "Figure out whose job it is."), " Some problems belong to the town. Others belong to the school board, the county, the state or the federal government."),
        h("li", null, h("strong", null, "Pick a plan."), " Every plan costs money and helps some people more than others."),
        h("li", null, h("strong", null, "Win the vote."), " You need 3 of 5 votes. Meet with council members, tweak your plan, then call the vote.")),
      h("h3", { class: "g-sub" }, "Meet your fellow council members"),
      h("div", { class: "g-council-intro" }, TH.COUNCIL.map((m) =>
        h("div", { class: "g-member-intro" }, avatar(m),
          h("div", null, h("strong", null, m.name), h("span", { class: "g-motto" }, m.motto), h("p", null, m.about))))),
      h("button", { class: "btn btn-pine g-start", type: "button", onclick: start }, "Start your first meeting →")));
  }

  function start() {
    G = TH.newGame();
    G.terms.add("municipality");
    say("New game started.");
    nextRound();
  }

  function nextRound() {
    if (G.round >= G.rounds.length) return report();
    const r = G.rounds[G.round];
    R = { kind: r.kind, issue: r.issue, talked: {}, talks: TH.TALKS_PER_ISSUE, attempts: 0, option: null, amendment: null };
    whoseJob();
  }

  function whoseJob() {
    const { issue } = R;
    show(statusBar(), h("div", { class: "g-card" },
      h("p", { class: "kicker" }, "New problem"),
      h("h2", null, issue.title),
      personCard(issue),
      h("h3", { class: "g-step" }, h("span", null, "Step 1"), "Whose job is it to fix this?"),
      h("div", { class: "g-levels", role: "group", "aria-label": "Choose who is responsible" },
        TH.LEVELS.map((l) => h("button", { class: "g-level", type: "button", onclick: () => answerJob(l.id) },
          h("strong", null, l.label), h("span", null, l.sub))))));
  }

  function answerJob(choice) {
    const { issue, kind } = R;
    const correctId = kind === "town" ? "town" : issue.answer;
    const correct = choice === correctId;
    R.jobCorrect = correct;
    if (correctId === "school") G.terms.add("Board of Education");
    if (correctId === "county") G.terms.add("county");
    const explain = kind === "town" ? issue.fact : issue.explain;
    const verdict = correct
      ? (kind === "town" ? "Yes! This one is the town's job." : `Right! This is a job for ${levelOf(correctId).the}.`)
      : `Not quite. This is a job for ${levelOf(correctId).the}.`;
    say(verdict);

    const body = [statusBar(), h("div", { class: "g-card" },
      h("p", { class: "kicker" }, issue.title),
      h("h2", { class: correct ? "g-good" : "g-bad" }, h("span", { "aria-hidden": "true" }, correct ? "✓ " : "✗ "), verdict),
      h("p", { class: "g-explain" }, explain),
      kind === "other" ? otherOutcome(correct) : null,
      h("div", { class: "g-actions" },
        kind === "town"
          ? h("button", { class: "btn btn-pine", type: "button", onclick: choosePlan }, "Choose a plan →")
          : h("button", { class: "btn btn-pine", type: "button", onclick: finishOther }, "Next problem →")))];
    show(...body);
  }

  function otherOutcome(correct) {
    const g = groupOf(R.issue.from);
    R.otherChange = correct ? 3 : 0;
    if (correct) G.terms.add("resolution");
    return h("div", { class: "g-result-box" },
      h("p", null, h("strong", null, "What the council does: "), R.issue.action),
      correct ? h("p", { class: "g-delta is-up" }, `${g.name} appreciate the help: +3 happiness`) : h("p", { class: "g-muted" }, "Knowing who to ask is half the battle. You'll get it next time!"));
  }

  function finishOther() {
    if (R.otherChange) TH.applyChanges(G, { [R.issue.from]: R.otherChange }, 0);
    G.record.push({ kind: "other", id: R.issue.id, jobCorrect: R.jobCorrect });
    G.round++;
    nextRound();
  }

  function choosePlan() {
    const { issue } = R;
    show(statusBar(), h("div", { class: "g-card" },
      h("p", { class: "kicker" }, issue.title),
      h("h3", { class: "g-step" }, h("span", null, "Step 2"), "Pick a plan to bring to the council"),
      personCard(issue),
      h("div", { class: "g-options" }, issue.options.map((o) => {
        const tooMuch = o.cost > G.budget;
        return h("button", { class: "g-option", type: "button", disabled: tooMuch, onclick: () => { R.option = o; R.amendment = null; council(); } },
          h("span", { class: "g-option-title" }, o.title),
          h("span", { class: "g-option-cost" + (o.cost < 0 ? " is-earn" : "") }, tooMuch ? "Not enough money in the budget" : costText(o.cost)),
          effectChips(o));
      })),
      h("div", { class: "g-actions g-actions-tight" },
        h("button", { class: "g-link", type: "button", onclick: tableIt },
          issue.options.every((o) => o.cost > G.budget) ? "The budget can't cover any plan. Set this problem aside →" : "Set this problem aside for now"))));
  }

  function tableIt() {
    const plan = { cost: 0, effects: {} };
    const changes = TH.groupChanges(plan, R.issue, false);
    TH.applyChanges(G, changes, 0);
    G.record.push({ kind: "town", id: R.issue.id, jobCorrect: R.jobCorrect, passed: false });
    const g = groupOf(R.issue.from);
    say(`You set the problem aside. ${g.name} are disappointed.`);
    show(statusBar(), h("div", { class: "g-card" },
      h("p", { class: "kicker" }, R.issue.title),
      h("h2", { class: "g-bad" }, "Problem set aside"),
      h("p", { class: "g-explain" }, "Sometimes a council decides to wait, often because there isn't enough money. But the residents who asked for help are still waiting."),
      deltas(changes, 0),
      h("div", { class: "g-actions" }, h("button", { class: "btn btn-pine", type: "button", onclick: () => { G.round++; nextRound(); } },
        G.round + 1 >= G.rounds.length ? "See your report card →" : "Next problem →"))));
  }

  function ctx() { return { budget: G.budget, talked: R.talked, amendment: R.amendment, issue: R.issue }; }

  function council() {
    const plan = TH.effectivePlan(R.option, R.amendment);
    const tally = TH.countVotes(plan, ctx());
    const canHearing = R.talks > 0 || R.amendment === "hearing";

    const amendBtns = [{ id: null, title: "No changes", desc: "Bring the plan as it is." }].concat(TH.AMENDMENTS).map((a) => {
      const disabled = a.id === "hearing" && !canHearing;
      return h("button", { class: "g-amend", type: "button", "aria-pressed": String(R.amendment === a.id), disabled,
        onclick: () => {
          if (R.amendment === "hearing" && a.id !== "hearing") R.talks++;
          if (a.id === "hearing" && R.amendment !== "hearing") R.talks--;
          R.amendment = a.id; council();
        } },
        h("strong", null, a.title), h("span", null, disabled ? "You have no meetings left for a hearing." : a.desc));
    });

    show(statusBar(), h("div", { class: "g-card" },
      h("p", { class: "kicker" }, R.issue.title),
      h("h3", { class: "g-step" }, h("span", null, "Step 3"), "Win the council's vote"),
      h("div", { class: "g-plan" },
        h("p", { class: "g-plan-label" }, "Your plan"),
        h("p", { class: "g-plan-title" }, R.option.title, R.amendment === "pilot" ? " (one-year pilot)" : ""),
        h("p", { class: "g-option-cost" + (plan.cost < 0 ? " is-earn" : "") }, costText(plan.cost)),
        effectChips(plan),
        h("button", { class: "g-link", type: "button", onclick: choosePlan }, "← Pick a different plan")),
      h("p", { class: "g-plan-label" }, "Change your plan? (optional)"),
      h("div", { class: "g-amends" }, amendBtns),
      h("div", { class: "g-council-head" },
        h("p", { class: "g-plan-label" }, "The council"),
        h("p", { class: "g-talks" }, `Meetings left: ${R.talks}`)),
      h("p", { class: "g-you" }, h("span", { class: "g-avatar g-avatar-you", "aria-hidden": "true" }, "You"),
        h("span", null, h("strong", null, "You"), " will vote yes. It's your plan!")),
      h("div", { class: "g-council" }, tally.views.map((v) => seat(v))),
      h("p", { class: "g-tally", "aria-live": "polite" },
        `Expected vote: ${tally.yes} yes, ${tally.no} no. You need 3 to pass.`),
      h("div", { class: "g-actions" },
        h("button", { class: "btn btn-pine", type: "button", onclick: () => vote(plan) }, "Call the vote 🔔"))));
  }

  function seat(v) {
    const m = v.member, met = !!R.talked[m.id];
    const lean = v.yes ? (v.close ? "Leaning yes" : "Voting yes") : (v.close ? "On the fence" : "Leaning no");
    const cls = v.yes ? "is-yes" : v.close ? "is-maybe" : "is-no";
    return h("div", { class: "g-seat" }, avatar(m),
      h("div", { class: "g-seat-body" },
        h("strong", null, m.name), h("span", { class: "g-motto" }, m.motto),
        h("span", { class: "g-lean " + cls }, lean),
        met ? h("ul", { class: "g-reasons", "aria-label": m.name + " says" }, v.reasons.map((r) => h("li", { class: r.value > 0 ? "is-up" : "is-down" }, "“" + r.text + "”"))) : null,
        !met && R.talks > 0 ? h("button", { class: "g-meet", type: "button",
          onclick: () => { R.talked[m.id] = true; R.talks--; say(`You met with ${m.name}.`); council(); } },
          `Meet with ${m.name}`) : null));
  }

  function vote(plan) {
    R.attempts++;
    const tally = TH.countVotes(plan, ctx());
    if (R.amendment) G.terms.add("amendment");
    if (R.amendment === "pilot") G.terms.add("pilot program");
    if (R.amendment === "hearing") G.terms.add("public hearing");
    const canRetry = !tally.passed && R.attempts < 2;
    let changes = null;
    if (tally.passed || !canRetry) {
      changes = TH.groupChanges(plan, R.issue, tally.passed);
      TH.applyChanges(G, changes, tally.passed ? plan.cost : 0);
      if (tally.passed) G.terms.add("ordinance");
      G.record.push({ kind: "town", id: R.issue.id, jobCorrect: R.jobCorrect, passed: tally.passed, option: R.option.id });
    }
    say(tally.passed ? `Your plan passed, ${tally.yes} to ${tally.no}.` : `Your plan failed, ${tally.yes} to ${tally.no}.`);

    const roll = h("ol", { class: "g-roll" },
      h("li", { class: "is-yes", style: "--i:0" }, h("strong", null, "You: "), "Yes"),
      tally.views.map((v, i) => h("li", { class: v.yes ? "is-yes" : "is-no", style: `--i:${i + 1}` },
        h("strong", null, v.member.name + ": "), v.yes ? "Yes" : "No",
        v.reasons[0] ? h("span", { class: "g-roll-why" }, " “" + v.reasons[0].text + "”") : null)));

    show(statusBar(), h("div", { class: "g-card" },
      h("p", { class: "kicker" }, R.issue.title),
      h("h2", { class: tally.passed ? "g-good" : "g-bad" },
        tally.passed ? `Passed, ${tally.yes} to ${tally.no}! 🎉` : `Didn't pass: ${tally.yes} to ${tally.no}`),
      h("p", { class: "g-explain" }, tally.passed
        ? `The council approved “${R.option.title.toLowerCase()}.” A local law like this is called an ordinance.`
        : "A plan needs a majority, at least 3 of 5 votes, to pass."),
      h("p", { class: "g-plan-label" }, "Roll call"),
      roll,
      changes ? deltas(changes, tally.passed ? plan.cost : 0) : null,
      h("div", { class: "g-actions" },
        canRetry ? h("button", { class: "btn btn-pine", type: "button", onclick: council }, "Revise your plan and try again") : null,
        canRetry ? h("button", { class: "g-link", type: "button", onclick: () => giveUp(plan) }, "Move on without a plan") : null,
        !canRetry ? h("button", { class: "btn btn-pine", type: "button", onclick: () => { G.round++; nextRound(); } },
          G.round + 1 >= G.rounds.length ? "See your report card →" : "Next problem →") : null)));
  }

  function giveUp(plan) {
    const changes = TH.groupChanges(plan, R.issue, false);
    TH.applyChanges(G, changes, 0);
    G.record.push({ kind: "town", id: R.issue.id, jobCorrect: R.jobCorrect, passed: false });
    G.round++;
    nextRound();
  }

  function deltas(changes, cost) {
    const items = TH.GROUPS.filter((g) => changes[g.id]).map((g) => {
      const d = changes[g.id];
      return h("li", { class: d > 0 ? "is-up" : "is-down" }, `${g.name} ${d > 0 ? "+" : ""}${d}`);
    });
    if (cost) items.unshift(h("li", { class: cost > 0 ? "is-down" : "is-up" }, `Budget ${cost > 0 ? "−" : "+"}${TH.money(cost)}`));
    return items.length ? h("div", null, h("p", { class: "g-plan-label" }, "What changed"), h("ul", { class: "g-deltas" }, items)) : null;
  }

  function report() {
    const r = TH.report(G);
    say(`Game over. Your title: ${r.title}.`);
    const terms = Object.keys(TH.GLOSSARY).filter((t) => G.terms.has(t));
    show(h("div", { class: "g-card g-report" },
      h("p", { class: "kicker" }, "Your civic report card"),
      h("h2", null, r.title),
      h("p", { class: "g-lede" }, r.blurb),
      h("dl", { class: "g-stats" },
        h("div", null, h("dt", null, "Plans passed"), h("dd", null, `${r.passed} of ${r.total}`)),
        h("div", null, h("dt", null, "Whose job? correct"), h("dd", null, `${r.jobs} of ${r.rounds}`)),
        h("div", null, h("dt", null, "Budget left"), h("dd", null, TH.money(G.budget))),
        h("div", null, h("dt", null, "Average happiness"), h("dd", null, r.avg))),
      h("div", { class: "g-meters g-meters-final" }, TH.GROUPS.map((g) => {
        const v = G.happiness[g.id];
        return h("div", { class: "g-meter" },
          h("span", { class: "g-meter-name" }, h("span", { "aria-hidden": "true" }, g.icon + " "), g.name),
          h("span", { class: "g-bar", role: "meter", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": v, "aria-label": `${g.name} happiness` },
            h("span", { class: "g-bar-fill" + (v < 35 ? " is-low" : v > 70 ? " is-high" : ""), style: `width:${v}%` })),
          h("span", { class: "g-meter-val" }, v));
      })),
      h("h3", { class: "g-sub" }, "Civics words you used"),
      h("dl", { class: "g-terms" }, terms.map((t) => h("div", null, h("dt", null, t[0].toUpperCase() + t.slice(1)), h("dd", null, TH.GLOSSARY[t])))),
      nextSteps(),
      h("div", { class: "g-actions" },
        h("button", { class: "btn btn-pine", type: "button", onclick: start }, "Play again with new problems"))));
  }

  /* After the game: point players to the real thing. */
  function nextSteps() {
    const link = (key) => (window.YCN && window.YCN.linkFor ? window.YCN.linkFor(key) : "/#join");
    return h("section", { class: "g-next", "aria-labelledby": "g-next-title" },
      h("p", { class: "kicker" }, "Liked being on the council?"),
      h("h3", { id: "g-next-title" }, "Do civics for real with YCN"),
      h("p", { class: "g-next-lede" }, "Real towns make decisions just like Lantern Hill. Here's how you can be part of it."),
      h("div", { class: "g-next-paths" },
        h("article", { class: "g-next-path" },
          h("p", { class: "g-next-for" }, "In grades 4–8?"),
          h("h4", null, "Come to a YCN class"),
          h("p", null, "Join a monthly civics class near you, taught by high schoolers, with hands-on games and activities."),
          h("a", { class: "btn btn-light", href: "/#chapters" }, "Find a class near you")),
        h("article", { class: "g-next-path" },
          h("p", { class: "g-next-for" }, "In high school?"),
          h("h4", null, "Lead the way"),
          h("p", null, "Start a YCN chapter in your town as a Local Chapter Leader, or join our Policy team."),
          h("div", { class: "g-next-actions" },
            h("a", { class: "btn btn-light", href: link("lcl") }, "Become an LCL"),
            h("a", { class: "btn btn-outline", href: link("policy") }, "Join the Policy team")))),
      h("p", { class: "g-next-teachers" }, "Teacher or parent? ",
        h("a", { href: link("book") }, "Book a personalized YCN lesson for your class or group →")));
  }

  intro();
})(globalThis.TH);
