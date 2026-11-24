/* Town Hall: a YCN NJ civics game
   ------------------------------------------------------------------
   All game content lives here so it can be reviewed and edited
   without touching the game logic. The town, people and places are
   fictional. Nothing here is about political parties.

   Effects use five "things people care about", each from -3 to +3:
     safety, kids, nature, business, community
   plus `cost` in dollars (a negative cost means the town earns money).
   ------------------------------------------------------------------ */
(function (TH) {
  TH.TOWN = "Lantern Hill";
  TH.START_BUDGET = 60000;
  TH.TALKS_PER_ISSUE = 2;

  TH.CARES = {
    safety:    { label: "Safety",       up: "makes the town safer",        down: "makes the town less safe" },
    kids:      { label: "Kids & learning", up: "is good for kids",          down: "is bad for kids" },
    nature:    { label: "Parks & nature", up: "helps parks and nature",    down: "hurts parks and nature" },
    business:  { label: "Local shops",  up: "helps local shops",           down: "hurts local shops" },
    community: { label: "Community",    up: "brings neighbors together",   down: "pulls neighbors apart" },
  };

  /* Your four fellow council members. They have priorities, not parties. */
  TH.COUNCIL = [
    { id: "rosa",   name: "Rosa",   color: "#1e6f60", motto: "Safety first",
      about: "Rosa was a school crossing guard for 20 years. She cares most about keeping people safe, especially kids.",
      cares: { safety: 2, kids: 1, budget: 0.5 } },
    { id: "marcus", name: "Marcus", color: "#91735b", motto: "Watches every dollar",
      about: "Marcus is an accountant. He wants every tax dollar spent wisely and the town to keep money saved for emergencies.",
      cares: { budget: 2, business: 0.5, safety: 0.5 } },
    { id: "priya",  name: "Priya",  color: "#3f9591", motto: "Parks & nature",
      about: "Priya leads the Lantern Hill garden club. She cares about parks, trees and bringing neighbors together.",
      cares: { nature: 2, community: 1, kids: 0.25 } },
    { id: "walt",   name: "Walt",   color: "#c69c6e", motto: "Main Street matters",
      about: "Walt runs the hardware store on Main Street. He wants local shops to do well and the town to feel lively.",
      cares: { business: 2, community: 1, budget: 0.5 } },
  ];

  /* Groups of residents. Their happiness goes up and down with your choices. */
  TH.GROUPS = [
    { id: "families", name: "Families",    icon: "🏡", weights: { safety: 1, kids: 1, community: 0.5 } },
    { id: "seniors",  name: "Seniors",     icon: "🌳", weights: { safety: 1, nature: 0.5, community: 0.5, budget: 0.5 } },
    { id: "students", name: "Students",    icon: "🎒", weights: { kids: 1.5, nature: 0.5, community: 0.5 } },
    { id: "shops",    name: "Shop owners", icon: "🏪", weights: { business: 1.5, community: 0.5, budget: 0.25 } },
  ];

  TH.LEVELS = [
    { id: "town", the: "the town council",   label: "Town council",       sub: "Your town's local government" },
    { id: "school", the: "the Board of Education", label: "Board of Education", sub: "Runs the public schools" },
    { id: "county", the: "the county", label: "County",             sub: "One of New Jersey's 21 counties" },
    { id: "state", the: "the State of New Jersey",  label: "State of New Jersey", sub: "Governor, Legislature and state agencies" },
    { id: "federal", the: "the federal government", label: "Federal government", sub: "Washington, D.C." },
  ];

  /* Problems the council CAN solve. Each has three possible solutions. */
  TH.TOWN_ISSUES = [
    {
      id: "crosswalk", title: "The crosswalk on Elm Street",
      from: "families", person: "Ms. Alvarez, a parent",
      story: "Cars drive fast past Elm Street School, and kids have a hard time crossing the street in the morning. Can the town make it safer?",
      fact: "In New Jersey, towns can hire school crossing guards to help kids cross busy streets.",
      options: [
        { id: "paint", title: "Paint a new crosswalk and add signs", cost: 5000, effects: { safety: 1, kids: 1 } },
        { id: "guard", title: "Hire a crossing guard for the school", cost: 18000, effects: { safety: 2, kids: 2, community: 1 } },
        { id: "lights", title: "Install flashing crosswalk lights", cost: 30000, effects: { safety: 3, kids: 1 } },
      ],
    },
    {
      id: "library", title: "Library hours",
      from: "students", person: "Jordan, a 7th grader",
      story: "The public library closes early and isn't open on Sundays, so there's nowhere quiet to study on the weekend. Could it stay open longer?",
      fact: "Most New Jersey towns help pay for their public library, which is run by a library board.",
      options: [
        { id: "sunday", title: "Open the library on Sundays", cost: 15000, effects: { kids: 2, community: 1 } },
        { id: "teens", title: "Start a teen volunteer program to help staff evening hours", cost: 4000, effects: { kids: 1, community: 2 } },
        { id: "bike", title: "Launch a book bike that visits parks", cost: 9000, effects: { kids: 1, community: 2, nature: 1 } },
      ],
    },
    {
      id: "lot", title: "The empty lot on Main Street",
      from: "shops", person: "Mr. Chen, owner of Chen's Bakery",
      story: "The town owns an empty lot on Main Street. It's full of weeds and broken glass. What should Lantern Hill do with it?",
      fact: "Towns decide how land can be used through zoning rules, which are passed as ordinances.",
      options: [
        { id: "garden", title: "Turn it into a community garden", cost: 8000, effects: { nature: 2, community: 2 } },
        { id: "sell", title: "Sell it to a builder for new shops", cost: -10000, effects: { business: 3, nature: -1 } },
        { id: "parking", title: "Build a small parking lot", cost: 12000, effects: { business: 2, nature: -2 } },
      ],
    },
    {
      id: "playground", title: "The broken playground",
      from: "families", person: "Sam, age 9",
      story: "The swings at Oak Park are broken and the slide is rusty. Kids in wheelchairs can't use any of it. Can the town fix it?",
      fact: "An accessible playground is designed so kids of all abilities can play together.",
      options: [
        { id: "fix", title: "Repair the old swings and slide", cost: 6000, effects: { kids: 1, safety: 1 } },
        { id: "new", title: "Build a new accessible playground", cost: 28000, effects: { kids: 3, community: 2, safety: 1 } },
        { id: "close", title: "Close the playground until next year", cost: 0, effects: { safety: 1, kids: -2 } },
      ],
    },
    {
      id: "festival", title: "The fall festival",
      from: "shops", person: "Ms. Okafor, owner of the Main Street toy shop",
      story: "Main Street shops have been quiet lately. Could the town host a fall festival to bring people downtown?",
      fact: "Towns often need a permit and a council vote to close streets for an event.",
      options: [
        { id: "fair", title: "Host a small street fair", cost: 7000, effects: { business: 2, community: 2 } },
        { id: "big", title: "Throw a big festival with fireworks", cost: 22000, effects: { business: 3, community: 3, nature: -1 } },
        { id: "skip", title: "Skip it this year to save money", cost: 0, effects: { business: -1, community: -1 } },
      ],
    },
    {
      id: "litter", title: "Litter in Riverside Park",
      from: "seniors", person: "Mr. Patel, who walks in the park every morning",
      story: "Riverside Park is covered in litter, and the trash cans are always overflowing. What can the town do?",
      fact: "A town's public works department takes care of things like parks, streets and trash pickup.",
      options: [
        { id: "cans", title: "Add more trash and recycling cans", cost: 4000, effects: { nature: 1, community: 0 } },
        { id: "cleanup", title: "Organize a volunteer cleanup day", cost: 1000, effects: { nature: 1, community: 2 } },
        { id: "ranger", title: "Hire a part-time park ranger", cost: 20000, effects: { nature: 2, safety: 1 } },
      ],
    },
  ];

  /* Problems that belong to someone else. The lesson is knowing who to ask. */
  TH.OTHER_ISSUES = [
    {
      id: "pothole", title: "A giant pothole on Route 99",
      from: "families", person: "Mr. Brooks, a bus driver",
      story: "There's a huge pothole on Route 99, the state highway that runs through town. Can the council fix it?",
      answer: "state",
      explain: "Route 99 is a state highway, so the New Jersey Department of Transportation takes care of it, not the town.",
      action: "The council passes a resolution asking the state to fix the pothole quickly.",
    },
    {
      id: "lunch", title: "The school lunch menu",
      from: "students", person: "Ava, a 5th grader",
      story: "The school lunches are always the same. Can the town council add more healthy choices to the menu?",
      answer: "school",
      explain: "Public schools are run by the Board of Education, which is separate from the town council. School board members decide things like lunch menus and school rules.",
      action: "You tell Ava when the next school board meeting is so she can speak during public comment.",
    },
    {
      id: "mail", title: "Missing mail",
      from: "seniors", person: "Mrs. Johnson, a retired teacher",
      story: "Mail on Maple Avenue has been late for weeks. Can the town fix the mail delivery?",
      answer: "federal",
      explain: "The U.S. Postal Service is part of the federal government, so mail is handled in Washington, not by the town.",
      action: "You help Mrs. Johnson contact her U.S. Representative's office, which can help with mail problems.",
    },
    {
      id: "trail", title: "The county park trail",
      from: "seniors", person: "Ms. Rivera, a hiker",
      story: "A bridge on the trail in Lantern Hill County Park washed out in a storm. Can the town rebuild it?",
      answer: "county",
      explain: "County parks are run by the county, not the town. New Jersey's 21 counties take care of county parks and county roads.",
      action: "The council writes to the county commissioners asking them to repair the bridge.",
    },
    {
      id: "mvc", title: "The long line at the MVC",
      from: "shops", person: "Leo, who just turned 17",
      story: "The line to get a driver's permit at the Motor Vehicle Commission took four hours! Can the town do something?",
      answer: "state",
      explain: "Driver's licenses come from the New Jersey Motor Vehicle Commission, a state agency.",
      action: "The council asks Lantern Hill's state legislators to look into the long lines.",
    },
  ];

  /* Ways to change a plan before the vote. */
  TH.AMENDMENTS = [
    { id: "pilot", title: "Make it a one-year pilot",
      desc: "Try it on a smaller scale first. It costs half as much, but the benefits are smaller too." },
    { id: "hearing", title: "Hold a public hearing first",
      desc: "Let residents speak at a council meeting. Every council member hears from the community, but it uses up one of your meetings." },
  ];

  TH.GLOSSARY = {
    ordinance: "A local law passed by a town council.",
    resolution: "An official statement from the council, often asking another level of government to act.",
    majority: "More than half. On a five-person council, that's at least three votes.",
    budget: "The plan for how much money the town will spend and on what.",
    amendment: "A change to a proposal before it's voted on.",
    "public hearing": "A meeting where residents can share their opinions before the council decides.",
    "pilot program": "A small, trial version of an idea, used to see if it works.",
    municipality: "A town, city, borough or township. New Jersey has 564 of them.",
    county: "A larger area made up of several towns. New Jersey has 21 counties.",
    "Board of Education": "The elected or appointed board that runs a town's public schools.",
  };
})(globalThis.TH = globalThis.TH || {});
