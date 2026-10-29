// Rule-based idea bank. Used when Gemini is down, slow or keeps breaking the rules,
// and to top up a set when only some of the model's ideas pass the rule check.
// Each template says what it needs; pickFallbackIdeas() keeps the ones that fit
// the garment, fabric, tools and skill, runs the same rule check as the AI ideas,
// and returns three with a spread of difficulty. Runs on the server and in the browser.
import type { GarmentId } from "./config";
import { buildConstraints, checkIdea, type ConstraintInput, type Constraints } from "./buildConstraints";
import { FIBRE_RULES, fibreLabel } from "./fabricRules";
import type { Idea } from "./schema";

type Needs = {
  scissors?: boolean;
  needle?: boolean; // hand sewing
  sew?: boolean; // needle or machine
  machine?: boolean;
  glue?: boolean;
  paint?: boolean;
  patches?: boolean; // iron-on patches, an iron and a fabric that takes medium heat
};

type Template = {
  id: string;
  garments?: GarmentId[]; // default: all
  needs: Needs;
  when?: (c: Constraints) => boolean; // extra fabric condition
  difficulty: number;
  timeMinutes: number | ((c: Constraints) => number);
  build: (c: Constraints, w: Words) => Omit<Idea, "id" | "difficulty" | "timeMinutes" | "warnings" | "menderBrief"> & { warnings?: string[] };
};

// Garment words used to fill the templates.
type Words = { fabric: string; Fabric: string; aFabric: string; AFabric: string; garment: string; part: string; parts: string };
const PART: Record<GarmentId, [string, string]> = {
  sweater: ["sleeve", "sleeves"],
  jeans: ["leg", "legs"],
  shirt: ["sleeve", "sleeves"],
  skirt: ["hem", "hem"],
  dress: ["skirt part", "skirt part"],
};
function words(c: Constraints): Words {
  const fabric = c.isDenim ? "denim" : fibreLabel(c.mainFibre).toLowerCase();
  const aFabric = `${/^[aeiou]/.test(fabric) ? "an" : "a"} ${fabric}`;
  return {
    fabric,
    Fabric: fabric[0].toUpperCase() + fabric.slice(1),
    aFabric,
    AFabric: aFabric[0].toUpperCase() + aFabric.slice(1),
    garment: c.garmentLabel.toLowerCase(),
    part: PART[c.garment][0],
    parts: PART[c.garment][1],
  };
}

const knitFirst = (c: Constraints) => (c.construction === "knit" ? ["Stitch twice along each cutting line first so the knit does not unravel."] : []);
const denimHand = (c: Constraints) => (c.isDenim && !c.has.machine ? ["Use a thimble and strong thread, and keep away from the thick side seams."] : []);
const denimMachine = (c: Constraints) => (c.isDenim ? ["Fit a denim needle (100/16 or 110/18) and sew slowly over thick parts."] : []);
const stretchMachine = (c: Constraints) => (c.stretch ? ["Use a stretch stitch or a ballpoint needle and let the fabric feed without pulling."] : []);
const sewTool = (c: Constraints) => (c.has.machine ? "Sewing machine" : "Needle and thread");
const woven = (c: Constraints) => c.construction === "woven";
const glueHolds = (c: Constraints) => FIBRE_RULES[c.mainFibre].glue === "good";

const TEMPLATES: Template[] = [
  // ---------- No tools at all ----------
  {
    id: "knot-restyle",
    needs: {},
    difficulty: 1,
    timeMinutes: 15,
    build: (c, w) => ({
      title: { sweater: "Tucked and tied sweater", jeans: "Rolled cuff restyle", shirt: "Front-knot shirt", skirt: "Side-knot skirt", dress: "Knotted waist dress" }[c.garment],
      summary: `Give the ${w.garment} a new shape by folding and knotting, with nothing permanent.`,
      tools: [],
      materials: [`Your ${w.garment}`, ...(c.garment === "sweater" || c.garment === "dress" ? ["A belt or scarf (optional)"] : [])],
      steps: {
        sweater: ["Put the sweater on and tuck the front into your waistband.", "Pull the back down so it drapes.", "Add a belt or scarf at the waist to hold the new shape."],
        jeans: ["Turn each leg up twice by about 4 cm.", "Make both cuffs the same height with a ruler or your hand.", "Wear with the inside showing as a contrast stripe."],
        shirt: ["Leave the bottom three buttons open.", "Take the two front tails and tie them in a double knot at the waist.", "Roll the sleeves up twice to above the elbow."],
        skirt: ["Gather the hem at one side.", "Twist the gathered part and tie it in a knot at knee height.", "Tuck the ends under so the knot sits flat."],
        dress: ["Put the dress on and pull a handful of fabric together at one hip.", "Twist it and tie it in a knot.", "Tuck the ends under or add a belt above the knot."],
      }[c.garment],
      fabricReason: woven(c)
        ? `${w.Fabric} holds a knot and a fold without needing anything permanent.`
        : `${w.AFabric} knit is soft enough to knot and drape without any changes.`,
    }),
  },
  {
    id: "knot-bag",
    needs: {},
    difficulty: 1,
    timeMinutes: 10,
    build: (c, w) => ({
      title: c.garment === "jeans" || c.garment === "sweater" || c.garment === "shirt" ? `Knotted ${w.parts} carry bag` : "Wrap-and-knot carry bag",
      summary: `Fold the ${w.garment} into a bundle bag held together only by knots, furoshiki style.`,
      tools: [],
      materials: [`Your ${w.garment}`],
      steps: [
        `Lay the ${w.garment} flat and fold it into a rough square.`,
        "Put the things you want to carry in the middle.",
        c.garment === "jeans" || c.garment === "sweater" || c.garment === "shirt"
          ? `Bring the ${w.parts} up and tie them together in a double knot to make a handle.`
          : "Tie two opposite corners together in a double knot to make a handle.",
        "Tie the other two corners over the top to close it.",
      ],
      fabricReason: `${w.Fabric} is strong enough to carry light things and keeps the knots in place.`,
    }),
  },
  {
    id: "cushion-wrap",
    garments: ["sweater", "shirt", "skirt", "dress"],
    needs: {},
    difficulty: 1,
    timeMinutes: 15,
    build: (c, w) => ({
      title: c.garment === "shirt" ? "Buttoned shirt cushion cover" : `No-change ${w.garment} cushion cover`,
      summary: `Wrap a cushion in the ${w.garment} so it lives on the sofa instead of the wardrobe.`,
      tools: [],
      materials: [`Your ${w.garment}`, "A cushion pad that fits inside", ...(c.garment === "skirt" || c.garment === "dress" ? ["Two hair ties"] : [])],
      steps:
        c.garment === "shirt"
          ? ["Button the shirt up.", "Push the cushion pad in from the bottom.", "Fold the sleeves across the back and tie them together.", "Tuck the shirt tails under the cushion."]
          : c.garment === "sweater"
            ? ["Pull the sweater over the cushion pad like a sleeve.", "Tuck the sleeves inside the body.", "Fold the neck and the waistband under the cushion so the front is smooth."]
            : [`Slide the cushion pad into the ${w.garment} like a tube.`, "Gather each open end and close it with a hair tie.", "Tuck the gathered ends in for a neat roll shape."],
      fabricReason: c.construction === "knit" ? `The ${w.fabric} knit stretches over the pad and gives a soft, cosy cover.` : `${w.Fabric} wraps neatly and is easy to take off and wash.`,
    }),
  },
  {
    id: "pocket-tidy",
    garments: ["jeans"],
    needs: {},
    difficulty: 1,
    timeMinutes: 10,
    build: (_c, w) => ({
      title: "Hanging pocket tidy",
      summary: "Hang the jeans on a door and use their five pockets for keys, cables and notes.",
      tools: [],
      materials: ["Your jeans", "A door hook or a hanger with clips"],
      steps: ["Fold the legs up behind the jeans so only the top half shows.", "Hang the waistband from a door hook or a clip hanger.", "Fill the front and back pockets with small things you keep losing."],
      fabricReason: `${w.Fabric} pockets are double layered and riveted, so they carry weight without tearing.`,
    }),
  },

  // ---------- Scissors ----------
  {
    id: "raw-hem",
    needs: { scissors: true },
    when: woven,
    difficulty: 1,
    timeMinutes: 20,
    build: (c, w) => ({
      title: { sweater: "Raw hem", jeans: "Raw-hem cut-offs", shirt: "Shorter shirt with a raw hem", skirt: "Shorter raw-hem skirt", dress: "Shorter raw-hem dress" }[c.garment],
      summary: `Cut the ${w.garment} to a new length and let the edge fray softly.`,
      tools: ["Scissors"],
      materials: [`Your ${w.garment}`, "A ruler or tape measure", "Chalk or a pencil"],
      steps: [
        "Try it on and mark the length you want.",
        "Lay it flat and draw a straight line 1 cm below your mark.",
        `Cut along the line through one layer at a time.`,
        "Pull out a few loose threads along the edge for an even fray.",
        "Wash it once so the fray settles.",
      ],
      fabricReason: c.isDenim ? "Denim frays into a soft, even fringe, so a raw hem looks finished." : `${w.Fabric} is woven, so a cut edge frays into a soft line instead of unravelling.`,
    }),
  },
  {
    id: "fringe",
    needs: { scissors: true },
    when: (c) => woven(c) && c.frays >= 1.5,
    difficulty: 2,
    timeMinutes: 45,
    build: (c, w) => ({
      title: c.isDenim ? "Long fringe hem" : `Fringed ${w.part}`,
      summary: `Pull threads from the cut edge to make a deliberate fringe.`,
      tools: ["Scissors"],
      materials: [`Your ${w.garment}`, "A pin to tease threads"],
      steps: [
        `Cut the ${w.part} straight at the length you want.`,
        "Use a pin to pick out the threads running across, one by one, until the fringe is 2 to 3 cm deep.",
        "Trim any long strands so the fringe is even.",
        "Wash gently once to fluff it up.",
      ],
      fabricReason: `${w.Fabric} frays heavily, which is exactly what makes a fringe easy.`,
    }),
  },
  {
    id: "ribbon-ties",
    needs: { scissors: true },
    when: woven,
    difficulty: 1,
    timeMinutes: 30,
    build: (c, w) => ({
      title: "Fabric ribbons and gift ties",
      summary: `Cut the ${w.garment} into long strips to use as ribbon, hair ties or plant ties.`,
      tools: ["Scissors"],
      materials: [`Your ${w.garment}`, "A ruler", "Chalk"],
      steps: [
        `Cut the ${w.garment} open along a seam so it lies flat.`,
        "Mark strips 2 to 3 cm wide with chalk and a ruler.",
        "Cut along the lines.",
        "Tug each strip gently so the edges fray a little and roll in.",
      ],
      fabricReason: `${w.Fabric} is woven, so thin strips stay strong and the edges fray only a little.`,
    }),
  },

  // ---------- Felting (mostly wool) ----------
  {
    id: "felted-coasters",
    needs: { scissors: true },
    when: (c) => c.canFelt,
    difficulty: 2,
    timeMinutes: 120,
    build: (_c, w) => ({
      title: "Felted coasters",
      summary: "Shrink the sweater on purpose in a hot wash, then cut dense coasters that never fray.",
      tools: ["Scissors"],
      materials: [`Your ${w.garment}`, "A washing machine", "A cup or jar to draw circles"],
      steps: [
        "Wash it on a hot cycle (60 °C) with a pair of jeans to add rubbing.",
        "Let it dry flat. Repeat the hot wash if it is still stretchy.",
        "Draw circles around a cup on the felted fabric.",
        "Cut the circles out. The edges stay clean.",
      ],
      fabricReason: "Wool felts with heat and rubbing, so the cut fabric becomes dense and stops fraying.",
      warnings: ["Felting is permanent: the whole garment will shrink."],
    }),
  },
  {
    id: "felted-mittens",
    garments: ["sweater"],
    needs: { scissors: true, needle: true },
    when: (c) => c.canFelt,
    difficulty: 3,
    timeMinutes: 180,
    build: (_c, w) => ({
      title: "Felted mittens from the cuffs",
      summary: "Felt the sweater, then cut mittens with the ribbed cuffs as the wrist.",
      tools: ["Scissors", "Needle and thread"],
      materials: [`Your ${w.garment}`, "A washing machine", "Paper for a hand template", "Wool or strong thread"],
      steps: [
        "Wash the sweater on a hot cycle (60 °C) and dry it flat. Repeat until it is thick and dense.",
        "Draw around your hand in a mitten shape on paper, adding 1 cm all round.",
        "Pin the template on a sleeve so the ribbed cuff is at the wrist, and cut through both layers.",
        "Blanket stitch the two layers together by hand around the edge.",
        "Repeat on the other sleeve.",
      ],
      fabricReason: "Felted wool is thick, warm and does not unravel, so mittens hold their shape.",
      warnings: ["Felting is permanent: the whole garment will shrink."],
    }),
  },

  // ---------- Needle and thread ----------
  {
    id: "visible-mend",
    needs: { needle: true },
    difficulty: 2,
    timeMinutes: 45,
    build: (c, w) => ({
      title: "Visible mend with running stitch",
      summary: `Turn a worn or thin spot on the ${w.garment} into a feature with rows of contrast stitches.`,
      tools: ["Needle and thread"],
      materials: [`Your ${w.garment}`, "Contrast embroidery thread", "A small scrap of fabric for behind the spot", "Pins"],
      steps: [
        "Pin a fabric scrap behind the worn spot, on the inside.",
        "Thread a needle with a contrast colour and knot the end.",
        "Sew rows of small running stitches across the spot, 5 mm apart, through both layers.",
        ...denimHand(c),
        "Finish on the inside with two small stitches on top of each other and a knot.",
      ],
      fabricReason:
        c.construction === "knit"
          ? `Running stitch holds the loose loops of ${w.aFabric} knit in place without pulling them tight.`
          : `${w.Fabric} holds hand stitches well, so the mend is strong and decorative.`,
    }),
  },
  {
    id: "sewn-patch",
    needs: { needle: true },
    difficulty: 1,
    timeMinutes: 30,
    build: (c, w) => ({
      title: c.maxIron === "none" ? "Sew-on patch (no heat needed)" : "Sew-on patch cover-up",
      summary: `Cover a hole or stain on the ${w.garment} with a patch you stitch on by hand.`,
      tools: ["Needle and thread"],
      materials: [`Your ${w.garment}`, "A ready-made sew-on patch", "Thread in a matching or contrast colour", "Pins"],
      steps: [
        "Place the patch over the spot and pin it at the corners.",
        "Sew around the edge with small whip stitches, 3 mm apart.",
        ...denimHand(c),
        ...(c.construction === "knit" ? ["Keep the stitches loose so the knit can still stretch."] : []),
        "Knot the thread on the inside.",
      ],
      fabricReason:
        c.maxIron === "none" || c.maxIron === "low"
          ? `${w.Fabric} cannot take the heat an iron-on patch needs, so stitching it on is the safe way.`
          : `${w.Fabric} holds hand stitches firmly, so a sewn patch lasts longer than glue.`,
    }),
  },
  {
    id: "embroidery",
    needs: { needle: true },
    difficulty: 2,
    timeMinutes: 60,
    build: (c, w) => ({
      title: c.garment === "shirt" ? "Embroidered collar" : `Embroidered ${w.garment} motif`,
      summary: `Add a small hand-stitched design, like a flower or initials, to the ${w.garment}.`,
      tools: ["Needle and thread"],
      materials: [`Your ${w.garment}`, "Embroidery thread", "A water-soluble pen or chalk"],
      steps: [
        "Draw a simple design, about the size of a coin, with chalk or a washable pen.",
        "Outline it with back stitch.",
        "Fill in small areas with satin stitch.",
        ...(c.construction === "knit" ? ["Do not pull the stitches tight, or the knit will pucker."] : []),
        "Rinse off any pen marks.",
      ],
      fabricReason:
        c.construction === "knit"
          ? `${w.AFabric} knit has open loops that take embroidery thread easily.`
          : `${w.Fabric} has a firm surface, so small stitches stay crisp.`,
    }),
  },
  {
    id: "button-swap",
    garments: ["shirt", "dress"],
    needs: { needle: true },
    difficulty: 1,
    timeMinutes: 30,
    build: (_c, w) => ({
      title: "New buttons, new character",
      summary: `Replace the plain buttons on the ${w.garment} with ones you love.`,
      tools: ["Needle and thread"],
      materials: [`Your ${w.garment}`, "New buttons the same size", "Thread"],
      steps: [
        "Unpick one old button at a time so you keep the position.",
        "Sew the new button on through the same holes, with a pin between button and fabric to leave slack.",
        "Wind the thread round the stitches under the button a few times, then knot on the inside.",
        "Repeat for the rest.",
      ],
      fabricReason: `${w.Fabric} has a firm button band, so new buttons sit flat and hold.`,
    }),
  },

  // ---------- Needle (or machine) and scissors ----------
  {
    id: "scrunchie",
    needs: { sew: true, scissors: true },
    difficulty: 2,
    timeMinutes: 45,
    build: (c, w) => ({
      title: `Scrunchie from the ${w.part}`,
      summary: `Cut a strip from the ${w.garment} and sew it around a hair elastic.`,
      tools: [sewTool(c), "Scissors"],
      materials: [`Your ${w.garment}`, "A hair elastic or 20 cm of thin elastic", "A safety pin"],
      steps: [
        ...knitFirst(c),
        `Cut a strip 50 cm long and 10 cm wide from the ${w.part}.`,
        "Fold it in half lengthways, right sides together, and sew the long edge.",
        "Turn it right side out and thread the elastic through with a safety pin.",
        "Tie the elastic ends, tuck one fabric end into the other and stitch closed.",
      ],
      fabricReason: c.isDenim ? "Denim makes a chunky, sturdy scrunchie that keeps its shape." : `A small piece of ${w.fabric} is enough, and gathering hides any uneven edges.`,
    }),
  },
  {
    id: "elbow-patches",
    garments: ["sweater", "shirt"],
    needs: { needle: true, scissors: true },
    difficulty: 2,
    timeMinutes: 60,
    build: (c, w) => ({
      title: "Elbow patches",
      summary: `Add two oval patches to the ${w.parts} where the ${w.garment} wears first.`,
      tools: ["Needle and thread", "Scissors"],
      materials: [`Your ${w.garment}`, "A fabric scrap (old jeans or cord work well)", "Paper for an oval template", "Pins"],
      steps: [
        "Draw an oval about 10 by 14 cm on paper and cut two ovals from the scrap.",
        "Put the garment on and mark where each elbow sits.",
        "Slide a magazine inside the sleeve so you only sew through one layer.",
        "Pin each patch in place and sew around it with small whip stitches.",
      ],
      fabricReason:
        c.construction === "knit"
          ? `Patches protect the weakest part of ${w.aFabric} knit, and hand stitching lets the knit still stretch.`
          : `${w.Fabric} wears through at the elbow first, and a patch adds a second layer there.`,
    }),
  },
  {
    id: "drawstring-pouch",
    needs: { sew: true, scissors: true },
    difficulty: 3,
    timeMinutes: (c) => (c.has.machine ? 60 : 120),
    build: (c, w) => ({
      title: "Drawstring pouch",
      summary: `Turn part of the ${w.garment} into a small pouch for chargers, make-up or socks.`,
      tools: [sewTool(c), "Scissors"],
      materials: [`Your ${w.garment}`, "A cord or shoelace", "A safety pin"],
      steps: [
        ...knitFirst(c),
        `Cut two rectangles of 20 by 25 cm from a flat part of the ${w.garment}.`,
        "Put them right sides together and sew around three sides, leaving the top open.",
        ...(c.has.machine ? [...denimMachine(c), ...stretchMachine(c)] : denimHand(c)),
        "Fold the top edge down 2 cm and sew it to make a channel, leaving a small gap.",
        "Thread the cord through the channel with a safety pin and knot the ends.",
        "Turn the pouch right side out.",
      ],
      fabricReason: c.isDenim ? "Denim is tough, so the pouch can carry heavy things." : `${w.Fabric} is soft and flexible, so it gathers neatly when you pull the cord.`,
    }),
  },
  {
    id: "cushion-cover",
    garments: ["sweater", "shirt", "skirt", "dress"],
    needs: { sew: true, scissors: true },
    difficulty: 3,
    timeMinutes: (c) => (c.has.machine ? 75 : 150),
    build: (c, w) => ({
      title: c.garment === "shirt" ? "Cushion cover with the button placket" : `Sewn ${w.garment} cushion cover`,
      summary: `Cut a square from the front and back of the ${w.garment} and sew a proper cushion cover.`,
      tools: [sewTool(c), "Scissors"],
      materials: [`Your ${w.garment}`, "A cushion pad (40 cm works for most)", "Pins"],
      steps: [
        c.garment === "shirt" ? "Button the shirt up and lay it flat with the buttons in the middle." : `Lay the ${w.garment} flat.`,
        ...knitFirst(c),
        "Cut a square through both layers, 2 cm bigger than the cushion pad on each side.",
        "With the right sides together, pin and sew all four sides 1 cm from the edge.",
        ...(c.has.machine ? stretchMachine(c) : []),
        c.garment === "shirt" ? "Unbutton, turn the cover right side out and slide the pad in." : "Leave a 20 cm gap on one side, turn it right side out, push the pad in and stitch the gap closed.",
      ],
      fabricReason:
        c.construction === "knit" ? `${w.AFabric} knit stretches snugly over the pad and feels soft.` : `${w.Fabric} is firm enough to keep a square shape on a sofa.`,
    }),
  },
  {
    id: "jeans-tote",
    garments: ["jeans", "skirt"],
    needs: { sew: true, scissors: true },
    difficulty: 3,
    timeMinutes: (c) => (c.has.machine ? 90 : 180),
    build: (c, w) => ({
      title: c.garment === "jeans" ? "Tote bag from the legs" : "Tote bag from the skirt",
      summary: `Cut panels from the ${w.garment} and sew them into a strong everyday tote.`,
      tools: [sewTool(c), "Scissors"],
      materials: [`Your ${w.garment}`, "Strong thread", "Pins", "A ruler and chalk"],
      steps: [
        c.garment === "jeans" ? "Cut both legs off just below the crotch, then cut each leg open along the inside seam (not the thick outer seam)." : "Cut the skirt open along one side seam so it lies flat.",
        "Cut two panels of 35 by 40 cm and two strips of 8 by 60 cm for the straps.",
        ...(c.has.machine ? [...denimMachine(c), ...stretchMachine(c)] : denimHand(c)),
        "Sew the panels right sides together on three sides, 1 cm from the edge.",
        "Fold each strap in half lengthways, sew it, and turn it out.",
        "Fold the top of the bag down 3 cm, tuck the straps under, and sew around the top.",
      ],
      fabricReason: c.isDenim ? "Denim is thick and strong, so the bag holds its shape without a lining." : `${w.Fabric} gives enough flat fabric for two panels and two straps.`,
    }),
  },
  {
    id: "pocket-organiser",
    garments: ["jeans"],
    needs: { sew: true, scissors: true },
    difficulty: 2,
    timeMinutes: 75,
    build: (c, w) => ({
      title: "Wall pocket organiser",
      summary: "Cut out the back pockets and sew them onto a panel from the leg to hang by the door.",
      tools: [sewTool(c), "Scissors"],
      materials: ["Your jeans", "A wooden hanger or stick", "Pins"],
      steps: [
        "Cut the back pockets out, leaving 2 cm of fabric around each.",
        "Cut a 30 by 45 cm panel from one leg, avoiding the thick seams.",
        "Pin the pockets onto the panel and sew around their sides and bottom.",
        ...(c.has.machine ? denimMachine(c) : denimHand(c)),
        "Fold the top of the panel over the hanger and sew it in place.",
      ],
      fabricReason: `${w.Fabric} pockets are already reinforced, so they carry keys and post easily.`,
    }),
  },
  {
    id: "cropped-knit",
    garments: ["sweater"],
    needs: { sew: true, scissors: true },
    difficulty: 3,
    timeMinutes: (c) => (c.has.machine ? 60 : 120),
    build: (c, w) => ({
      title: "Cropped sweater with a stitched hem",
      summary: "Shorten the sweater to waist length and finish the edge so it never unravels.",
      tools: [sewTool(c), "Scissors"],
      materials: ["Your sweater", "Chalk", "Pins"],
      steps: [
        "Try it on and mark the new length with chalk, plus 3 cm for the hem.",
        "Sew two rows of small stitches just below the line, all the way round.",
        "Cut along the line, below your stitches.",
        "Fold the raw edge up 3 cm and sew it down loosely so it can stretch.",
        ...(c.has.machine ? stretchMachine(c) : []),
      ],
      fabricReason: `${w.AFabric} knit unravels when cut, so stitching first locks the loops before you cut.`,
    }),
  },

  // ---------- Sewing machine ----------
  {
    id: "shirt-apron",
    garments: ["shirt"],
    needs: { machine: true, scissors: true },
    difficulty: 3,
    timeMinutes: 120,
    build: (c, w) => ({
      title: "Shirt-front apron",
      summary: "Cut the front of the shirt into a half apron and use the sleeves as ties.",
      tools: ["Sewing machine", "Scissors"],
      materials: ["Your shirt", "Pins", "Matching thread"],
      steps: [
        "Cut the back panel off the shirt in one piece.",
        "Cut a 50 by 40 cm rectangle from it for the apron body.",
        "Cut both sleeves open along the seam and cut two strips 8 cm wide for the ties.",
        "Fold and machine stitch a double 1 cm hem on the sides and bottom.",
        ...stretchMachine(c),
        "Sew the ties folded in half lengthways, then stitch them to the top corners.",
      ],
      fabricReason: `${w.Fabric} shirting is light, washes easily and takes a crisp machine hem.`,
    }),
  },
  {
    id: "lined-tote",
    needs: { machine: true, scissors: true },
    difficulty: 4,
    timeMinutes: 180,
    build: (c, w) => ({
      title: "Lined patchwork tote",
      summary: `Piece together panels from the ${w.garment} into a lined tote with boxed corners.`,
      tools: ["Sewing machine", "Scissors"],
      materials: [`Your ${w.garment}`, "Old cotton fabric for the lining", "Pins", "Ruler and chalk"],
      steps: [
        "Cut six 15 cm squares from the flattest parts of the garment.",
        "Sew them into two panels of three, then sew the panels together on three sides.",
        ...denimMachine(c),
        ...stretchMachine(c),
        "Cut and sew a lining the same size from the cotton.",
        "Box each bottom corner by flattening it into a triangle and stitching 4 cm in.",
        "Put the lining inside, fold both top edges in, add straps between them and topstitch around.",
      ],
      fabricReason: c.isDenim ? "Denim squares give a heavy, durable bag, and the lining hides the fraying edges." : `A lining covers the ${w.fabric} cut edges, so fraying is not a problem.`,
    }),
  },
  {
    id: "dress-to-skirt",
    garments: ["dress"],
    needs: { machine: true, scissors: true },
    difficulty: 4,
    timeMinutes: 150,
    build: (c, w) => ({
      title: "Dress into an elastic-waist skirt",
      summary: "Cut the bodice off and give the skirt part a new elastic waistband.",
      tools: ["Sewing machine", "Scissors"],
      materials: ["Your dress", "2.5 cm wide elastic, your waist size", "A safety pin"],
      steps: [
        "Cut the bodice off 4 cm above the waist seam.",
        "Fold the cut edge down 3 cm and sew it all round, leaving a 5 cm gap.",
        ...stretchMachine(c),
        "Thread the elastic through the channel with a safety pin and overlap the ends by 2 cm.",
        "Sew the elastic ends together, then close the gap.",
      ],
      fabricReason: `${w.Fabric} in the skirt part already hangs well, so only the waist needs work.`,
    }),
  },
  {
    id: "sweater-cardigan",
    garments: ["sweater"],
    needs: { machine: true, scissors: true },
    difficulty: 4,
    timeMinutes: 150,
    build: (c, w) => ({
      title: "Sweater into a cardigan",
      summary: "Open the sweater down the centre front and bind the edges with ribbon.",
      tools: ["Sewing machine", "Scissors"],
      materials: ["Your sweater", "2 m of 2.5 cm cotton ribbon", "Pins"],
      steps: [
        "Mark a straight line down the centre front with chalk.",
        "Machine sew two rows of stretch stitch on each side of the line.",
        "Cut between the rows of stitching.",
        "Fold the ribbon over each cut edge, pin, and sew it down with a stretch stitch.",
        "Add buttons or leave it open.",
      ],
      fabricReason: `Stitching first stops the ${w.fabric} knit unravelling, and the ribbon stops it stretching out.`,
    }),
  },

  // ---------- Fabric glue ----------
  {
    id: "glued-hem",
    needs: { glue: true, scissors: true },
    when: (c) => woven(c) && glueHolds(c),
    difficulty: 1,
    timeMinutes: 30,
    build: (c, w) => ({
      title: "No-sew glued hem",
      summary: `Shorten the ${w.garment} and hold the new hem with fabric glue.`,
      tools: ["Fabric glue", "Scissors"],
      materials: [`Your ${w.garment}`, "Clothes pegs or clips", "A ruler"],
      steps: [
        "Mark the new length, plus 3 cm for the hem.",
        "Cut along the line.",
        "Fold the edge up 3 cm and run a thin line of glue under the fold.",
        "Hold it closed with clips and let it dry for 24 hours before wearing or washing.",
      ],
      fabricReason: `Fabric glue grips ${w.fabric} fibres well, and the fold hides the frayed edge.`,
    }),
  },
  {
    id: "glued-applique",
    needs: { glue: true, scissors: true },
    when: glueHolds,
    difficulty: 1,
    timeMinutes: 40,
    build: (_c, w) => ({
      title: "Glued fabric appliqué",
      summary: `Cut shapes from a scrap and glue them onto the ${w.garment} as decoration.`,
      tools: ["Fabric glue", "Scissors"],
      materials: [`Your ${w.garment}`, "A contrast fabric scrap", "A piece of card to put inside"],
      steps: [
        "Cut simple shapes (circles, leaves, a stripe) from the scrap.",
        "Slide card inside the garment so glue does not go through.",
        "Spread glue thinly on the back of each shape, right to the edges.",
        "Press it in place and leave it flat for 24 hours.",
      ],
      fabricReason: `${w.Fabric} has a fibre that fabric glue bonds to well.`,
    }),
  },

  // ---------- Fabric paint ----------
  {
    id: "painted-design",
    needs: { paint: true },
    difficulty: 2,
    timeMinutes: 60,
    build: (c, w) => ({
      title: c.garment === "jeans" ? "Painted back pocket" : `Hand-painted ${w.garment}`,
      summary: `Paint a simple pattern, like stripes or dots, onto the ${w.garment}.`,
      tools: ["Fabric paint", ...(c.has.iron && (c.maxIron === "medium" || c.maxIron === "high") ? ["Iron"] : [])],
      materials: [`Your ${w.garment}`, "A brush or sponge", "A piece of card to put inside", "Masking tape"],
      steps: [
        "Wash and dry the garment so the paint can soak in.",
        "Slide card inside so the paint does not go through.",
        "Mask stripes with tape, or dab dots with the end of a brush.",
        "Paint thin coats and let each one dry.",
        c.has.iron && (c.maxIron === "medium" || c.maxIron === "high")
          ? "Fix the paint with the iron on the lowest setting the paint label allows, through a cloth."
          : "Let it air-cure for 3 days before washing, as the paint label says.",
      ],
      fabricReason:
        c.mainFibre === "cotton" || c.mainFibre === "linen"
          ? `${w.Fabric} soaks up fabric paint, so colours stay bright.`
          : `${w.Fabric} takes paint on the surface, so thin coats crack less than thick ones.`,
      warnings: c.mainFibre === "cotton" || c.mainFibre === "linen" ? [] : ["Synthetic fibres hold paint less well: test a small area first."],
    }),
  },

  // ---------- Iron-on patches ----------
  {
    id: "iron-on-patch",
    needs: { patches: true },
    difficulty: 1,
    timeMinutes: 20,
    build: (c, w) => ({
      title: "Iron-on patch cover-up",
      summary: `Cover a hole or stain on the ${w.garment} with an iron-on patch.`,
      tools: ["Iron", "Iron-on patches"],
      materials: [`Your ${w.garment}`, "A thin cotton cloth"],
      steps: [
        "Lay the garment flat on an ironing board.",
        "Place the patch over the spot, glue side down.",
        "Cover with the cloth and press with the iron on the setting the patch packet gives.",
        "Let it cool before moving it.",
      ],
      fabricReason: `${w.Fabric} takes enough heat for the patch glue to bond.`,
    }),
  },
];

function fits(t: Template, c: Constraints) {
  if (t.garments && !t.garments.includes(c.garment)) return false;
  const n = t.needs;
  if (n.scissors && !c.has.scissors) return false;
  if (n.needle && !c.has.needle) return false;
  if (n.sew && !c.canSew) return false;
  if (n.machine && !c.has.machine) return false;
  if (n.glue && !c.has.glue) return false;
  if (n.paint && !c.has.paint) return false;
  if (n.patches && !(c.has.patches && c.has.iron && (c.maxIron === "medium" || c.maxIron === "high"))) return false;
  if (t.difficulty > c.maxDifficulty) return false;
  return !t.when || t.when(c);
}

function buildIdea(t: Template, c: Constraints): Idea {
  const w = words(c);
  const body = t.build(c, w);
  const time = typeof t.timeMinutes === "function" ? t.timeMinutes(c) : t.timeMinutes;
  return {
    id: t.id,
    difficulty: t.difficulty,
    timeMinutes: time,
    ...body,
    warnings: [...new Set([...(body.warnings ?? []), ...c.warnings])].slice(0, 3),
    menderBrief: `${body.title} from ${w.aFabric} ${w.garment} (${c.composition}). ${body.summary} About ${time} minutes, difficulty ${t.difficulty} of 5.`,
  };
}

// Picks one quick, one medium and one stretch idea where possible.
function spread(ideas: Idea[], n: number): Idea[] {
  const sorted = [...ideas].sort((a, b) => a.difficulty - b.difficulty);
  if (sorted.length <= n) return sorted;
  const picked = [sorted[0], sorted[sorted.length - 1]];
  const rest = sorted.slice(1, -1);
  // The medium idea: the one closest to the middle difficulty, preferring a difficulty not yet used.
  const mid = (picked[0].difficulty + picked[1].difficulty) / 2;
  rest.sort((a, b) => Math.abs(a.difficulty - mid) - Math.abs(b.difficulty - mid));
  const fresh = rest.find((i) => !picked.some((p) => p.difficulty === i.difficulty)) ?? rest[0];
  return [picked[0], fresh, picked[1]].slice(0, n).sort((a, b) => a.difficulty - b.difficulty);
}

// All templates that fit, ordered so garment-specific ideas come first.
export function candidateIdeas(c: Constraints): Idea[] {
  return TEMPLATES.filter((t) => fits(t, c))
    .sort((a, b) => Number(!a.garments) - Number(!b.garments))
    .map((t) => buildIdea(t, c))
    .filter((idea) => checkIdea(idea, c).length === 0);
}

export function pickFallbackIdeas(input: ConstraintInput | Constraints, count = 3, exclude: string[] = []): Idea[] {
  const c = "maxIron" in input ? input : buildConstraints(input);
  const all = candidateIdeas(c).filter((i) => !exclude.includes(i.id) && !exclude.includes(i.title.toLowerCase()));
  // Keep garment-specific ideas in the running when there are many to choose from.
  return spread(all.slice(0, Math.max(count, 7)), count);
}
