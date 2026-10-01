# Testing the ideas

The code matters less than whether the ideas are good. Run the **same set of photos** through the app every time you change the prompt or fabric notes, and record the results here so you can compare.

## 1. Build a photo set (15–20 garments)
Put them in `testing/photos/` (this folder is yours; don't commit photos with faces). Cover:
- every garment type (sweater, jeans, shirt, skirt, dress)
- tricky fabrics: 100% acrylic, wool, polyester, viscose, stretch denim, a blend
- some damage (holes, stains), one blurry photo, one care label that's hard to read

Name them `01-sweater-acrylic.jpg`, `02-jeans-denim.jpg`, … and also photograph each care label.

## 2. Run each one
1. `npm run dev`, open the app on your phone (or laptop).
2. Use the same tools + skill for every run in a round (e.g. *scissors + needle & thread, beginner*), so only the garment/fabric changes.
3. Copy the 3 idea names into the table and score them.

## 3. Record results
Copy `results-template.md` to `results-YYYY-MM-DD.md` and fill it in.

Scores (1–5):
- **Fabric** — does it respect the fabric? (1 = unsafe advice, e.g. ironing acrylic)
- **Feasible** — could this skill level do it with these tools?
- **Useful** — would someone actually do it?

Note the label result too: did the label photo read the right %s?

## 4. Get an expert check
Ask a tailor or someone who sews to score 10 of the suggestions with the same columns. That's the strongest evidence for the report.

## 5. Feedback from testers
Tester answers ("Would you try this?") and "Get this done for me" taps are logged to `data/feedback.jsonl` when running locally. Count them for the report.
