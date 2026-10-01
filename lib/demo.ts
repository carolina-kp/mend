// Sample ideas, shown only when someone jumps straight to the results screen
// from the presentation navigator without going through the steps.
import type { Idea } from "./schema";

export const SAMPLE_IDEAS: Idea[] = [
  {
    name: "A new raw hem",
    difficulty: 1,
    time: "30 min",
    materials: ["Old jeans", "Scissors", "Ruler"],
    steps: ["Try your jeans on and mark your ideal length.", "Cut both legs evenly, a little longer than your mark.", "Gently pull a few horizontal threads for a natural frayed edge."],
    why: "Cotton denim frays neatly at the edge and softens with wear.",
  },
  {
    name: "Pocket wall organiser",
    difficulty: 2,
    time: "1–2 hrs",
    materials: ["Jean pockets", "Needle & thread", "Scrap fabric"],
    steps: ["Cut out the back pockets with a border around each.", "Arrange the pockets on a sturdy fabric backing.", "Stitch around each pocket and add a hanging loop."],
    why: "The sturdy cotton weave supports small everyday essentials.",
  },
  {
    name: "The everyday tote",
    difficulty: 3,
    time: "2–3 hrs",
    materials: ["Old jeans", "Scissors", "Needle & thread"],
    steps: ["Cut both legs just below the pockets and open the inner seams.", "Stitch the leg panels together to make a wide rectangle.", "Fold and sew the sides and base, then add straps from leftover denim."],
    why: "Denim has enough structure to hold its shape without a lining.",
  },
];
