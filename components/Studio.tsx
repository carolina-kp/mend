"use client";
// The whole thing: on a laptop it's the presentation website (intro, live phone,
// screen navigator, component sheet); on a phone CSS hides everything but the app.
// Answers live in memory only. Feedback and choices are sent to /api/feedback.
import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/config";
import { getIdeas, requestQuote, sendEvent, sessionId } from "@/lib/api";
import { SAMPLE_GARMENTS, type SampleGarment } from "@/lib/sampleGarments";
import type { IdeasResponse } from "@/lib/schema";
import { ComponentSheet } from "./ComponentSheet";
import { EMPTY_ANSWERS, SCREENS, isComplete, type Answers, type ScreenId } from "./flow";
import { FabricChoiceScreen, FabricMixScreen } from "./screens/FabricScreens";
import { DetailScreen, FeedbackScreen, LoadingScreen, MadeScreen, MakeScreen, ResultsScreen } from "./screens/ResultScreens";
import { GarmentScreen, PhotoScreen, SkillScreen, ToolsScreen } from "./screens/StepScreens";
import { Icon } from "./ui";

const num = (i: number) => String(i + 1).padStart(2, "0");
const MIN_LOADING_MS = 2400; // the loading screen never flashes by, even when ideas come from the cache
const READY_MS = 700; // "Your three ideas are ready" before the results slide in

// Shown when someone jumps past the questions from the presentation navigator.
const PREVIEW = SAMPLE_GARMENTS[1];
const PREVIEW_ANSWERS: Answers = { garment: PREVIEW.garment, parts: PREVIEW.parts, tools: PREVIEW.tools, skill: PREVIEW.skill };
const PREVIEW_RESULT: IdeasResponse = { ideas: PREVIEW.ideas, source: "sample", note: "Sample ideas for stretch jeans. Go through the steps to get your own." };
const SAMPLE_NOTE = "Saved ideas for a sample garment, ready offline.";

export function Studio() {
  const [screen, setScreen] = useState<ScreenId>("garment");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [a, setA] = useState<Answers>(EMPTY_ANSWERS);
  const [fromLabel, setFromLabel] = useState(false);
  const [result, setResult] = useState<IdeasResponse>();
  const [chosen, setChosen] = useState(0);
  const [opened, setOpened] = useState(false); // did they look at an idea before rating?
  const [sample, setSample] = useState<SampleGarment["id"]>();
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }));
  const index = SCREENS.findIndex((s) => s.id === screen);
  const shownAnswers = isComplete(a) ? a : PREVIEW_ANSWERS;
  const shown = result ?? PREVIEW_RESULT;
  const idea = shown.ideas[chosen] ?? shown.ideas[0];

  function go(next: ScreenId) {
    setScreen(next);
    setPickerOpen(false);
    scrollRef.current?.scrollTo(0, 0);
  }
  function previous() {
    if (screen === "sheet") go("garment");
    else if (screen === "detail" || screen === "feedback") go("results");
    else if (screen === "make" || screen === "made") go("detail");
    else if (screen === "results") go("skill");
    else if (index > 0) go(SCREENS[index - 1].id);
  }
  function findIdeas() {
    setResult(undefined);
    setReady(false);
    setChosen(0);
    setOpened(false);
    setAttempt((n) => n + 1);
    go("loading");
  }
  // Teacher demo: load a sample garment. Saved ideas by default, a real AI call if "Use live AI" is on.
  function trySample(g: SampleGarment, live: boolean) {
    setA({ garment: g.garment, parts: g.parts, tools: g.tools, skill: g.skill });
    setSample(g.id);
    if (live) return findIdeas();
    setResult({ ideas: g.ideas, source: "sample", note: SAMPLE_NOTE });
    setChosen(0);
    setOpened(false);
    go("results");
  }
  function reset() {
    setA(EMPTY_ANSWERS);
    setResult(undefined);
    setChosen(0);
    setOpened(false);
    setSample(undefined);
    setFromLabel(false);
    sessionId(true);
    go("garment");
  }
  // What every stored event carries: anonymous session, answers and the ideas shown. Never the photo.
  const context = () => ({
    sessionId: sessionId(),
    garment: shownAnswers.garment,
    parts: shownAnswers.parts,
    tools: shownAnswers.tools,
    skill: shownAnswers.skill,
    source: shown.source,
    sample,
    ideas: shown.ideas.map((i) => i.title),
  });

  // Loading screen: ask for ideas. If someone jumped here from the navigator without
  // answering, show the sample set after a short pause instead (presentation mode).
  useEffect(() => {
    if (screen !== "loading" || result) return;
    if (!isComplete(a)) {
      const t = setTimeout(() => go("results"), 3000);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const started = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    getIdeas({ garment: a.garment!, parts: a.parts.filter((p) => p.percent > 0), tools: a.tools, skill: a.skill!, garmentImage: a.garmentImage }).then((r) => {
      if (cancelled) return;
      // Never flash past: stay at least MIN_LOADING_MS, then show "ready" briefly before the ideas.
      timers.push(
        setTimeout(() => {
          setResult(r);
          setReady(true);
          timers.push(setTimeout(() => go("results"), READY_MS));
        }, Math.max(0, MIN_LOADING_MS - (Date.now() - started))),
      );
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per attempt
  }, [screen, attempt]);

  const props = { a, set };
  const content = {
    garment: <GarmentScreen {...props} next={() => (setSample(undefined), go("photo"))} onSample={trySample} />,
    photo: <PhotoScreen {...props} next={() => go("fabricChoice")} />,
    fabricChoice: (
      <FabricChoiceScreen {...props} next={() => (setFromLabel(true), go("fabric"))} onManual={() => (setFromLabel(false), go("fabric"))} />
    ),
    fabric: <FabricMixScreen {...props} fromLabel={fromLabel} next={() => go("tools")} />,
    tools: <ToolsScreen {...props} next={() => go("skill")} />,
    skill: <SkillScreen {...props} next={findIdeas} />,
    loading: <LoadingScreen key={attempt} ready={ready} />,
    results: <ResultsScreen a={shownAnswers} result={shown} onOpen={(i) => (setChosen(i), setOpened(true), go("detail"))} onFeedback={() => go("feedback")} />,
    detail: (
      <DetailScreen idea={idea} index={chosen}
        onMake={() => (sendEvent({ type: "choice", choice: "make", idea: idea.title, ...context() }), go("make"))}
        onMade={() => go("made")} />
    ),
    make: <MakeScreen key={idea.id} idea={idea} onFeedback={() => go("feedback")} />,
    made: (
      <MadeScreen key={idea.id} a={shownAnswers} idea={idea} onFeedback={() => go("feedback")}
        onRequest={(d) => {
          sendEvent({ type: "choice", choice: "get_it_made", idea: idea.title, hasNotes: !!d.notes, hasEmail: !!d.email, budget: d.budget, ...context() });
          const { garment, parts } = shownAnswers;
          const { id, title, steps, difficulty, timeMinutes, menderBrief } = idea;
          return requestQuote({ garment, parts, idea: { id, title, steps, difficulty, timeMinutes, menderBrief }, ...d });
        }} />
    ),
    feedback: (
      <FeedbackScreen key={attempt} onRestart={reset} followupCode={sessionId().slice(0, 8)}
        onSend={(f) => sendEvent({ type: "feedback", ...f, chosenIdea: opened ? idea.title : undefined, ...context() })} />
    ),
    sheet: <div className="screen-content in-phone-sheet"><ComponentSheet /></div>,
  }[screen];

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="wordmark">{APP_NAME}<span>.</span><span className="wordmark-note">THE REWORK STUDIO</span></div>
        <span className="header-right">A second life starts with the fabric. <span className="header-cross">✳</span> EST. 2025</span>
      </header>

      <main className="showcase">
        <aside className="intro-panel">
          <div className="intro-kicker"><span className="red-dot" /> A FABRIC-FIRST TOOL</div>
          <h2>Good clothes<br />deserve <em>another</em><br />story.</h2>
          <p>Turn the piece you no longer wear into something you will. Thoughtful ideas, tailored to the fabric already in your hands.</p>
          <div className="intro-rule" />
          <div className="intro-bottom"><span>DESIGNED FOR MAKING,<br />NOT MORE CONSUMING.</span><Icon name="scissors" size={32} /></div>
        </aside>

        <div className="device-wrap">
          <div className="device-label"><span>INTERACTIVE PROTOTYPE</span><span>393 × 852</span></div>
          <div className="device">
            <div className="phone-screen">
              <div className="status-bar">
                <span>9:41</span>
                <div className="dynamic-island" />
                <span className="status-icons">
                  <svg width="44" height="14" viewBox="0 0 44 14" fill="currentColor" aria-hidden><path d="M1 11h3V8H1zm5 0h3V6H6zm5 0h3V4h-3zm5 0h3V2h-3zM26 5c3-3 8-3 11 0l-1.4 1.5c-2.3-2-5.9-2-8.2 0zM29 8c1.5-1.5 4.5-1.5 6 0l-3 3zM40 3h3v8h-3z" /></svg>
                </span>
              </div>
              <div className="app-nav">
                <button type="button" className="nav-back" onClick={previous} aria-label="Previous screen" disabled={screen === "garment"}><Icon name="back" size={19} /></button>
                <span className="app-logo">{APP_NAME}<span>.</span></span>
                <span className="nav-right">
                  {screen !== "garment" && <button type="button" className="nav-reset" onClick={reset}>Reset</button>}
                  <button type="button" className="nav-screen" onClick={() => setPickerOpen(true)} aria-label="Open screen navigator">
                    {screen === "sheet" ? "KIT" : `${num(index)} / ${SCREENS.length}`} <span className="nav-dots">•••</span>
                  </button>
                </span>
              </div>
              <div className="phone-scroll" ref={scrollRef} key={screen}>{content}</div>

              {pickerOpen && (
                <div className="picker-overlay">
                  <button type="button" className="picker-scrim" onClick={() => setPickerOpen(false)} aria-label="Close navigator" />
                  <div className="picker-panel">
                    <div className="picker-title"><span>PROTOTYPE SCREENS</span><button type="button" onClick={() => setPickerOpen(false)} aria-label="Close"><Icon name="close" size={20} /></button></div>
                    {SCREENS.map((s, i) => (
                      <button className={screen === s.id ? "current" : ""} type="button" key={s.id} onClick={() => go(s.id)}><span>{num(i)}</span>{s.name}<Icon name="arrow" size={16} /></button>
                    ))}
                    <button type="button" onClick={() => go("sheet")}><span>+</span>Component sheet<Icon name="arrow" size={16} /></button>
                  </div>
                </div>
              )}
              <div className="home-indicator"><span /></div>
            </div>
          </div>
        </div>

        <aside className="navigator-panel">
          <div className="navigator-top"><span className="eyebrow">THE EXPERIENCE</span><span>{SCREENS.length} SCREENS + KIT</span></div>
          <h3>From forgotten<br />to <em>reimagined.</em></h3>
          <div className="navigator-list">
            {SCREENS.map((s, i) => (
              <button type="button" key={s.id} onClick={() => go(s.id)} className={screen === s.id ? "active" : ""}><span>{num(i)}</span><strong>{s.name}</strong><Icon name="arrow" size={16} /></button>
            ))}
          </div>
          <button className={`kit-link ${screen === "sheet" ? "active" : ""}`} type="button" onClick={() => go("sheet")}><span>+</span><strong>Component sheet</strong><Icon name="arrow" size={16} /></button>
          <p className="navigator-foot">Tap a step to explore the prototype.<br />Everything here is designed to be touched.</p>
        </aside>
      </main>

      <section className="desktop-sheet"><ComponentSheet /></section>
      <footer className="workspace-footer">
        <span>{APP_NAME.toUpperCase()}. / A BETTER KIND OF MAKE</span><span>FABRIC FIRST. ALWAYS.</span><span>© 2025 {APP_NAME.toUpperCase()} STUDIO</span>
      </footer>
    </div>
  );
}
