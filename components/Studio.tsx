"use client";
// The whole thing: on a laptop it's the presentation website (intro, live phone,
// screen navigator, component sheet); on a phone CSS hides everything but the app.
// All state lives here and is kept in memory only — nothing is saved.
import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/config";
import { getIdeas } from "@/lib/api";
import { SAMPLE_IDEAS } from "@/lib/demo";
import type { Idea } from "@/lib/schema";
import { ComponentSheet } from "./ComponentSheet";
import { EMPTY_ANSWERS, SCREENS, isComplete, type Answers, type ScreenId } from "./flow";
import { FabricChoiceScreen, FabricMixScreen } from "./screens/FabricScreens";
import { FeedbackScreen, LoadingScreen, ResultsScreen, ServiceScreen } from "./screens/ResultScreens";
import { GarmentScreen, PhotoScreen, SkillScreen, ToolsScreen } from "./screens/StepScreens";
import { Icon } from "./ui";

const num = (i: number) => String(i + 1).padStart(2, "0");

export function Studio() {
  const [screen, setScreen] = useState<ScreenId>("garment");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [a, setA] = useState<Answers>(EMPTY_ANSWERS);
  const [fromLabel, setFromLabel] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const [chosenIdea, setChosenIdea] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const set = (patch: Partial<Answers>) => setA((prev) => ({ ...prev, ...patch }));
  const index = SCREENS.findIndex((s) => s.id === screen);

  function go(next: ScreenId) {
    setScreen(next);
    setPickerOpen(false);
    scrollRef.current?.scrollTo(0, 0);
  }
  function previous() {
    if (screen === "sheet") go("garment");
    else if (screen === "service" || screen === "feedback") go("results");
    else if (index > 0) go(SCREENS[index - 1].id);
  }
  function findIdeas() {
    setIdeas(undefined);
    setError(undefined);
    setAttempt((n) => n + 1);
    go("loading");
  }

  // Loading screen: ask the AI. If someone jumped here from the navigator without
  // answering, show sample ideas after a short pause instead (presentation mode).
  useEffect(() => {
    if (screen !== "loading" || ideas || error) return;
    if (!isComplete(a)) {
      const t = setTimeout(() => go("results"), 4000);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    const { garment, garmentImage, fabric, composition, tools, skill } = a;
    getIdeas({ garment: garment!, garmentImage, fabric: fabric!, composition, tools, skill: skill! })
      .then((r) => {
        if (cancelled) return;
        setIdeas(r.ideas);
        go("results");
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per attempt
  }, [screen, attempt]);

  const props = { a, set };
  const content = {
    garment: <GarmentScreen {...props} next={() => go("photo")} />,
    photo: <PhotoScreen {...props} next={() => go("fabricChoice")} />,
    fabricChoice: (
      <FabricChoiceScreen {...props} next={() => (setFromLabel(true), go("fabric"))} onManual={() => (setFromLabel(false), go("fabric"))} />
    ),
    fabric: <FabricMixScreen {...props} fromLabel={fromLabel} next={() => go("tools")} />,
    tools: <ToolsScreen {...props} next={() => go("skill")} />,
    skill: <SkillScreen {...props} next={findIdeas} />,
    loading: <LoadingScreen error={error} onRetry={findIdeas} />,
    results: (
      <ResultsScreen a={a} ideas={ideas ?? SAMPLE_IDEAS} sample={!ideas}
        onService={(idea) => (setChosenIdea(idea), go("service"))} onFeedback={() => go("feedback")} />
    ),
    service: <ServiceScreen key={chosenIdea} a={a} idea={chosenIdea || (ideas ?? SAMPLE_IDEAS)[0].name} onBack={() => go("results")} />,
    feedback: <FeedbackScreen a={a} onBack={() => go("results")} />,
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
                <button type="button" className="nav-screen" onClick={() => setPickerOpen(true)} aria-label="Open screen navigator">
                  {screen === "sheet" ? "KIT" : `${num(index)} / ${SCREENS.length}`} <span className="nav-dots">•••</span>
                </button>
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
          <div className="navigator-top"><span className="eyebrow">THE EXPERIENCE</span><span>10 SCREENS + KIT</span></div>
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
