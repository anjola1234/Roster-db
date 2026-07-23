/* ============================================================
DATA LAYER — mirrors directory-database-D1-D5.xlsx
listings + custom_fields + funding_rounds + investors
+ regions (M2M) + tags/features. This config drives BOTH
the table columns and the detail sections per category.
NOTE: figures (funding, licences, accreditation) are SAMPLE
pilot data for the prototype — verify per source (D9).
============================================================ */

const REGIONS = {
  ng: {
    name: "Nigeria",
    cc: "NG",
    states: {
      lagos: "Lagos",
      fct: "Abuja (FCT)",
      rivers: "Rivers",
      oyo: "Oyo",
      kano: "Kano",
    },
  },
};

/* Category config = the "customizable" registry, front-end edition.
Adding a vertical later = adding an entry here (mirrors field_definitions). */
const CATEGORIES = {
  fintech: {
    id: "fintech",
    vertical: "Fintech",
    label: "Fintech",
    icon: "▲",
    accent: "#4F46E5",
    subs: ["Payments", "Lending", "Insurtech", "Wealthtech", "Digital Banks"],
    // table columns for this category
    columns: [
      "entity",
      "description",
      "funding",
      "investors",
      "region",
      "socials",
      "explore",
    ],
    featLabel: "Features",
    sorts: [
      ["az", "A - Z"],
      ["funding", "Most funded"],
      ["newest", "Newest"],
    ],
  },
  hospitals: {
    id: "hospitals",
    vertical: "Healthcare",
    label: "Hospitals",
    icon: "✚",
    accent: "#10B981",
    subs: ["General", "Specialist", "Teaching", "Clinic", "Diagnostic"],
    columns: [
      "entity",
      "location",
      "description",
      "specialties",
      "licence",
      "explore",
    ],
    featLabel: "Specialties",
    sorts: [
      ["az", "A - Z"],
      ["beds", "Most beds"],
      ["newest", "Newest"],
    ],
  },
};

/* Feature / specialty tag taxonomy (the second filter layer) */
const TAGS = {
  fintech: [
    { slug: "payment-gateway", name: "Payment Gateway", grp: "Payments" },
    { slug: "cross-border", name: "Cross-Border", grp: "Payments" },
    { slug: "virtual-cards", name: "Virtual Cards", grp: "Payments" },
    { slug: "ussd", name: "USSD", grp: "Payments" },
    { slug: "pos", name: "POS / Terminals", grp: "Payments" },
    { slug: "lending", name: "Lending", grp: "Credit" },
    { slug: "savings", name: "Savings", grp: "Wealth" },
    { slug: "investments", name: "Investments", grp: "Wealth" },
    { slug: "multi-currency", name: "Multi-currency", grp: "Payments" },
  ],
  hospitals: [
    { slug: "maternity", name: "Maternity", grp: "Specialty" },
    { slug: "cardiology", name: "Cardiology", grp: "Specialty" },
    { slug: "paediatrics", name: "Paediatrics", grp: "Specialty" },
    { slug: "oncology", name: "Oncology", grp: "Specialty" },
    { slug: "surgery", name: "Surgery", grp: "Specialty" },
    { slug: "dialysis", name: "Dialysis", grp: "Service" },
    { slug: "imaging", name: "Imaging", grp: "Service" },
    { slug: "emergency", name: "24/7 Emergency", grp: "Service" },
  ],
};

function tagName(cat, slug) {
  const t = (TAGS[cat] || []).find((x) => x.slug === slug);
  return t ? t.name : slug;
}

/* Hero cover photos — verified hotlink-safe Unsplash CDN ids.
Per-listing override via listing.heroImage; else per-slug; else category default.
The CSS layers a dark gradient over the photo, and a brand gradient shows
through if the photo ever fails to load. */
const HERO = {
  opay: "1533234944761-2f5337579079",
  flutterwave: "1616077167555-51f6bc516dfa",
  paystack: "1571867424488-4565932edb41",
  carbon: "1648091854674-59abf26bbf39",
  piggyvest: "1636115798885-68e47c928729",
  "reliance-hmo": "1517120026326-d87759a7b63b",
  "reddington-hospital": "1519494026892-80bbd2d6fd0d",
  "lagoon-hospitals": "1626315869436-d6781ba69d6e",
  "nisa-premier": "1587351021759-3e566b6af7cc",
  "first-cardiology": "1490351267196-b7a67e26e41b",
  "duchess-international": "1586773860418-d37222d8fce3",
};
const CAT_COVER = {
  fintech: "1533234944761-2f5337579079",
  hospitals: "1519494026892-80bbd2d6fd0d",
};
function heroFor(l) {
  const id = l.heroImage || HERO[l.slug] || CAT_COVER[l.category];
  return (
    "https://images.unsplash.com/photo-" +
    id +
    "?w=1600&q=70&auto=format&fit=crop"
  );
}

/* ---- Listings (base schema + per-category custom_fields) ---- */
const LISTINGS = [
  /* ---------------- FINTECH ---------------- */
  {
    slug: "opay",
    name: "OPay",
    logo: "O",
    color: "#0F9D58",
    category: "fintech",
    sub: "Payments",
    short: "Mobile money, payments and banking for everyday Africa.",
    long: "OPay lets millions send money, pay bills, buy airtime and access credit from a single app, backed by one of the continent\u2019s largest agent networks.",
    website: "https://opayweb.com",
    socials: { x: "#", linkedin: "#", instagram: "#" },
    regions: [
      { state: "lagos", primary: true },
      { state: "fct" },
      { state: "oyo" },
    ],
    tags: ["payment-gateway", "cross-border", "virtual-cards", "ussd"],
    verification: "verified",
    status: "active",
    rating: { score: 4.6, count: 128, dist: [72, 18, 6, 2, 2] },
    source: "CBN licensed operators register",
    lastVerified: "2026-06-01",
    cf: {
      foundingYear: 2018,
      businessModel: "B2B2C",
      employees: "500+",
      regulator: "Central Bank of Nigeria",
      licenses: ["Switching & Processing", "PSSP"],
      totalFunding: 570000000,
      valuation: 2000000000,
      valuationDate: "2021-11",
      investors: [
        { n: "SoftBank Vision Fund 2", t: "Growth" },
        { n: "Sequoia Capital China", t: "VC" },
        { n: "Source Code Capital", t: "VC" },
        { n: "Redpoint China", t: "VC" },
      ],
      rounds: [
        {
          r: "Series C",
          d: "2021-08",
          a: 400000000,
          l: "SoftBank Vision Fund 2",
        },
        {
          r: "Series B",
          d: "2019-11",
          a: 120000000,
          l: "Meituan / Sequoia",
        },
        {
          r: "Series A",
          d: "2019-06",
          a: 50000000,
          l: "Sequoia Capital China",
        },
      ],
    },
  },
  {
    slug: "flutterwave",
    name: "Flutterwave",
    logo: "F",
    color: "#F5A623",
    category: "fintech",
    sub: "Payments",
    short: "Payment infrastructure for businesses expanding across borders.",
    long: "Flutterwave provides APIs and tools that let businesses accept and make payments across Africa and beyond, from one integration.",
    website: "https://flutterwave.com",
    socials: { x: "#", linkedin: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: [
      "payment-gateway",
      "cross-border",
      "multi-currency",
      "virtual-cards",
    ],
    verification: "verified",
    status: "active",
    rating: { score: 4.5, count: 96, dist: [64, 22, 9, 3, 2] },
    source: "Company press releases",
    lastVerified: "2026-05-18",
    cf: {
      foundingYear: 2016,
      businessModel: "B2B",
      employees: "500+",
      regulator: "Central Bank of Nigeria",
      licenses: ["Switching & Processing", "PSSP"],
      totalFunding: 475000000,
      valuation: 3000000000,
      valuationDate: "2022-02",
      investors: [
        { n: "Tiger Global", t: "Growth" },
        { n: "Avenir Growth", t: "Growth" },
        { n: "B Capital", t: "VC" },
      ],
      rounds: [
        {
          r: "Series D",
          d: "2022-02",
          a: 250000000,
          l: "B Capital / Alta Park",
        },
        {
          r: "Series C",
          d: "2021-03",
          a: 170000000,
          l: "Avenir / Tiger Global",
        },
      ],
    },
  },
  {
    slug: "paystack",
    name: "Paystack",
    logo: "P",
    color: "#00C3F7",
    category: "fintech",
    sub: "Payments",
    short: "Modern online payments for African merchants.",
    long: "Paystack helps businesses in Africa get paid by anyone, anywhere, with a developer-friendly stack acquired by Stripe in 2020.",
    website: "https://paystack.com",
    socials: { x: "#", linkedin: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: ["payment-gateway", "pos", "multi-currency"],
    verification: "verified",
    status: "active",
    rating: { score: 4.7, count: 151, dist: [78, 15, 4, 2, 1] },
    source: "Company announcements",
    lastVerified: "2026-04-30",
    cf: {
      foundingYear: 2015,
      businessModel: "B2B",
      employees: "201 - 500",
      regulator: "Central Bank of Nigeria",
      licenses: ["PSSP"],
      totalFunding: 11000000,
      valuation: 200000000,
      valuationDate: "2020-10",
      investors: [
        { n: "Stripe", t: "Corporate" },
        { n: "Visa", t: "Corporate" },
        { n: "Y Combinator", t: "Accelerator" },
      ],
      rounds: [
        { r: "Acquisition", d: "2020-10", a: 200000000, l: "Stripe" },
        { r: "Series A", d: "2018-08", a: 8000000, l: "Visa / Stripe" },
      ],
    },
  },
  {
    slug: "carbon",
    name: "Carbon",
    logo: "C",
    color: "#5B34C4",
    category: "fintech",
    sub: "Lending",
    short: "Digital bank and consumer lending in one app.",
    long: "Carbon offers instant loans, payments, savings and bill payments to consumers, one of the earliest digital lenders in Nigeria.",
    website: "https://getcarbon.co",
    socials: { x: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: ["lending", "savings", "payment-gateway"],
    verification: "verified",
    status: "active",
    rating: { score: 4.1, count: 64, dist: [48, 30, 12, 6, 4] },
    source: "Company disclosures",
    lastVerified: "2026-03-12",
    cf: {
      foundingYear: 2012,
      businessModel: "B2C",
      employees: "51 - 200",
      regulator: "Central Bank of Nigeria",
      licenses: ["MFB"],
      totalFunding: 15000000,
      valuation: null,
      valuationDate: null,
      investors: [{ n: "Netherlands DFI (FMO)", t: "PE" }],
      rounds: [{ r: "Debt", d: "2021-05", a: 15000000, l: "FMO" }],
    },
  },
  {
    slug: "piggyvest",
    name: "PiggyVest",
    logo: "Pv",
    color: "#0B60D3",
    category: "fintech",
    sub: "Wealthtech",
    short: "Savings and investment for everyday Nigerians.",
    long: "PiggyVest helps users save automatically and invest in vetted opportunities, a pioneer of the Nigerian personal-finance category.",
    website: "https://piggyvest.com",
    socials: { x: "#", instagram: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: ["savings", "investments"],
    verification: "unverified",
    status: "active",
    rating: { score: 4.4, count: 88, dist: [60, 26, 8, 4, 2] },
    source: "Company website",
    lastVerified: "2026-02-20",
    cf: {
      foundingYear: 2016,
      businessModel: "B2C",
      employees: "51 - 200",
      regulator: "SEC Nigeria",
      licenses: ["Fund/Portfolio Mgmt"],
      totalFunding: 1100000,
      valuation: null,
      valuationDate: null,
      investors: [
        { n: "LeadPath Nigeria", t: "VC" },
        { n: "Village Capital", t: "Accelerator" },
      ],
      rounds: [{ r: "Seed", d: "2018-01", a: 1100000, l: "LeadPath" }],
    },
  },
  {
    slug: "reliance-hmo",
    name: "Reliance Health",
    logo: "R",
    color: "#E0356F",
    category: "fintech",
    sub: "Insurtech",
    short: "Affordable health insurance and telemedicine.",
    long: "Reliance Health combines health insurance, telemedicine and clinics into one plan for individuals and employers across emerging markets.",
    website: "https://reliancehealth.com",
    socials: { linkedin: "#" },
    regions: [{ state: "lagos", primary: true }, { state: "fct" }],
    tags: ["multi-currency"],
    verification: "verified",
    status: "active",
    rating: { score: 4.2, count: 41, dist: [52, 28, 12, 5, 3] },
    source: "Company announcements",
    lastVerified: "2026-05-02",
    cf: {
      foundingYear: 2016,
      businessModel: "B2B2C",
      employees: "201 - 500",
      regulator: "NAICOM",
      licenses: ["HMO"],
      totalFunding: 47000000,
      valuation: null,
      valuationDate: null,
      investors: [
        { n: "General Atlantic", t: "Growth" },
        { n: "Partech", t: "VC" },
      ],
      rounds: [
        {
          r: "Series B",
          d: "2022-06",
          a: 40000000,
          l: "General Atlantic",
        },
        { r: "Series A", d: "2020-02", a: 7000000, l: "Partech" },
      ],
    },
  },

  /* ---------------- HOSPITALS ---------------- */
  {
    slug: "reddington-hospital",
    name: "Reddington Hospital",
    logo: "R",
    color: "#B42318",
    category: "hospitals",
    sub: "Specialist",
    short: "Multi-specialty hospital in Victoria Island, Lagos.",
    long: "Founded in 2006, Reddington is a tertiary multi-specialty hospital offering cardiology, oncology, surgery and a 24/7 emergency department.",
    website: "https://reddingtonhospital.com",
    socials: { instagram: "#", linkedin: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: ["cardiology", "oncology", "surgery", "emergency", "imaging"],
    verification: "verified",
    status: "active",
    rating: { score: 4.3, count: 57, dist: [54, 28, 10, 5, 3] },
    source: "HEFAMAA facility register (illustrative)",
    lastVerified: "2026-06-05",
    cf: {
      hospitalType: "specialist",
      ownership: "private",
      yearEstablished: 2006,
      bedCapacity: 120,
      emergency: true,
      city: "Victoria Island",
      address: "1 Reddington Cres, Victoria Island",
      services: ["ICU", "Dialysis", "Imaging", "Cath Lab"],
      accreditation: ["SafeCare Level 4", "NHIA"],
      accreditationBody: "SafeCare / PharmAccess",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2019/00214",
      contactPhone: "+234 800 000 0000",
      contactEmail: "info@reddingtonhospital.com",
    },
  },
  {
    slug: "lagoon-hospitals",
    name: "Lagoon Hospitals",
    logo: "L",
    color: "#0E7C86",
    category: "hospitals",
    sub: "General",
    short: "JCI-accredited private hospital group in Lagos.",
    long: "Lagoon Hospitals is a leading private healthcare group operating multiple facilities across Lagos, offering general and specialist care.",
    website: "https://lagoonhospitals.com",
    socials: { linkedin: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: ["maternity", "surgery", "cardiology", "emergency"],
    verification: "verified",
    status: "active",
    rating: { score: 4.4, count: 73, dist: [58, 26, 9, 4, 3] },
    source: "JCI accreditation list (illustrative)",
    lastVerified: "2026-05-22",
    cf: {
      hospitalType: "general",
      ownership: "private",
      yearEstablished: 1984,
      bedCapacity: 150,
      emergency: true,
      city: "Ikeja",
      address: "17 Kofo Abayomi St, Victoria Island",
      services: ["Maternity", "ICU", "Surgery", "Imaging"],
      accreditation: ["JCI", "SafeCare"],
      accreditationBody: "Joint Commission International",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2016/00097",
      contactPhone: "+234 700 000 0000",
      contactEmail: "enquiries@lagoonhospitals.com",
    },
  },
  {
    slug: "nisa-premier",
    name: "Nisa Premier Hospital",
    logo: "N",
    color: "#6D28D9",
    category: "hospitals",
    sub: "Specialist",
    short: "Specialist hospital in Jabi, Abuja.",
    long: "Nisa Premier is a specialist facility in Abuja known for maternity, fertility and surgical services in the Federal Capital Territory.",
    website: "https://nisapremier.com",
    socials: { instagram: "#" },
    regions: [{ state: "fct", primary: true }],
    tags: ["maternity", "surgery", "paediatrics"],
    verification: "unverified",
    status: "active",
    rating: { score: 4.0, count: 33, dist: [44, 30, 15, 7, 4] },
    source: "Facility website",
    lastVerified: "2026-01-15",
    cf: {
      hospitalType: "specialist",
      ownership: "private",
      yearEstablished: 1996,
      bedCapacity: 80,
      emergency: true,
      city: "Abuja",
      address: "15 Nisa St, Jabi, Abuja",
      services: ["Maternity", "Fertility", "Surgery"],
      accreditation: ["NHIA"],
      accreditationBody: "NHIA",
      facilityBody: "FCT Health Regulatory (illustrative)",
      facilityNo: "FCT/HR/2018/0451",
      contactPhone: "+234 900 000 0000",
      contactEmail: "care@nisapremier.com",
    },
  },
  {
    slug: "first-cardiology",
    name: "First Cardiology Consultants",
    logo: "FC",
    color: "#B42318",
    category: "hospitals",
    sub: "Specialist",
    short: "Dedicated cardiac care centre in Ikoyi, Lagos.",
    long: "First Cardiology Consultants is a specialist cardiac centre offering diagnostics, catheterisation and cardiac surgery.",
    website: "https://firstcardiologyconsultants.com",
    socials: {},
    regions: [{ state: "lagos", primary: true }],
    tags: ["cardiology", "imaging", "surgery"],
    verification: "verified",
    status: "active",
    rating: { score: 4.6, count: 29, dist: [70, 20, 6, 2, 2] },
    source: "HEFAMAA facility register (illustrative)",
    lastVerified: "2026-06-10",
    cf: {
      hospitalType: "specialist",
      ownership: "private",
      yearEstablished: 2013,
      bedCapacity: 24,
      emergency: false,
      city: "Ikoyi",
      address: "Ikoyi, Lagos",
      services: ["Cath Lab", "Echocardiography", "Cardiac Surgery"],
      accreditation: ["SafeCare"],
      accreditationBody: "SafeCare",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2015/00610",
      contactPhone: "+234 812 000 0000",
      contactEmail: "info@fcc.com",
    },
  },
  {
    slug: "duchess-international",
    name: "Duchess International Hospital",
    logo: "D",
    color: "#1D4ED8",
    category: "hospitals",
    sub: "Teaching",
    short: "Tertiary hospital with medical training in Ikeja, Lagos.",
    long: "Duchess International is a tertiary hospital combining multi-specialty care with clinical training and research in Ikeja.",
    website: "https://duchesshospital.com",
    socials: { linkedin: "#", instagram: "#" },
    regions: [{ state: "lagos", primary: true }],
    tags: ["oncology", "surgery", "emergency", "dialysis", "imaging"],
    verification: "verified",
    status: "active",
    rating: { score: 4.2, count: 38, dist: [50, 30, 12, 5, 3] },
    source: "HEFAMAA facility register (illustrative)",
    lastVerified: "2026-05-28",
    cf: {
      hospitalType: "teaching",
      ownership: "private",
      yearEstablished: 2020,
      bedCapacity: 100,
      emergency: true,
      city: "Ikeja",
      address: "145 Joel Ogunnaike St, Ikeja GRA",
      services: ["Oncology", "Dialysis", "ICU", "Imaging"],
      accreditation: ["SafeCare", "ISO 9001"],
      accreditationBody: "SafeCare",
      facilityBody: "HEFAMAA (Lagos State)",
      facilityNo: "LAG/HEF/2020/01188",
      contactPhone: "+234 814 000 0000",
      contactEmail: "info@duchesshospital.com",
    },
  },
];

/* ============================================================
HELPERS
============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) =>
  Array.prototype.slice.call(r.querySelectorAll(s));
function money(n) {
  if (n == null) return "—";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(n % 1e9 ? 1 : 0) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(0) + "K";
  return "$" + n;
}
function regionLabel(l) {
  const primary = l.regions.find((r) => r.primary) || l.regions[0];
  const extra = l.regions.length - 1;
  const name = REGIONS.ng.states[primary.state] || primary.state;
  return { name, cc: REGIONS.ng.cc, extra };
}
function verifyPill(v) {
  if (v === "verified") return '<span class="pill emerald">● Verified</span>';
  if (v === "flagged") return '<span class="pill amber">⚑ Flagged</span>';
  return '<span class="pill">○ Unverified</span>';
}
function socialIcons(s) {
  const map = { x: "𝕏", linkedin: "in", instagram: "IG", facebook: "f" };
  const keys = Object.keys(s || {});
  if (!keys.length)
    return '<span class="mono" style="color:var(--faint)">—</span>';
  return (
    '<span class="socials">' +
    keys
      .map(
        (k) =>
          `<a href="${s[k]}" title="${k}" onclick="event.stopPropagation()">${map[k] || k}</a>`,
      )
      .join("") +
    "</span>"
  );
}

/* ============================================================
FILTER STATE
============================================================ */
const state = {
  category: "all",
  region: "all",
  subcat: "all",
  status: "all",
  sort: "az",
  tags: [],
  q: "",
};

/* ============================================================
DIRECTORY RENDERING
============================================================ */
function renderHeroStats() {
  const fin = LISTINGS.filter((l) => l.category === "fintech").length;
  const hos = LISTINGS.filter((l) => l.category === "hospitals").length;
  $("#hero-stats").innerHTML = [
    [LISTINGS.length, "Listings"],
    [2, "Verticals"],
    [fin, "Fintech"],
    [hos, "Hospitals"],
    [1, "Region · pilot"],
  ]
    .map(
      ([n, l]) =>
        `<div class="hero-stat"><div class="big">${n}</div><div class="lbl">${l}</div></div>`,
    )
    .join("");
}

function renderCatTabs() {
  const counts = { all: LISTINGS.length };
  Object.keys(CATEGORIES).forEach(
    (c) => (counts[c] = LISTINGS.filter((l) => l.category === c).length),
  );
  const tabs = [["all", "◆", "All"]].concat(
    Object.keys(CATEGORIES).map((c) => [
      c,
      CATEGORIES[c].icon,
      CATEGORIES[c].label,
    ]),
  );
  $("#cat-tabs").innerHTML = tabs
    .map(
      ([id, ico, label]) =>
        `<button class="cat-tab ${state.category === id ? "active" : ""}" data-cat="${id}">
    <span class="ico">${ico}</span> ${label} <span class="count">${counts[id]}</span>
    </button>`,
    )
    .join("");
  $$("#cat-tabs .cat-tab").forEach(
    (b) =>
      (b.onclick = () => {
        setCategory(b.dataset.cat);
      }),
  );
}

function activeCatConfig() {
  return state.category === "all" ? null : CATEGORIES[state.category];
}

function renderControls() {
  // region
  const rOpts = ['<option value="all">All regions</option>'].concat(
    Object.entries(REGIONS.ng.states).map(
      ([k, v]) => `<option value="${k}">${v}</option>`,
    ),
  );
  $("#f-region").innerHTML = rOpts.join("");
  $("#f-region").value = state.region;

  // subcat depends on category
  const cfg = activeCatConfig();
  const subSel = $("#f-subcat");
  if (cfg) {
    subSel.innerHTML = [
      '<option value="all">All ' + cfg.label.toLowerCase() + "</option>",
    ]
      .concat(cfg.subs.map((s) => `<option value="${s}">${s}</option>`))
      .join("");
    subSel.disabled = false;
    $("#subcat-label").textContent =
      cfg.id === "hospitals" ? "Type" : "Sub-vertical";
  } else {
    subSel.innerHTML = '<option value="all">Pick a category first</option>';
    subSel.disabled = true;
    $("#subcat-label").textContent = "Sub-type";
  }
  subSel.value = state.subcat;

  // sort depends on category
  const sorts = cfg
    ? cfg.sorts
    : [
        ["az", "A–Z"],
        ["newest", "Newest"],
      ];
  $("#f-sort").innerHTML = sorts
    .map(([v, l]) => `<option value="${v}">${l}</option>`)
    .join("");
  if (!sorts.find((s) => s[0] === state.sort)) state.sort = "az";
  $("#f-sort").value = state.sort;

  $("#f-status").value = state.status;

  // feature/tag chips — only when a category is chosen (two-layer filter)
  const featRow = $("#feat-row");
  if (cfg) {
    featRow.style.display = "flex";
    $("#feat-label").textContent = cfg.featLabel;
    $("#feat-chips").innerHTML = TAGS[cfg.id]
      .map(
        (t) =>
          `<button class="chip-toggle ${state.tags.includes(t.slug) ? "on" : ""}" data-tag="${t.slug}">
        <span class="grp">${t.grp}</span>${t.name}</button>`,
      )
      .join("");
    $$("#feat-chips .chip-toggle").forEach(
      (b) =>
        (b.onclick = () => {
          const s = b.dataset.tag;
          state.tags = state.tags.includes(s)
            ? state.tags.filter((x) => x !== s)
            : state.tags.concat(s);
          applyFilters();
        }),
    );
  } else {
    featRow.style.display = "none";
  }
}

function currentResults() {
  let rows = LISTINGS.slice();
  if (state.category !== "all")
    rows = rows.filter((l) => l.category === state.category);
  if (state.region !== "all")
    rows = rows.filter((l) => l.regions.some((r) => r.state === state.region));
  if (state.subcat !== "all")
    rows = rows.filter(
      (l) =>
        (l.sub || "").toLowerCase() === state.subcat.toLowerCase() ||
        (l.category === "hospitals" &&
          (l.cf.hospitalType || "").toLowerCase() ===
            state.subcat.toLowerCase()),
    );
  if (state.status !== "all")
    rows = rows.filter((l) => l.verification === state.status);
  if (state.tags.length)
    rows = rows.filter((l) => state.tags.every((t) => l.tags.includes(t)));
  if (state.q) {
    const q = state.q.toLowerCase();
    rows = rows.filter((l) =>
      (l.name + " " + l.short + " " + l.long + " " + l.tags.join(" "))
        .toLowerCase()
        .includes(q),
    );
  }
  // sort
  rows.sort((a, b) => {
    if (state.sort === "az") return a.name.localeCompare(b.name);
    if (state.sort === "funding")
      return (b.cf.totalFunding || 0) - (a.cf.totalFunding || 0);
    if (state.sort === "beds")
      return (b.cf.bedCapacity || 0) - (a.cf.bedCapacity || 0);
    if (state.sort === "newest")
      return (
        (b.cf.foundingYear || b.cf.yearEstablished || 0) -
        (a.cf.foundingYear || a.cf.yearEstablished || 0)
      );
    return 0;
  });
  return rows;
}

/* header columns per active category (or generic for All) */
function columnDefs() {
  const cfg = activeCatConfig();
  if (!cfg)
    return [
      ["entity", "Entity"],
      ["category", "Category"],
      ["description", "Description"],
      ["region", "Region"],
      ["status", "Status"],
      ["explore", ""],
    ];
  const labels = {
    entity: "Entity",
    description: "Description",
    funding: "Capital Raised",
    investors: "Investors",
    region: "Region",
    socials: "Socials",
    explore: "",
    location: "Location",
    specialties: "Specialties",
    licence: "Reg. / Licence",
  };
  return cfg.columns.map((c) => [c, labels[c]]);
}

function cellHTML(col, l) {
  const cfg = CATEGORIES[l.category];
  const rl = regionLabel(l);
  switch (col) {
    case "entity":
      return `<td><div class="ent">
    <div class="ent-logo" style="background:${l.color}">${l.logo}</div>
    <div><div class="ent-name">${l.name} ${l.verification === "verified" ? '<span class="verified-badge" title="Verified">✔</span>' : ""}</div>
    <div class="ent-sub">${cfg.label} · ${l.sub || ""}</div></div></div></td>`;
    case "category":
      return `<td><span class="pill indigo">${cfg.label}</span></td>`;
    case "description":
      return `<td class="td-desc">${l.short}</td>`;
    case "funding":
      return `<td class="cell-strong mono">${money(l.cf.totalFunding)}</td>`;
    case "investors": {
      const inv = l.cf.investors || [];
      const first = inv[0] ? inv[0].n : "—";
      const more =
        inv.length > 1
          ? ` <span class="plus-more">+${inv.length - 1}</span>`
          : "";
      return `<td style="font-size:13px;color:var(--ink-soft)">${first}${more}</td>`;
    }
    case "region":
      return `<td><span class="geo-chip"><span class="cc">${rl.cc}</span> ${rl.name}${rl.extra ? ` <span class="plus-more">+${rl.extra}</span>` : ""}</span></td>`;
    case "location":
      return `<td><span class="geo-chip"><span class="cc">${rl.cc}</span> ${l.cf.city || rl.name}</span></td>`;
    case "socials":
      return `<td>${socialIcons(l.socials)}</td>`;
    case "status":
      return `<td>${verifyPill(l.verification)}</td>`;
    case "specialties": {
      const t = l.tags
        .slice(0, 2)
        .map((s) => `<span class="tag-mini">${tagName(l.category, s)}</span>`)
        .join("");
      const more =
        l.tags.length > 2
          ? `<span class="plus-more">+${l.tags.length - 2}</span>`
          : "";
      return `<td>${t}${more}</td>`;
    }
    case "licence":
      return `<td style="font-size:12.5px"><div class="cell-strong">${l.cf.facilityBody || "—"}</div><div class="ent-sub">${l.cf.facilityNo || ""}</div></td>`;
    case "explore":
      return `<td style="text-align:right"><span class="explore-link">Explore deeper →</span></td>`;
    default:
      return "<td>—</td>";
  }
}

function renderTable(rows) {
  const cols = columnDefs();
  $("#dir-head").innerHTML =
    "<tr>" + cols.map((c) => `<th>${c[1]}</th>`).join("") + "</tr>";
  $("#dir-body").innerHTML = rows
    .map(
      (l) =>
        `<tr data-slug="${l.slug}">${cols.map((c) => cellHTML(c[0], l)).join("")}</tr>`,
    )
    .join("");
  $$("#dir-body tr").forEach(
    (tr) =>
      (tr.onclick = () => {
        location.hash = "#/listing/" + tr.dataset.slug;
      }),
  );

  // mobile cards
  $("#card-list").innerHTML = rows
    .map((l) => {
      const cfg = CATEGORIES[l.category];
      const rl = regionLabel(l);
      const primaryKV =
        l.category === "fintech"
          ? `<div class="row-kv"><span class="k">Capital</span><span class="mono">${money(l.cf.totalFunding)}</span></div>`
          : `<div class="row-kv"><span class="k">Beds</span><span class="mono">${l.cf.bedCapacity || "—"}</span></div>`;
      return `<div class="dir-card" data-slug="${l.slug}">
    <div class="top"><div class="ent-logo" style="background:${l.color}">${l.logo}</div>
    <div><div class="ent-name">${l.name} ${l.verification === "verified" ? '<span class="verified-badge">✔</span>' : ""}</div>
    <div class="ent-sub">${cfg.label} · ${l.sub || ""}</div></div></div>
    <div class="td-desc" style="margin-bottom:8px">${l.short}</div>
    ${primaryKV}
    <div class="row-kv"><span class="k">Region</span><span><span class="cc">${rl.cc}</span> ${rl.name}${rl.extra ? ` +${rl.extra}` : ""}</span></div>
    <div class="row-kv"><span class="k">Status</span>${verifyPill(l.verification)}</div>
    <div style="margin-top:12px;text-align:right"><span class="explore-link">Explore deeper →</span></div>
</div>`;
    })
    .join("");
  $$("#card-list .dir-card").forEach(
    (c) =>
      (c.onclick = () => {
        location.hash = "#/listing/" + c.dataset.slug;
      }),
  );
}

function applyFilters() {
  renderControls();
  const rows = currentResults();
  const tw = $("#table-wrap"),
    cl = $("#card-list"),
    es = $("#empty-slot");
  if (rows.length === 0) {
    tw.style.display = "none";
    cl.style.display = "none";
    es.innerHTML = `<div class="empty"><div class="ico">◍</div><h3>No listings match those filters</h3>
    <p>Try widening the region, clearing feature tags, or switching category.</p>
    <button class="btn btn-secondary" onclick="clearFilters()">Clear all filters</button></div>`;
  } else {
    tw.style.display = "";
    cl.style.display = "";
    es.innerHTML = "";
    renderTable(rows);
  }
  const cfg = activeCatConfig();
  $("#result-count").textContent =
    `Showing ${rows.length} of ${state.category === "all" ? LISTINGS.length : LISTINGS.filter((l) => l.category === state.category).length}` +
    (cfg ? ` · ${cfg.vertical}` : "") +
    (state.tags.length
      ? ` · ${state.tags.length} feature filter${state.tags.length > 1 ? "s" : ""}`
      : "");
}

function setCategory(c) {
  state.category = c;
  state.subcat = "all";
  state.tags = [];
  applyFilters();
}
function clearFilters() {
  state.region = "all";
  state.subcat = "all";
  state.status = "all";
  state.tags = [];
  state.q = "";
  $("#hero-search-input").value = "";
  applyFilters();
}
window.clearFilters = clearFilters;

/* wire controls */
function wireControls() {
  $("#f-region").onchange = (e) => {
    state.region = e.target.value;
    applyFilters();
  };
  $("#f-subcat").onchange = (e) => {
    state.subcat = e.target.value;
    applyFilters();
  };
  $("#f-status").onchange = (e) => {
    state.status = e.target.value;
    applyFilters();
  };
  $("#f-sort").onchange = (e) => {
    state.sort = e.target.value;
    applyFilters();
  };
  $("#clear-filters").onclick = clearFilters;
  const doSearch = () => {
    state.q = $("#hero-search-input").value.trim();
    applyFilters();
    $(".directory-shell").scrollIntoView({ behavior: "smooth" });
  };
  $("#hero-search-btn").onclick = doSearch;
  $("#hero-search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });
}

/* ============================================================
DETAIL VIEW — one template, sections adapt by category
============================================================ */
function bestForBlock(l) {
  if (l.category === "fintech") {
    return {
      a: {
        h: "Best for",
        items: [
          "Everyday payments",
          "Merchants & agents",
          "Cross-border senders",
          "Underbanked users",
        ],
      },
      b: {
        h: "What it does well",
        items: l.tags.map((t) => tagName(l.category, t)).slice(0, 5),
      },
      c: {
        h: "Things to check",
        items: [
          "Regulatory licence scope",
          "Transaction limits",
          "Support responsiveness",
          "Country availability",
        ],
      },
    };
  }
  return {
    a: {
      h: "Best for",
      items: [
        "Specialist care seekers",
        "Emergency access",
        "Insured (NHIA) patients",
        "Referrals from clinics",
      ],
    },
    b: {
      h: "What it does well",
      items: l.tags.map((t) => tagName(l.category, t)).slice(0, 5),
    },
    c: {
      h: "Things to check",
      items: [
        "Bed availability",
        "Accepted insurance",
        "Consultation hours",
        "Emergency capacity",
      ],
    },
  };
}

function statGrid(l) {
  const cells =
    l.category === "fintech"
      ? [
          ["Total funding", money(l.cf.totalFunding)],
          ["Valuation", l.cf.valuation ? money(l.cf.valuation) : "—"],
          ["Founded", l.cf.foundingYear || "—"],
          ["Employees", l.cf.employees || "—"],
          ["Model", l.cf.businessModel || "—"],
          [
            "Regulator",
            `<span style="font-size:13px">${l.cf.regulator || "—"}</span>`,
          ],
        ]
      : [
          ["Type", l.cf.hospitalType || "—"],
          ["Ownership", l.cf.ownership || "—"],
          ["Established", l.cf.yearEstablished || "—"],
          ["Beds", l.cf.bedCapacity || "—"],
          ["24/7 Emergency", l.cf.emergency ? "Yes" : "No"],
          [
            "Accreditation",
            `<span style="font-size:13px">${(l.cf.accreditation || []).length ? l.cf.accreditation.join(", ") : "—"}</span>`,
          ],
        ];
  return `<div class="stat-grid">${cells.map(([k, v]) => `<div class="stat"><div class="k">${k}</div><div class="v" style="text-transform:capitalize">${v}</div></div>`).join("")}</div>`;
}

function categorySection(l) {
  if (l.category === "fintech") {
    const rounds = (l.cf.rounds || [])
      .map(
        (r) =>
          `<div class="fund-row"><div><div class="fund-round">${r.r}</div><div class="fund-date">${r.d}</div></div>
    <div class="fund-lead">${r.l || ""}</div><div class="fund-amt">${money(r.a)}</div></div>`,
      )
      .join("");
    const inv = (l.cf.investors || [])
      .map(
        (i) =>
          `<div class="inv-card"><div class="inv-logo">${i.n[0]}</div><div><div class="inv-name">${i.n}</div><div class="inv-type">${i.t}</div></div></div>`,
      )
      .join("");
    const lic = (l.cf.licenses || [])
      .map((x) => `<span class="tag-mini">${x}</span>`)
      .join("");
    return `
    <section class="blk" id="funding">
    <span class="eyebrow">§ 04 / Funding & investors</span>
    <h3 class="blk-title">Funding history</h3>
    <div class="panel fund-timeline">${rounds || '<div class="fund-date">No disclosed rounds.</div>'}</div>
    <h4 style="font-family:var(--font-display);margin:28px 0 14px">Investors</h4>
    <div class="inv-grid">${inv || "—"}</div>
    <h4 style="font-family:var(--font-display);margin:28px 0 14px">Regulatory licences</h4>
    <div class="tag-cloud">${lic || '<span class="fund-date">Not disclosed.</span>'}</div>
    </section>`;
  }
  // hospital
  const specs = l.tags
    .map((t) => `<span class="tag-mini">${tagName(l.category, t)}</span>`)
    .join("");
  const svcs = (l.cf.services || [])
    .map((s) => `<span class="tag-mini">${s}</span>`)
    .join("");
  const accr = (l.cf.accreditation || [])
    .map((a) => `<span class="tag-mini">${a}</span>`)
    .join("");
  return `
<section class="blk" id="clinical">
    <span class="eyebrow">§ 04 / Clinical detail</span>
    <h3 class="blk-title">Specialties & accreditation</h3>
    <div class="panel">
    <div class="kv-row"><span class="kv-key">Specialties</span><span class="kv-val"><div class="tag-cloud" style="justify-content:flex-end">${specs}</div></span></div>
    <div class="kv-row"><span class="kv-key">Services</span><span class="kv-val"><div class="tag-cloud" style="justify-content:flex-end">${svcs || "—"}</div></span></div>
    <div class="kv-row"><span class="kv-key">Accreditation</span><span class="kv-val"><div class="tag-cloud" style="justify-content:flex-end">${accr || "—"}</div></span></div>
    <div class="kv-row"><span class="kv-key">Accrediting body</span><span class="kv-val">${l.cf.accreditationBody || "—"}</span></div>
    <div class="kv-row"><span class="kv-key">Facility licence</span><span class="kv-val">${l.cf.facilityBody || "—"} · <span class="mono">${l.cf.facilityNo || ""}</span></span></div>
    </div>
</section>`;
}

function detailTOC(l) {
  const base = [
    ["overview", "01", "Overview"],
    ["stats", "02", "Key stats"],
    ["website", "03", "Website"],
  ];
  const cat =
    l.category === "fintech"
      ? ["funding", "04", "Funding & investors"]
      : ["clinical", "04", "Clinical detail"];
  return base.concat([cat]).concat([
    ["reviews", "05", "Ratings & reviews"],
    ["source", "06", "Source & verification"],
    ["related", "07", "Related"],
  ]);
}

function renderDetail(slug) {
  const l = LISTINGS.find((x) => x.slug === slug);
  if (!l) {
    location.hash = "#/";
    return;
  }
  const cfg = CATEGORIES[l.category];
  const rl = regionLabel(l);
  const bf = bestForBlock(l);
  const toc = detailTOC(l);
  const related = LISTINGS.filter(
    (x) => x.category === l.category && x.slug !== l.slug,
  ).slice(0, 3);
  const dist = l.rating.dist;

  const html = `
<div class="detail-hero cat-${l.category}" style="--hero-img:url('${heroFor(l)}')">
<nav class="breadcrumb on-image">
    <a href="#/">Directory</a><span class="slash">/</span>
    <a href="#/c/${l.category}">${cfg.label}</a><span class="slash">/</span>
    <span class="current">${l.name}</span>
</nav>
</div>

<div class="identity-card">
<div class="identity-inner">
    <div class="identity-logo" style="background:${l.color}">${l.logo}</div>
    <div class="identity-info">
    <h1>${l.name} ${l.verification === "verified" ? '<span class="verified-badge">✔</span>' : ""}</h1>
    <div class="identity-meta">
        <span class="pill indigo">${cfg.label}${l.sub ? " · " + l.sub : ""}</span>
        <span class="geo-chip"><span class="cc">${rl.cc}</span> ${rl.name}${rl.extra ? ` <span class="plus-more">+${rl.extra}</span>` : ""}</span>
        ${verifyPill(l.verification)}
    </div>
    <p class="identity-desc">${l.short}</p>
    <div class="identity-tags tag-cloud">${l.tags.map((t) => `<span class="tag-mini">${tagName(l.category, t)}</span>`).join("")}</div>
    </div>
    <div class="identity-actions">
    <a class="btn btn-primary" href="${l.website}" target="_blank" rel="noopener">Visit website ↗</a>
    <button class="btn btn-secondary">＋ Follow</button>
    </div>
</div>
</div>

<div class="detail-grid">
<aside class="sidebar">
    <div class="side-card">
    <p class="eyebrow">Rating</p>
    <div class="side-rating"><span class="score">${l.rating.score.toFixed(1)}</span><span class="stars">★★★★★</span></div>
    </div>
    <nav class="toc side-card">
    <p class="eyebrow toc-label">On this page</p>
    <ol>${toc.map((t) => `<li><a href="#${t[0]}" data-spy><span class="num">${t[1]}</span> ${t[2]}</a></li>`).join("")}</ol>
    </nav>
</aside>

<div class="content" id="io-content">
    <section class="blk" id="overview">
    <span class="eyebrow">§ 01 / Overview</span>
    <h3 class="blk-title">Is ${l.name} right for you?</h3>
    <p class="lead">${l.long}</p>
    <div class="panel"><div class="cols3">
        <div class="col"><h4>${bf.a.h}</h4><ul class="check-list">${bf.a.items.map((i) => `<li><span class="tick">✔</span> ${i}</li>`).join("")}</ul></div>
        <div class="col"><h4>${bf.b.h}</h4><ul class="check-list">${bf.b.items.map((i) => `<li><span class="tick">✔</span> ${i}</li>`).join("")}</ul></div>
        <div class="col"><h4>${bf.c.h}</h4><ul class="check-list watch">${bf.c.items.map((i) => `<li><span class="tick">◇</span> ${i}</li>`).join("")}</ul></div>
    </div></div>
    </section>

    <section class="blk" id="stats">
    <span class="eyebrow">§ 02 / Key stats</span>
    <h3 class="blk-title">At a glance</h3>
    ${statGrid(l)}
    </section>

    <section class="blk" id="website">
    <span class="eyebrow">§ 03 / Website & presence</span>
    <h3 class="blk-title">Website & presence</h3>
    <div class="panel">
        <div class="kv-row"><span class="kv-key">Website</span><span class="kv-val"><a href="${l.website}" target="_blank" rel="noopener">${l.website.replace("https://", "")} ↗</a></span></div>
        <div class="kv-row"><span class="kv-key">Status</span><span class="kv-val"><span class="pill emerald">● Accessible</span></span></div>
        <div class="kv-row"><span class="kv-key">${l.category === "fintech" ? "HQ" : "Address"}</span><span class="kv-val">${l.cf.address || l.cf.hq_address || rl.name}</span></div>
        <div class="kv-row"><span class="kv-key">Markets</span><span class="kv-val"><span class="cc">${rl.cc}</span> ${rl.name}${rl.extra ? ` +${rl.extra}` : ""}</span></div>
        <div class="kv-row"><span class="kv-key">Socials</span><span class="kv-val">${socialIcons(l.socials)}</span></div>
    </div>
    </section>

    ${categorySection(l)}

    <section class="blk" id="reviews">
    <span class="eyebrow">§ 05 / Ratings & reviews</span>
    <h3 class="blk-title">Ratings & reviews</h3>
    <div class="panel"><div class="ratings-grid">
        <div>
        <div class="score-big">${l.rating.score.toFixed(1)}</div>
        <div class="stars">★★★★★</div>
        <div class="score-sub">Based on ${l.rating.count} reviews</div>
        <a class="btn btn-primary" href="#" style="margin-top:16px">Write review</a>
        </div>
        <div class="bars">${[5, 4, 3, 2, 1]
          .map(
            (s, i) =>
              `<div class="bar-row"><span class="bar-label">${s}-star</span><span class="bar-track"><span class="bar-fill" style="width:${dist[i]}%"></span></span><span class="bar-pct">${dist[i]}%</span></div>`,
          )
          .join("")}
        </div>
    </div></div>
    </section>

    <section class="blk" id="source">
    <span class="eyebrow">§ 06 / Source & verification</span>
    <h3 class="blk-title">Where this data comes from</h3>
    <div class="source-footer">
        <div class="sf-item"><span class="k">Verification</span>${verifyPill(l.verification)}</div>
        <div class="sf-item"><span class="k">Primary source</span>${l.source}</div>
        <div class="sf-item"><span class="k">Last verified</span><span class="mono">${l.lastVerified}</span></div>
        <div class="sf-item"><span class="k">Listing status</span><span class="mono" style="text-transform:capitalize">${l.status}</span></div>
    </div>
    </section>

    <section class="blk" id="related" style="padding-bottom:0">
    <span class="eyebrow">§ 07 / Related</span>
    <h3 class="blk-title">Similar ${cfg.label.toLowerCase()}</h3>
    <div class="related-grid">${related
      .map(
        (r) =>
          `<div class="rel-card" data-slug="${r.slug}">
        <div class="rel-top"><div class="rel-logo" style="background:${r.color}">${r.logo}</div>
        <div><div class="rel-name">${r.name}</div><div class="ent-sub">${r.sub || ""}</div></div></div>
        <div class="rel-desc">${r.short}</div></div>`,
      )
      .join("")}
    </div>
    <p class="proto-note">Prototype · schema-driven from directory-database-D1-D5. Funding, licence and accreditation figures are sample data — verify per source (Deliverable 9) before publishing.</p>
    </section>
</div>
</div>`;

  $("#detail-root").innerHTML = html;
  $$(".rel-card").forEach(
    (c) =>
      (c.onclick = () => {
        location.hash = "#/listing/" + c.dataset.slug;
      }),
  );
  window.scrollTo(0, 0);
  setupScrollSpy();
}

/* scroll-spy for detail TOC */
let spyObserver = null;
function setupScrollSpy() {
  if (spyObserver) spyObserver.disconnect();
  const links = $$(".toc a[data-spy]");
  spyObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.remove("active"));
          const act = $(`.toc a[href="#${e.target.id}"]`);
          if (act) act.classList.add("active");
        }
      });
    },
    { rootMargin: "-35% 0px -55% 0px" },
  );
  $$("#io-content section[id]").forEach((s) => spyObserver.observe(s));
}

/* ============================================================
ROUTER
============================================================ */
function router() {
  const h = location.hash || "#/";
  const detailMatch = h.match(/^#\/listing\/(.+)$/);
  const catMatch = h.match(/^#\/c\/(.+)$/);
  if (detailMatch) {
    $("#view-directory").classList.remove("is-active");
    $("#view-detail").classList.add("is-active");
    renderDetail(detailMatch[1]);
  } else {
    $("#view-detail").classList.remove("is-active");
    $("#view-directory").classList.add("is-active");
    if (catMatch && CATEGORIES[catMatch[1]] && state.category !== catMatch[1]) {
      setCategory(catMatch[1]);
    }
  }
}

/* ============================================================
INIT
============================================================ */
renderHeroStats();
renderCatTabs();
wireControls();
applyFilters();
$("#proto-note").textContent =
  "Prototype build · " +
  LISTINGS.length +
  " seeded listings across 2 verticals in Nigeria. Data model mirrors directory-database-D1-D5.xlsx (base schema + custom_fields + funding_rounds + investors + region/category/tag taxonomies). Sample figures — verify per source (D9).";
window.addEventListener("hashchange", router);
router();
