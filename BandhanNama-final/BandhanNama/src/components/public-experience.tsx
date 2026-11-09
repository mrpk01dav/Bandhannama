"use client";

import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Heart,
  RotateCcw,
  Send,
  Sparkles,
  Stars,
} from "lucide-react";

type Scene = "welcome" | "name" | "pin" | "wish" | "story" | "message" | "final";
type WishApiResponse = { status: "pin_required" | "common_wish" | "personal_wish"; displayName: string; wish?: string; memory?: string | null; error?: string };

const defaultStoryParagraphs = [
  "Some bonds are too precious to be measured in words. Bhai Dooj is one beautiful reminder of the love, prayers and quiet promises that make the bond between a brother and a sister so special.",
  "The tilak is a symbol of blessings, care and a wish for a bright life ahead. Across India, families celebrate in their own ways, carrying the same feeling: may you always be safe, happy and surrounded by love.",
  "One cherished legend tells of Yamuna welcoming her brother Yama with warmth and a tilak. Moved by her affection, he blessed her and the tradition became a symbol of a sibling's love and good wishes.",
];
type PublicContent = { site_title:string; site_tagline:string; brother_display_name:string; brother_message:string; story_text:string; closing_message:string; welcome_text:string; brother_dm_link?:string; music_enabled?:boolean; music_url?:string; announcement?:string };

function Diya({ small = false }: { small?: boolean }) {
  return (
    <span className={`diya ${small ? "diya-small" : ""}`} aria-hidden="true">
      <span className="diya-flame" />
      <span className="diya-bowl" />
      <span className="diya-glow" />
    </span>
  );
}

function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <circle cx="90" cy="90" r="76" stroke="currentColor" strokeOpacity=".42" />
      <circle cx="90" cy="90" r="60" stroke="currentColor" strokeOpacity=".28" strokeDasharray="2 6" />
      <circle cx="90" cy="90" r="34" stroke="currentColor" strokeOpacity=".45" />
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse key={i} cx="90" cy="31" rx="7" ry="17" transform={`rotate(${i * 30} 90 90)`} fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".4" />
      ))}
      <circle cx="90" cy="90" r="8" fill="currentColor" fillOpacity=".5" />
    </svg>
  );
}

export default function PublicExperience() {
  const [scene, setScene] = useState<Scene>("welcome");
  const [name, setName] = useState("");
  const [submittedName, setSubmittedName] = useState("");
  const [pin, setPin] = useState("");
  const [wishText, setWishText] = useState("");
  const [memoryText, setMemoryText] = useState<string | null>(null);
  const [verifiedWish, setVerifiedWish] = useState<{ normalizedName: string; wish: string; memory: string | null } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [storyIndex, setStoryIndex] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const [content, setContent] = useState<PublicContent>({
    site_title: "BandhanNama", site_tagline: "One bond. Countless memories. Infinite love.",
    brother_display_name: "Your Brother", welcome_text: "A little something, made with love, for the sisters who make life brighter.",
    brother_message: "No matter how busy life gets, I hope you never forget how special you are. Keep chasing your dreams, keep smiling through every season, and never doubt that someone is always rooting for you.\n\nWe may tease each other, disagree over little things, or go days without talking — but none of that changes what you mean to me. You will always have a brother, a friend and a cheerleader in me.",
    story_text: defaultStoryParagraphs.join("\n\n"),
    closing_message: "No matter where life takes us, no matter how much time passes, the bond we share will always remain special.\n\nYou will always have a brother cheering for you. Happy Bhai Dooj! ❤️"
  });
  useEffect(() => {
    let active = true;
    fetch("/api/site-content", { cache: "no-store" }).then(r => r.json()).then(data => {
      if (active && data.content) setContent(current => ({ ...current, ...data.content }));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const storyParagraphs = useMemo(() => content.story_text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean).slice(0, 8).length ? content.story_text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean).slice(0, 8) : defaultStoryParagraphs, [content.story_text]);
  const brotherParagraphs = useMemo(() => content.brother_message.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean), [content.brother_message]);
  const finalParagraphs = useMemo(() => content.closing_message.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean), [content.closing_message]);

  const displayName = useMemo(() => submittedName.trim(), [submittedName]);

  async function submitName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) {
      setError("Please enter your name so your surprise feels a little more personal.");
      return;
    }
    if (clean.length > 80) {
      setError("That name is a little long. Please try a shorter version.");
      return;
    }

    const normalizedClean = clean.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " ");
    if (verifiedWish?.normalizedName === normalizedClean) {
      setSubmittedName(clean);
      setWishText(verifiedWish.wish);
      setMemoryText(verifiedWish.memory);
      setError("");
      setScene("wish");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/wishes/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: clean })
      });
      const result = await response.json() as WishApiResponse;
      if (!response.ok) throw new Error(result.error || "We couldn't prepare your wish. Please try again.");
      setSubmittedName(result.displayName || clean);
      setPin("");
      setMemoryText(null);
      if (result.status === "pin_required") {
        setScene("pin");
      } else {
        setWishText(result.wish || "May your life always be filled with happiness, beautiful memories and reasons to smile. Happy Bhai Dooj! ❤️");
        setScene("wish");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't prepare your wish. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{4,12}$/.test(pin)) {
      setError("Please enter your 4–12 digit PIN.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch("/api/wishes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: submittedName, pin })
      });
      const result = await response.json() as WishApiResponse;
      if (!response.ok) throw new Error(result.error || "We couldn't prepare your wish. Please try again.");
      const receivedWish = result.wish || "May your life always be filled with happiness, beautiful memories and reasons to smile. Happy Bhai Dooj! ❤️";
      const receivedMemory = result.status === "personal_wish" ? result.memory ?? null : null;
      setWishText(receivedWish);
      setMemoryText(receivedMemory);
      if (result.status === "personal_wish") {
        setVerifiedWish({
          normalizedName: submittedName.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/g, " "),
          wish: receivedWish,
          memory: receivedMemory
        });
      }
      setPin("");
      setScene("wish");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't prepare your wish. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function restart() {
    setName("");
    setSubmittedName("");
    setPin("");
    setWishText("");
    setMemoryText(null);
    setStoryIndex(0);
    setCelebrated(false);
    setError("");
    setScene("welcome");
  }

  return (
    <main className="experience-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="ambient ambient-three" aria-hidden="true" />
      <div className="particle-field" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => <i key={i} style={{ left: `${(i * 37 + 7) % 100}%`, animationDelay: `${(i % 7) * -1.8}s`, animationDuration: `${13 + (i % 6) * 2}s` }} />)}
      </div>

      <header className="topbar">
        <a className="brand-mark" href="#home" onClick={(e) => { e.preventDefault(); restart(); }} aria-label="BandhanNama home">
          <span className="brand-icon"><Diya small /></span>
          <span>{content.site_title || "BandhanNama"}</span>
        </a>
        <span className="topbar-note"><span className="live-dot" /> {content.site_tagline || "A little celebration of us"}</span>
      </header>

      {content.announcement && <div className="public-announcement">{content.announcement}</div>}
      <div className="scene-stage" key={scene}>
        {scene === "welcome" && (
          <section className="hero-scene scene-enter" id="home" aria-labelledby="welcome-title">
            <div className="hero-art">
              <Ornament className="ornament-left" />
              <Ornament className="ornament-right" />
              <div className="hero-halo" />
              <div className="hero-diya-wrap"><Diya /></div>
              <span className="floating-petal petal-a" />
              <span className="floating-petal petal-b" />
              <span className="floating-petal petal-c" />
            </div>
            <p className="eyebrow"><span /> A FESTIVAL OF LOVE & BLESSINGS <span /></p>
            <h1 id="welcome-title" className="display-title">Some bonds are<br /><em>forever.</em></h1>
            <p className="hero-copy">{content.welcome_text}</p>
            <button className="primary-button" onClick={() => setScene("name")}>
              Open your surprise <ArrowRight size={17} />
            </button>
            <div className="scroll-hint"><ChevronDown size={15} /> A moment made just for you</div>
          </section>
        )}

        {scene === "name" && (
          <section className="form-scene scene-enter" aria-labelledby="name-title">
            <div className="section-symbol"><Sparkles size={25} /></div>
            <p className="eyebrow">BEFORE THE MAGIC BEGINS</p>
            <h2 id="name-title" className="section-title">What should I<br /><em>call you?</em></h2>
            <p className="section-copy">Every beautiful surprise deserves a name. Tell me yours.</p>
            <form className="name-form" onSubmit={submitName} noValidate>
              <label className="sr-only" htmlFor="sister-name">Your name</label>
              <input id="sister-name" name="name" autoComplete="given-name" maxLength={80} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Enter your name here…" />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button form-submit" type="submit" disabled={isLoading}>{isLoading ? "Preparing your surprise…" : "That's me"} <Heart size={16} /></button>
            </form>
            <p className="privacy-note"><span className="tiny-lock">✧</span> Just a name to make this moment warmer.</p>
            <button className="text-button back-button" onClick={() => setScene("welcome")}><ArrowLeft size={15} /> Go back</button>
          </section>
        )}

        {scene === "pin" && (
          <section className="form-scene scene-enter" aria-labelledby="pin-title">
            <div className="section-symbol"><Heart size={24} /></div>
            <p className="eyebrow">A LITTLE PRIVATE SURPRISE</p>
            <h2 id="pin-title" className="section-title">One little<br /><em>secret code.</em></h2>
            <p className="section-copy">This special wish is protected. Enter the PIN shared with you to open it.</p>
            <form className="name-form" onSubmit={submitPin} noValidate>
              <label className="sr-only" htmlFor="sister-pin">Your private PIN</label>
              <input id="sister-pin" name="pin" type="password" inputMode="numeric" autoComplete="off" maxLength={12} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="Enter your secret PIN" />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button form-submit" type="submit" disabled={isLoading}>{isLoading ? "Unlocking your wish…" : "Unlock my wish"} <Heart size={16} /></button>
            </form>
            <p className="privacy-note">Your PIN is checked securely and is not stored in browser storage.</p>
            <button className="text-button back-button" onClick={() => { setPin(""); setError(""); setScene("name"); }}><ArrowLeft size={15} /> Change name</button>
          </section>
        )}

        {scene === "wish" && (
          <section className="wish-scene scene-enter" aria-labelledby="wish-title">
            <div className="wish-seal"><span>✦</span><Heart size={25} fill="currentColor" /><span>✦</span></div>
            <p className="eyebrow">A WISH, FROM MY HEART TO YOURS</p>
            <h2 id="wish-title" className="section-title wish-title">A wish for <em>{displayName || "Sister"}</em></h2>
            <div className="wish-card">
              <span className="quote-mark">“</span>
              <p>{wishText}</p>
              {memoryText && <p className="wish-memory">A little memory: {memoryText}</p>}
              <div className="wish-divider"><span /> <Heart size={13} fill="currentColor" /> <span /></div>
              <p className="wish-signoff">With all my love,<br /><strong>{content.brother_display_name || "Your Brother"}</strong></p>
            </div>
            <p className="wish-footnote">A small reminder: you are loved, appreciated and always cheered for. ❤️</p>
            <button className="primary-button" onClick={() => setScene("story")}>Our bond, our story <ArrowRight size={17} /></button>
          </section>
        )}

        {scene === "story" && (
          <section className="story-scene scene-enter" aria-labelledby="story-title">
            <div className="story-top-art"><Ornament /><span className="story-tilak">✦</span></div>
            <p className="eyebrow">A LITTLE FESTIVAL, A LOT OF LOVE</p>
            <h2 id="story-title" className="section-title story-title">More than a tradition,<br /><em>a bond beyond words.</em></h2>
            <div className="story-card" aria-live="polite">
              <div className="story-count">{String(storyIndex + 1).padStart(2,"0")} <span>/ {String(storyParagraphs.length).padStart(2,"0")}</span></div>
              <p>{storyParagraphs[storyIndex]}</p>
              <div className="story-progress" aria-label={`Story part ${storyIndex + 1} of ${storyParagraphs.length}`}>
                {storyParagraphs.map((_, i) => <span key={i} className={i <= storyIndex ? "active" : ""} />)}
              </div>
            </div>
            <div className="story-actions">
              {storyIndex > 0 && <button className="secondary-button" onClick={() => setStoryIndex((i) => i - 1)}><ArrowLeft size={16} /> Back</button>}
              <button className="primary-button" onClick={() => { if (storyIndex < storyParagraphs.length - 1) setStoryIndex((i) => i + 1); else setScene("message"); }}>
                {storyIndex < storyParagraphs.length - 1 ? "Continue" : "A note from me"} <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {scene === "message" && (
          <section className="message-scene scene-enter" aria-labelledby="message-title">
            <div className="message-icon"><Send size={22} /></div>
            <p className="eyebrow">BEFORE YOU GO, A FEW WORDS</p>
            <h2 id="message-title" className="section-title">A note from<br /><em>your brother.</em></h2>
            <div className="letter-card">
              <div className="letter-top"><span>FOR MY DEAR SISTER</span><span>♡</span></div>
              {brotherParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              <div className="letter-sign">Always here for you <Heart size={14} fill="currentColor" /></div>
            </div>
            <button className="primary-button" onClick={() => setScene("final")}>One last thing <Sparkles size={17} /></button>
          </section>
        )}

        {scene === "final" && (
          <section className="final-scene scene-enter" aria-labelledby="final-title">
            <div className={`celebration-art ${celebrated ? "celebrate-now" : ""}`}>
              <div className="firework firework-one" /><div className="firework firework-two" />
              <div className="final-diyas"><Diya /><Diya small /><Diya /></div>
              <div className="final-heart"><Heart size={35} fill="currentColor" /></div>
              {Array.from({ length: 12 }).map((_, i) => <span key={i} className="confetti" style={{ "--i": i, "--x": `${(i - 5.5) * 17}px`, "--y": `${50 + (i % 3) * 24}px` } as CSSProperties} />)}
            </div>
            <p className="eyebrow">UNTIL WE MAKE MORE MEMORIES</p>
            <h2 id="final-title" className="display-title final-title">Happy<br /><em>Bhai Dooj!</em></h2>
            <p className="final-copy">{finalParagraphs[0] ?? "No matter where life takes us, our bond will always remain special."}</p>
            <p className="final-promise">{finalParagraphs.slice(1).join(" ") || "You will always have a brother cheering for you."} <Heart size={15} fill="currentColor" /></p>
            <button className="primary-button" onClick={() => setCelebrated(true)}><Stars size={17} /> {celebrated ? "More love, always!" : "Celebrate this bond"}</button>
            <>{content.brother_dm_link && <a className="text-button replay-button" href={content.brother_dm_link} target="_blank" rel="noreferrer">Send Your Brother a Message <Send size={13} /></a>}<button className="text-button replay-button" onClick={restart}><RotateCcw size={14} /> Experience it again</button></>
          </section>
        )}
      </div>

      <footer className="site-footer">
        <div className="footer-rule"><span /> <Heart size={11} fill="currentColor" /> <span /></div>
        <p>Made with love, memories and a little bit of technology.</p>
        <p className="creator-credit">Created with love by <strong>PRINCE KUMAR</strong> <Heart size={11} fill="currentColor" /></p>
      </footer>
    </main>
  );
}
