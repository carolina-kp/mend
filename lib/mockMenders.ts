// Concept mock-up data for the mender and community screens, and the demo quote.
// Everyone here is invented. Prices are placeholders to show the flow, not real quotes.

export type Mender = {
  id: string;
  name: string;
  age: number;
  initials: string;
  bio: string;
  area: string;
  rating: number; // out of 5
  jobs: number;
  priceRange: [number, number]; // kr, placeholder
  tools: string[];
  specialities: string[];
  projects: { title: string; fabric: string; swatch: string }[]; // swatch: a CSS colour for the tile
};

export const MENDERS: Mender[] = [
  {
    id: "ida",
    name: "Ida",
    age: 24,
    initials: "I",
    bio: "Studies design, sews at weekends. Happiest turning jeans and shirts into bags and aprons.",
    area: "Nørrebro",
    rating: 4.8,
    jobs: 31,
    priceRange: [150, 450],
    tools: ["Sewing machine with denim needles", "Overlocker", "Hand sewing"],
    specialities: ["Denim", "Tote bags", "Raw hems"],
    projects: [
      { title: "Jeans into a tote", fabric: "Denim", swatch: "#4a5d78" },
      { title: "Shirt-front apron", fabric: "Cotton", swatch: "#e9e4d8" },
      { title: "Pocket organiser", fabric: "Denim", swatch: "#3c4c63" },
      { title: "Cropped shirt, raw hem", fabric: "Linen", swatch: "#d8cdb8" },
    ],
  },
  {
    id: "malik",
    name: "Malik",
    age: 27,
    initials: "M",
    bio: "Learned to darn from his grandmother. Visible mending and knitwear repairs, all by hand.",
    area: "Vesterbro",
    rating: 4.9,
    jobs: 22,
    priceRange: [100, 300],
    tools: ["Hand sewing", "Darning mushroom", "Embroidery hoops"],
    specialities: ["Wool", "Visible mending", "Elbow patches"],
    projects: [
      { title: "Sashiko knee patch", fabric: "Denim", swatch: "#2f3d52" },
      { title: "Darned wool elbows", fabric: "Wool", swatch: "#8a6f5a" },
      { title: "Embroidered collar", fabric: "Cotton", swatch: "#f1ece2" },
    ],
  },
  {
    id: "sofie",
    name: "Sofie",
    age: 21,
    initials: "S",
    bio: "Fashion student who loves a challenge. Dresses into skirts, sweaters into cardigans.",
    area: "Frederiksberg",
    rating: 4.6,
    jobs: 14,
    priceRange: [250, 700],
    tools: ["Sewing machine", "Overlocker", "Pattern paper"],
    specialities: ["Knits", "Dresses", "Reshaping"],
    projects: [
      { title: "Sweater into cardigan", fabric: "Wool", swatch: "#a15c4a" },
      { title: "Dress into skirt", fabric: "Viscose", swatch: "#6d7a5f" },
      { title: "Felted mittens", fabric: "Wool", swatch: "#7c5f78" },
      { title: "Scrunchie set", fabric: "Polyester", swatch: "#c9a27e" },
    ],
  },
];

// Placeholder price range by idea difficulty, in kr. Shown only as "Example quote (demo)".
export const DEMO_QUOTE_BY_DIFFICULTY: Record<number, [number, number]> = { 1: [100, 180], 2: [150, 250], 3: [220, 380], 4: [350, 550], 5: [500, 800] };
export const demoQuote = (difficulty: number) => ({
  mender: MENDERS[0],
  range: DEMO_QUOTE_BY_DIFFICULTY[difficulty] ?? DEMO_QUOTE_BY_DIFFICULTY[3],
  days: difficulty <= 2 ? "3 to 5 days" : difficulty === 3 ? "about a week" : "1 to 2 weeks",
});

// Community feed (concept): made-up posts of finished projects.
export const COMMUNITY_POSTS = [
  { id: "p1", author: "Freja", idea: "Felted wool cuff mittens", from: "Wool sweater", note: "Took two hot washes. Warmest mittens I own.", made: "Myself", swatch: "#8a6f5a" },
  { id: "p2", author: "Jonas", idea: "Jeans into a tote", from: "Stretch jeans", note: "Ida made it in a week. The pockets are my favourite part.", made: "By Ida", swatch: "#4a5d78" },
  { id: "p3", author: "Amara", idea: "Sew-on patch accents", from: "Acrylic sweater", note: "So glad the app stopped me reaching for the iron.", made: "Myself", swatch: "#b8a1c4" },
  { id: "p4", author: "Lukas", idea: "Front-knot shirt", from: "Cotton shirt", note: "Zero tools, five minutes. Wore it the same day.", made: "Myself", swatch: "#e9e4d8" },
];
