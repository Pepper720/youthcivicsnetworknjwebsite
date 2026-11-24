/* Town Hall game logic. No page code here, so it can be tested on its own. */
(function (TH) {
  const SAVINGS_FLOOR = 15000;   // Marcus gets nervous below this
  const YES_AT = 1.5;            // a member votes yes at or above this score
  const GOODWILL = 1;            // everyone starts out wanting to help residents

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const money = (n) => "$" + Math.abs(Math.round(n)).toLocaleString("en-US");
  TH.money = money;

  function shuffle(list, rand) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* A new game: 4 problems the town can fix, plus 2 that belong to someone else. */
  TH.newGame = function (rand = Math.random) {
    const town = shuffle(TH.TOWN_ISSUES, rand).slice(0, 4).map((i) => ({ kind: "town", issue: i }));
    const other = shuffle(TH.OTHER_ISSUES, rand).slice(0, 2).map((i) => ({ kind: "other", issue: i }));
    // Interleave: town, other, town, town, other, town
    const rounds = [town[0], other[0], town[1], town[2], other[1], town[3]];
    const happiness = {}; TH.GROUPS.forEach((g) => (happiness[g.id] = 50));
    return { round: 0, rounds, budget: TH.START_BUDGET, happiness, record: [], terms: new Set(["majority", "budget"]) };
  };

  /* Apply an amendment to a plan and return the effective plan. */
  TH.effectivePlan = function (option, amendment) {
    const effects = Object.assign({}, option.effects);
    let cost = option.cost;
    if (amendment === "pilot") {
      cost = cost > 0 ? Math.round(cost / 2 / 500) * 500 : cost;
      Object.keys(effects).forEach((k) => { if (effects[k] > 0) effects[k] = Math.max(0, effects[k] - 1); });
    }
    return { cost, effects };
  };

  /* How one council member feels about a plan, with reasons. */
  TH.memberView = function (member, plan, ctx) {
    const parts = [];
    Object.keys(TH.CARES).forEach((k) => {
      const w = member.cares[k] || 0, e = plan.effects[k] || 0;
      if (w && e) parts.push({ key: k, value: w * e, text: "It " + (e > 0 ? TH.CARES[k].up : TH.CARES[k].down) + "." });
    });
    if (member.cares.budget && plan.cost) {
      const v = -member.cares.budget * (plan.cost / 10000);
      parts.push({ key: "budget", value: v, text: plan.cost > 0 ? "It costs " + money(plan.cost) + "." : "It earns the town " + money(plan.cost) + "." });
    }
    if (member.id === "marcus" && plan.cost > 0 && ctx.budget - plan.cost < SAVINGS_FLOOR) {
      parts.push({ key: "savings", value: -2, text: "It leaves too little money saved for emergencies." });
    }
    if (ctx.talked && ctx.talked[member.id]) parts.push({ key: "talk", value: 1.5, text: "You took the time to listen to me." });
    if (ctx.amendment === "hearing" && ctx.issue) {
      const mood = TH.residentMood(plan, ctx.issue);
      if (mood > 0) parts.push({ key: "hearing", value: 1, text: "Residents spoke up for it at the hearing." });
      if (mood < 0) parts.push({ key: "hearing", value: -1.5, text: "Residents spoke against it at the hearing." });
    }
    if (ctx.amendment === "pilot" && member.id === "marcus") parts.push({ key: "pilot", value: 1.5, text: "I like testing an idea before spending more." });

    const score = GOODWILL + parts.reduce((s, p) => s + p.value, 0);
    const yes = score >= YES_AT;
    // Reasons that explain the vote: strongest first, matching its direction first.
    // Meetings, hearings and pilots only lead the explanation when they changed the vote.
    const SOCIAL = { talk: 1, hearing: 1, pilot: 1 };
    const minor = (p) => SOCIAL[p.key] && ((score - p.value >= YES_AT) === yes);
    const reasons = parts.slice().sort((a, b) => {
      const am = (a.value > 0) === yes, bm = (b.value > 0) === yes;
      if (am !== bm) return am ? -1 : 1;
      if (minor(a) !== minor(b)) return minor(a) ? 1 : -1;
      return Math.abs(b.value) - Math.abs(a.value);
    }).slice(0, 2);
    return { member, score, yes, close: Math.abs(score - YES_AT) < 1, reasons };
  };

  /* Would the residents who asked for help like this plan? */
  TH.residentMood = function (plan, issue) {
    const g = TH.GROUPS.find((x) => x.id === issue.from);
    let s = 0;
    Object.keys(g.weights).forEach((k) => { if (k !== "budget") s += g.weights[k] * (plan.effects[k] || 0); });
    return s;
  };

  TH.countVotes = function (plan, ctx) {
    const views = TH.COUNCIL.map((m) => TH.memberView(m, plan, ctx));
    const yes = 1 + views.filter((v) => v.yes).length;   // +1: you vote for your own plan
    return { views, yes, no: 5 - yes, passed: yes >= 3 };
  };

  /* Happiness changes for each group of residents. */
  TH.groupChanges = function (plan, issue, passed) {
    const out = {};
    TH.GROUPS.forEach((g) => {
      let d = 0;
      if (passed) {
        Object.keys(g.weights).forEach((k) => {
          if (k === "budget") d -= g.weights.budget * Math.max(0, plan.cost) / 10000;
          else d += g.weights[k] * (plan.effects[k] || 0);
        });
        d *= 3;
        if (issue.from === g.id) d += 3;
      } else if (issue.from === g.id) d = -6;
      out[g.id] = Math.round(d);
    });
    return out;
  };

  TH.applyChanges = function (game, changes, cost) {
    Object.keys(changes).forEach((k) => (game.happiness[k] = clamp(game.happiness[k] + changes[k], 0, 100)));
    if (cost) game.budget -= cost;
  };

  /* Final report card. */
  TH.report = function (game) {
    const town = game.record.filter((r) => r.kind === "town");
    const passed = town.filter((r) => r.passed).length;
    const jobs = game.record.filter((r) => r.jobCorrect).length;
    const avg = Math.round(TH.GROUPS.reduce((s, g) => s + game.happiness[g.id], 0) / TH.GROUPS.length);
    const points = avg + passed * 5 + jobs * 4 + (game.budget >= 0 ? Math.min(10, Math.round(game.budget / 2000)) : -10);
    const titles = [
      [118, "Civic Superstar", "Residents are lining up to thank you. Lantern Hill is thriving!"],
      [100, "Community Champion", "You got things done and kept most of the town happy."],
      [85, "Rising Council Member", "A solid first term. You're learning how to build support."],
      [0, "Rookie Council Member", "Every leader starts somewhere. Try different plans and talk to more council members."],
    ];
    const t = titles.find((x) => points >= x[0]);
    return { passed, total: town.length, jobs, rounds: game.record.length, avg, points, title: t[1], blurb: t[2] };
  };
})(globalThis.TH = globalThis.TH || {});
