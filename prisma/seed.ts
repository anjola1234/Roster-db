/**
 * Seed script — migrates the original static prototype data (index.html /
 * script.js) into the real relational schema, plus adds the review / founder
 * data the new homepage spec needs. Run with `npx prisma db seed`.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Taxonomy (mirrors REGIONS / CATEGORIES / TAGS from the old script.js)
// ---------------------------------------------------------------------------
const REGIONS = [
  { slug: "lagos", name: "Lagos" },
  { slug: "fct", name: "Abuja (FCT)" },
  { slug: "rivers", name: "Rivers" },
  { slug: "oyo", name: "Oyo" },
  { slug: "kano", name: "Kano" },
];

const INDUSTRIES = [
  {
    slug: "fintech",
    name: "Fintech",
    icon: "▲",
    accent: "#4F46E5",
    subs: ["Payments", "Lending", "Insurtech", "Wealthtech", "Digital Banks"],
  },
  {
    slug: "healthcare",
    name: "Healthcare",
    icon: "✚",
    accent: "#10B981",
    subs: ["General", "Specialist", "Teaching", "Clinic", "Diagnostic"],
  },
];

const TAGS: Record<string, { slug: string; name: string; grp: string }[]> = {
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
  healthcare: [
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

const HERO: Record<string, string> = {
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

// ---------------------------------------------------------------------------
// Listings — ported verbatim from the prototype's LISTINGS array.
// ---------------------------------------------------------------------------

// The per-category "custom_fields" blob — fintech and hospital rows each
// only populate their own subset of these, the rest stay undefined.
type CustomFields = {
  foundingYear?: number;
  businessModel?: string;
  employees?: string;
  regulator?: string;
  licenses?: string[];
  totalFunding?: number;
  valuation?: number | null;
  valuationDate?: string | null;
  investors?: { n: string; t: string }[];
  rounds?: { r: string; d: string; a: number; l: string }[];
  hospitalType?: string;
  ownership?: string;
  yearEstablished?: number;
  bedCapacity?: number;
  emergency?: boolean;
  city?: string;
  address?: string;
  services?: string[];
  accreditation?: string[];
  accreditationBody?: string;
  facilityBody?: string;
  facilityNo?: string;
  contactPhone?: string;
  contactEmail?: string;
};

type Listing = {
  slug: string;
  name: string;
  logo: string;
  color: string;
  category: "fintech" | "healthcare";
  sub: string;
  short: string;
  long: string;
  website: string;
  socials: Record<string, string>;
  regions: { state: string; primary?: boolean }[];
  tags: string[];
  verification: "verified" | "unverified" | "flagged";
  status: string;
  rating: { score: number; count: number; dist: number[] };
  source: string;
  lastVerified: string;
  founders: { name: string; role: string }[];
  cf: CustomFields;
};

const LISTINGS: Listing[] = [
  // ---------------- FINTECH ----------------
  {
    slug: "opay",
    name: "OPay",
    logo: "O",
    color: "#0F9D58",
    category: "fintech",
    sub: "Payments",
    short: "Mobile money, payments and banking for everyday Africa.",
    long: "OPay lets millions send money, pay bills, buy airtime and access credit from a single app, backed by one of the continent's largest agent networks.",
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
    founders: [{ name: "Adaeze Okonkwo", role: "Co-Founder & CEO" }],
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
        { r: "Series C", d: "2021-08", a: 400000000, l: "SoftBank Vision Fund 2" },
        { r: "Series B", d: "2019-11", a: 120000000, l: "Meituan / Sequoia Capital China" },
        { r: "Series A", d: "2019-06", a: 50000000, l: "Sequoia Capital China" },
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
    tags: ["payment-gateway", "cross-border", "multi-currency", "virtual-cards"],
    verification: "verified",
    status: "active",
    rating: { score: 4.5, count: 96, dist: [64, 22, 9, 3, 2] },
    source: "Company press releases",
    lastVerified: "2026-05-18",
    founders: [
      { name: "Tunde Bakare", role: "Co-Founder & CEO" },
      { name: "Chiamaka Nwosu", role: "Co-Founder & CTO" },
    ],
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
        { r: "Series D", d: "2022-02", a: 250000000, l: "B Capital / Alta Park" },
        { r: "Series C", d: "2021-03", a: 170000000, l: "Avenir Growth / Tiger Global" },
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
    founders: [
      { name: "Segun Adebayo", role: "Co-Founder & CEO" },
      { name: "Ifeoma Chukwu", role: "Co-Founder & CTO" },
    ],
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
    founders: [{ name: "Nonso Eze", role: "Co-Founder & Group CEO" }],
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
      rounds: [{ r: "Debt", d: "2021-05", a: 15000000, l: "Netherlands DFI (FMO)" }],
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
    founders: [
      { name: "Ronke Adeyemi", role: "Co-Founder & CEO" },
      { name: "Emeka Obi", role: "Co-Founder" },
    ],
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
      rounds: [{ r: "Seed", d: "2018-01", a: 1100000, l: "LeadPath Nigeria" }],
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
    founders: [{ name: "Bisi Fashola", role: "Co-Founder & CEO" }],
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
        { r: "Series B", d: "2022-06", a: 40000000, l: "General Atlantic" },
        { r: "Series A", d: "2020-02", a: 7000000, l: "Partech" },
      ],
    },
  },

  // ---------------- HOSPITALS ----------------
  {
    slug: "reddington-hospital",
    name: "Reddington Hospital",
    logo: "R",
    color: "#B42318",
    category: "healthcare",
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
    founders: [{ name: "Dr. Yemi Osinowo", role: "Founder & Medical Director" }],
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
    category: "healthcare",
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
    founders: [{ name: "Dr. Folake Adisa", role: "Founder & Group Medical Director" }],
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
    category: "healthcare",
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
    founders: [{ name: "Dr. Musa Danladi", role: "Founder & Medical Director" }],
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
    category: "healthcare",
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
    founders: [{ name: "Dr. Kelechi Nwachukwu", role: "Founder & Consultant Cardiologist" }],
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
    category: "healthcare",
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
    founders: [{ name: "Dr. Chinwe Obiora", role: "Founder & Chief Medical Director" }],
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

// ---------------------------------------------------------------------------
// Reviews — real-feeling, written for the review card-deck section.
// ---------------------------------------------------------------------------
const REVIEWS: Record<string, { authorName: string; authorRole: string; rating: number; title: string; body: string }[]> = {
  opay: [
    {
      authorName: "Chukwuemeka Ibe",
      authorRole: "Small business owner, Lagos",
      rating: 5,
      title: "My agent business runs on this app",
      body: "I use OPay to settle almost every customer transaction at my shop in Ikeja. Transfers land instantly nine times out of ten, and the agent commission structure genuinely pays my rent. Support can be slow during peak hours, but the core product just works.",
    },
    {
      authorName: "Fatima Suleiman",
      authorRole: "Freelance graphic designer",
      rating: 4,
      title: "Reliable, but the app can be a lot",
      body: "OPay does everything from bills to savings to betting top-ups, which is powerful but occasionally overwhelming to navigate. The transfer speed and virtual card for online payments have been the two features I actually depend on daily.",
    },
  ],
  flutterwave: [
    {
      authorName: "Daniel Okafor",
      authorRole: "CTO, e-commerce startup",
      rating: 5,
      title: "Integration took an afternoon, not a sprint",
      body: "We switched our checkout to Flutterwave last year mainly for the multi-currency support. The API docs are clear, the sandbox is honest about edge cases, and settlement to our bank account has been consistent to the day.",
    },
    {
      authorName: "Amara Nwankwo",
      authorRole: "Finance lead, logistics company",
      rating: 4,
      title: "Solid for cross-border payouts",
      body: "We pay vendors in three countries through Flutterwave and it has cut our payout time from days to hours. The dashboard reporting could use more granular export options, but reconciliation is otherwise painless.",
    },
  ],
  paystack: [
    {
      authorName: "Bolaji Adeyinka",
      authorRole: "Founder, subscription box service",
      rating: 5,
      title: "The gold standard for Nigerian checkout",
      body: "Paystack's checkout conversion has been noticeably better than every alternative we tested. Webhooks are dependable, the docs are the best I've used from any African fintech, and their support actually replies within hours.",
    },
    {
      authorName: "Grace Effiong",
      authorRole: "Operations manager, retail chain",
      rating: 5,
      title: "POS and online in one dashboard",
      body: "Having our in-store terminal transactions and online payments reconciled in a single view saved our accounts team hours every week. Rarely any downtime worth mentioning over the past year.",
    },
  ],
  carbon: [
    {
      authorName: "Ifeanyi Umeh",
      authorRole: "Everyday user, Lagos",
      rating: 4,
      title: "Quick loans when I've needed them",
      body: "I've taken three short-term loans through Carbon and approval has never taken more than a few minutes. Interest rates are on the higher side, which is worth going in knowing, but the process is transparent about the total repayment upfront.",
    },
  ],
  piggyvest: [
    {
      authorName: "Temidayo Alabi",
      authorRole: "Marketing associate",
      rating: 5,
      title: "Finally stuck to a savings habit",
      body: "The auto-save feature locked to my payday is the only thing that has ever made me consistent with saving. The Flex Naira wallet for near-instant access to part of my savings is the feature I recommend to everyone.",
    },
  ],
  "reliance-hmo": [
    {
      authorName: "Ngozi Eke",
      authorRole: "HR manager, tech company",
      rating: 4,
      title: "Made rolling out staff health cover simple",
      body: "We onboarded our whole team onto Reliance Health plans in under two weeks. The telemedicine option gets heavy use from remote staff, and claims for routine visits have been processed without the back-and-forth we dealt with from our previous provider.",
    },
  ],
  "reddington-hospital": [
    {
      authorName: "Mrs. Adaobi Nnamdi",
      authorRole: "Patient, cardiology outpatient",
      rating: 5,
      title: "Cath lab team was excellent",
      body: "My father had an angioplasty done here and the cardiology team walked us through every step before and after. The ward was clean, nurses were responsive at night, and billing was itemised clearly with no surprise charges.",
    },
    {
      authorName: "Emeka Onuoha",
      authorRole: "Patient, emergency admission",
      rating: 4,
      title: "Fast emergency intake",
      body: "Came in after a road accident and was triaged within minutes. The 24/7 emergency desk clearly sees a lot of volume — wait times for non-critical follow-up appointments afterward were longer than I expected.",
    },
  ],
  "lagoon-hospitals": [
    {
      authorName: "Yetunde Bankole",
      authorRole: "Patient, maternity ward",
      rating: 5,
      title: "Delivered both my children here",
      body: "The maternity team at Lagoon has looked after my family through two pregnancies now. JCI accreditation shows in how consistently protocols are followed, from prenatal visits through to postnatal checks.",
    },
  ],
  "nisa-premier": [
    {
      authorName: "Aisha Bello",
      authorRole: "Patient, fertility clinic",
      rating: 4,
      title: "Good specialist care in Abuja",
      body: "Nisa Premier's fertility unit was recommended by a friend and the consultants were thorough with diagnostics before recommending a treatment plan. Front-desk scheduling can be a bit slow to respond by phone.",
    },
  ],
  "first-cardiology": [
    {
      authorName: "Chidi Okonji",
      authorRole: "Patient, echocardiography",
      rating: 5,
      title: "Specialists who explain everything clearly",
      body: "As a dedicated cardiac centre, the level of specialisation really shows. My consultant walked me through my echo results in plain language and gave a clear follow-up plan rather than rushing to the next patient.",
    },
  ],
  "duchess-international": [
    {
      authorName: "Funmilayo Adekunle",
      authorRole: "Patient, oncology day ward",
      rating: 4,
      title: "Comprehensive care close to home",
      body: "Being a teaching hospital, there were sometimes more staff in the room than I expected during rounds, but the oncology day ward team were attentive and the ICU transfer process when needed was well coordinated.",
    },
  ],
};

async function main() {
  console.log("Seeding IndexOne database...");

  // ---- Regions ----
  const regionBySlug = new Map<string, string>();
  for (const r of REGIONS) {
    const row = await prisma.region.upsert({
      where: { slug: r.slug },
      update: { name: r.name },
      create: { slug: r.slug, name: r.name },
    });
    regionBySlug.set(r.slug, row.id);
  }

  // ---- Industries (vertical + sub-vertical) ----
  const industryBySub = new Map<string, string>(); // "fintech:Payments" -> id
  const industryByVertical = new Map<string, string>();
  for (const ind of INDUSTRIES) {
    const parent = await prisma.industry.upsert({
      where: { slug: ind.slug },
      update: { name: ind.name, icon: ind.icon, accent: ind.accent },
      create: { slug: ind.slug, name: ind.name, icon: ind.icon, accent: ind.accent },
    });
    industryByVertical.set(ind.slug, parent.id);
    for (const sub of ind.subs) {
      const subSlug = `${ind.slug}-${sub.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const subRow = await prisma.industry.upsert({
        where: { slug: subSlug },
        update: { name: sub, parentId: parent.id },
        create: { slug: subSlug, name: sub, parentId: parent.id },
      });
      industryBySub.set(`${ind.slug}:${sub}`, subRow.id);
    }
  }

  // ---- Features / tags ----
  const featureBySlug = new Map<string, string>();
  for (const vertical of Object.keys(TAGS)) {
    const industryId = industryByVertical.get(vertical)!;
    for (const t of TAGS[vertical]) {
      const row = await prisma.feature.upsert({
        where: { slug: t.slug },
        update: { name: t.name, group: t.grp, industryId },
        create: { slug: t.slug, name: t.name, group: t.grp, industryId },
      });
      featureBySlug.set(t.slug, row.id);
    }
  }

  // ---- Investors (deduped across all companies) ----
  const investorBySlug = new Map<string, string>();
  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  for (const l of LISTINGS) {
    const investors = l.cf.investors ?? [];
    for (const inv of investors) {
      const slug = slugify(inv.n);
      if (investorBySlug.has(slug)) continue;
      const row = await prisma.investor.upsert({
        where: { slug },
        update: { name: inv.n, type: inv.t },
        create: { slug, name: inv.n, type: inv.t },
      });
      investorBySlug.set(slug, row.id);
    }
  }

  // ---- Companies + nested data ----
  for (const l of LISTINGS) {
    const industryId = industryBySub.get(`${l.category}:${l.sub}`);
    if (!industryId) throw new Error(`Missing industry for ${l.slug} (${l.category}:${l.sub})`);

    const cf = l.cf;

    const company = await prisma.company.upsert({
      where: { slug: l.slug },
      update: {},
      create: {
        slug: l.slug,
        name: l.name,
        logoInitials: l.logo,
        logoColor: l.color,
        industryId,
        shortDescription: l.short,
        longDescription: l.long,
        website: l.website,
        heroImageId: HERO[l.slug] ?? null,
        socials: l.socials,
        foundingYear: cf.foundingYear ?? null,
        employeeRange: cf.employees ?? null,
        businessModel: cf.businessModel ?? null,
        regulator: cf.regulator ?? null,
        status: l.status,
        verification: l.verification,
        source: l.source,
        lastVerifiedAt: new Date(l.lastVerified),
        ratingScore: l.rating.score,
        ratingCount: l.rating.count,
        ratingDist: l.rating.dist,
        totalFunding: cf.totalFunding ?? null,
        valuation: cf.valuation ?? null,
        valuationDate: cf.valuationDate ?? null,
        licenses: cf.licenses ?? undefined,
        hospitalType: cf.hospitalType ?? null,
        ownership: cf.ownership ?? null,
        yearEstablished: cf.yearEstablished ?? null,
        bedCapacity: cf.bedCapacity ?? null,
        emergency: cf.emergency ?? null,
        city: cf.city ?? null,
        address: cf.address ?? null,
        services: cf.services ?? undefined,
        accreditation: cf.accreditation ?? undefined,
        accreditationBody: cf.accreditationBody ?? null,
        facilityBody: cf.facilityBody ?? null,
        facilityNo: cf.facilityNo ?? null,
        contactPhone: cf.contactPhone ?? null,
        contactEmail: cf.contactEmail ?? null,
        tags: { connect: l.tags.map((slug) => ({ id: featureBySlug.get(slug)! })) },
      },
    });

    // Regions
    for (const r of l.regions) {
      const regionId = regionBySlug.get(r.state);
      if (!regionId) continue;
      await prisma.companyRegion.upsert({
        where: { companyId_regionId: { companyId: company.id, regionId } },
        update: { isPrimary: !!r.primary },
        create: { companyId: company.id, regionId, isPrimary: !!r.primary },
      });
    }

    // Founders
    for (const f of l.founders) {
      const existing = await prisma.person.findFirst({
        where: { companyId: company.id, name: f.name },
      });
      if (!existing) {
        await prisma.person.create({
          data: { companyId: company.id, name: f.name, role: f.role },
        });
      }
    }

    // Funding rounds + investor linkage (fintech only)
    const rounds = cf.rounds ?? [];
    const investors = cf.investors ?? [];
    const matchedInvestorSlugs = new Set<string>();

    for (const round of rounds) {
      const existingRound = await prisma.fundingRound.findFirst({
        where: { companyId: company.id, round: round.r, date: round.d },
      });
      const roundRow =
        existingRound ??
        (await prisma.fundingRound.create({
          data: {
            companyId: company.id,
            round: round.r,
            date: round.d,
            amount: round.a,
            leadInvestor: round.l,
          },
        }));

      const parts = round.l.split("/").map((p) => p.trim());
      for (const part of parts) {
        const matched = investors.find(
          (inv) =>
            inv.n.toLowerCase() === part.toLowerCase() ||
            part.toLowerCase().includes(inv.n.toLowerCase()) ||
            inv.n.toLowerCase().includes(part.toLowerCase()),
        );
        if (!matched) continue;
        const investorId = investorBySlug.get(slugify(matched.n));
        if (!investorId) continue;
        matchedInvestorSlugs.add(slugify(matched.n));
        const existingJoin = await prisma.companyInvestor.findFirst({
          where: { companyId: company.id, investorId, fundingRoundId: roundRow.id },
        });
        if (!existingJoin) {
          await prisma.companyInvestor.create({
            data: { companyId: company.id, investorId, fundingRoundId: roundRow.id },
          });
        }
      }
    }

    // Remaining investors not tied to a specific round: general association
    for (const inv of investors) {
      const slug = slugify(inv.n);
      if (matchedInvestorSlugs.has(slug)) continue;
      const investorId = investorBySlug.get(slug);
      if (!investorId) continue;
      const existingJoin = await prisma.companyInvestor.findFirst({
        where: { companyId: company.id, investorId, fundingRoundId: null },
      });
      if (!existingJoin) {
        await prisma.companyInvestor.create({
          data: { companyId: company.id, investorId, fundingRoundId: null },
        });
      }
    }

    // Reviews
    const reviews = REVIEWS[l.slug] ?? [];
    for (const rv of reviews) {
      const existingReview = await prisma.review.findFirst({
        where: { companyId: company.id, authorName: rv.authorName, title: rv.title },
      });
      if (!existingReview) {
        await prisma.review.create({
          data: {
            companyId: company.id,
            authorName: rv.authorName,
            authorRole: rv.authorRole,
            rating: rv.rating,
            title: rv.title,
            body: rv.body,
          },
        });
      }
    }
  }

  const counts = {
    companies: await prisma.company.count(),
    regions: await prisma.region.count(),
    industries: await prisma.industry.count(),
    features: await prisma.feature.count(),
    investors: await prisma.investor.count(),
    fundingRounds: await prisma.fundingRound.count(),
    people: await prisma.person.count(),
    reviews: await prisma.review.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
