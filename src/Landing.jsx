import React, { useMemo, useState, useEffect, useRef } from "react";

/**
 * ZINNOV Strategy Hub — Internal Landing (No external assets)
 * Upgraded: richer animations, command palette modal, reveal-on-scroll,
 * spotlight cursor, hover tilt/raise, animated gradients. Purpose: centralize
 * Strategy team knowledge, OKRs, market intel & programs.
 *
 * Update: Added Login button (header + hero + floating CTA), keyboard shortcut,
 * palette item, micro-ornaments, gradient borders, shine/flair effects.
 */

// Small UI atoms
const Badge = ({ children }) => <span className="badge">{children}</span>;

const Icon = ({ path, size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={path} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const KPI = ({ k, v }) => (
  <div className="kpi card reveal border-gradient shine">
    <div className="kpi-k">{k}</div>
    <div className="kpi-v">{v}</div>
  </div>
);

const FeatureCard = ({ title, desc, path }) => (
  <div className="feature card hover-raise reveal border-gradient">
    <div className="feature-h">
      <div className="feature-ico"><Icon path={path} /></div>
      <strong>{title}</strong>
    </div>
    <p className="muted">{desc}</p>
    <div className="mini-bars" aria-hidden="true">
      {[10, 16, 22, 30].map((h, i) => (
        <div key={i} style={{ height: h }} />
      ))}
    </div>
  </div>
);

const Pill = ({ active, onClick, label }) => (
  <button onClick={onClick} className={`pill ${active ? "pill-active" : ""}`}>{label}</button>
);

const FAQ = ({ q, a }) => (
  <details className="faq card reveal border-gradient">
    <summary>{q}</summary>
    <div className="muted" style={{ marginTop: 8 }}>{a}</div>
  </details>
);

// Background SVGs
const GridBG = () => (
  <svg aria-hidden="true" width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" className="gridbg">
    <defs>
      <pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse">
        <path d="M8 0H0V8" fill="none" stroke="white" strokeOpacity="0.35" strokeWidth="0.3" />
      </pattern>
      <radialGradient id="r" cx="50%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#p)" />
    <rect width="100%" height="100%" fill="url(#r)" />
  </svg>
);

const FloatingBlob = ({ style }) => (
  <svg aria-hidden="true" viewBox="0 0 200 200" style={{ position: "absolute", ...style }}>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffd700" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#ff9800" stopOpacity="0.35" />
      </linearGradient>
    </defs>
    <path
      d="M44.8,-74.2C58.5,-65.9,70.2,-52.9,77.3,-38.3C84.4,-23.7,86.9,-7.5,85.2,9.1C83.6,25.6,77.8,42.7,66.6,55.1C55.3,67.6,38.6,75.5,21.5,79.4C4.4,83.4,-13.1,83.3,-30.8,79.3C-48.6,75.4,-66.6,67.6,-77.2,54.1C-87.8,40.7,-90.9,21.4,-89.5,2C-88,-17.4,-82.1,-35,-71.6,-49.7C-61.1,-64.3,-46,-76.1,-29.1,-83.5C-12.2,-90.8,6.6,-93.6,22,-86.7C37.5,-79.8,50.6,-63.2,44.8,-74.2Z"
      transform="translate(100 100)" fill="url(#g)" opacity="0.6"
    />
  </svg>
);

const Landing = () => {
  const [tab, setTab] = useState("Market Intel");
  const year = useMemo(() => new Date().getFullYear(), []);
  const [scrolled, setScrolled] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchRef = useRef(null);

  // Sticky header, command palette, spotlight cursor, reveal-on-scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 90);
    window.addEventListener("scroll", onScroll);

    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "k") {
        e.preventDefault();
        setPaletteOpen((s) => !s);
      }
      // Quick open Login with Ctrl/Cmd + L
      if ((e.ctrlKey || e.metaKey) && k === "l") {
        e.preventDefault();
        window.location.href = "/";
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && en.target.classList.add("in")),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      io.disconnect();
    };
  }, []);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    e.currentTarget.style.setProperty("--mx", x + "%");
    e.currentTarget.style.setProperty("--my", y + "%");
  };

  return (
    <div className="page" onMouseMove={onMouseMove}>
      <GridBG />
      {/* Decorative blobs */}
      <div aria-hidden="true" style={{ position: "absolute", top: -80, left: -120 }}>
        <FloatingBlob style={{ width: 280, height: 280, animation: "float 8s ease-in-out infinite alternate" }} />
      </div>
      <div aria-hidden="true" style={{ position: "absolute", bottom: -120, right: -100 }}>
        <FloatingBlob style={{ width: 320, height: 320, animation: "float 10s ease-in-out infinite alternate-reverse" }} />
      </div>
      {/* Subtle sparkle layer */}
      <div className="sparkles" aria-hidden="true" />

      {/* Header */}
      <header className={`hdr ${scrolled ? "hdr-scrolled" : ""}`}>
        <div className="hdr-inner">
          <a href="#top" className="brand">Zinnov Strategy Hub</a>
          <nav className="nav">
            <a href="#features" className="navlink">Features</a>
            <a href="#domains" className="navlink">Data Domains</a>
            <a href="#usecases" className="navlink">Use Cases</a>
            <a href="#faq" className="navlink">FAQ</a>
            <a href="/resources" className="navlink">Resources</a>
            <button className="btn btn-light" onClick={() => setPaletteOpen(true)}>Search ⌘K</button>
            {/* Login Button (Header) */}
            <a href="/signup" className="btn btn-outline">Login</a>
          </nav>
        </div>
      </header>

      {/* Command palette modal */}
      {paletteOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="modal-card border-gradient">
            <div className="modal-h">
              <Icon path="M11 19a8 8 0 1 1 5.3-14.1L21 9.5m-3.5 7L21 19" />
              <input ref={searchRef} autoFocus placeholder="Type a command or search…" />
              <button className="x" onClick={() => setPaletteOpen(false)}>✕</button>
            </div>
            <div className="modal-list">
              {[
                { t: "Start a Brief", k: "Enter", href: "/apps" },
                { t: "Create Initiative", k: "I", href: "/apps" },
                { t: "Open Knowledge", k: "K", href: "/apps" },
                { t: "Submit Weekly Update", k: "U", href: "/apps" },
                { t: "Login", k: "L", href: "/login" }, // Login in command palette
              ].map((i) => (
                <a key={i.t} href={i.href} className="modal-item">
                  <span>{i.t}</span>
                  <kbd>{i.k}</kbd>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="main">
        {/* HERO */}
        <section className="hero hero-grid">
          <div>
            <Badge>
              <Icon path="M12 5v14M5 12h14" /> Central hub for OKRs, market scans, briefs & programs
            </Badge>
            <h1 className="hero-title">
              One place for the <span className="grad">Strategy Team</span>
            </h1>
            <p className="muted">
              Discover insights, align on objectives, and execute programs — securely and quickly.
            </p>
            <div className="hero-ctas">
              <a href="/apps" className="btn btn-primary glow">Open Apps</a>
              <a href="#features" className="btn btn-ghost">Explore features</a>
              {/* Login Button (Hero) */}
              <a href="/signup" className="btn btn-outline">Login</a>
            </div>

            {/* Global Search (inline) */}
            <div className="search card hover-raise reveal border-gradient">
              <Icon path="M11 19a8 8 0 1 1 5.3-14.1L21 9.5m-3.5 7L21 19" />
              <input placeholder="Search briefs, OKRs, market notes… (⌘/Ctrl + K)" onFocus={() => setPaletteOpen(true)} />
              <kbd className="kbd">⌘K</kbd>
            </div>

            {/* KPIs */}
            <div className="kpi-row">
              <KPI k="48" v="Active initiatives" />
              <KPI k="312" v="Briefs & scans" />
              <KPI k="100%" v="SSO coverage" />
              <KPI k=">1.8k" v="Knowledge docs" />
            </div>
          </div>

          {/* Right: illustrative panel with parallax tilt */}
          <div className="preview card hover-tilt reveal border-gradient">
            <div className="preview-top">
              {["#f87171", "#fbbf24", "#34d399"].map((c) => (
                <span key={c} style={{ background: c }} />
              ))}
            </div>
            <div className="preview-grid">
              <div className="pane">
                <div className="pane-h">OKR Progress</div>
                <div className="bars">
                  {[28, 35, 26, 40, 48, 45, 58].map((h, i) => (
                    <div key={i} style={{ height: h }} />
                  ))}
                </div>
              </div>
              <div className="pane">
                <div className="pane-h">Health</div>
                <div className="chips">
                  {["On Track", "At Risk", "Blocked"].map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider flair */}
        <div className="divider" aria-hidden="true" />

        {/* News / updates ticker */}
        <div className="ticker card reveal border-gradient" aria-live="polite">
          <span>📣 Quarterly strategy review on Friday • </span>
          <span>🆕 Market scan template v3 released • </span>
          <span>✅ OKR mid-cycle check-ins open • </span>
          <span>🔐 New data residency controls enabled</span>
        </div>

        {/* Quick actions */}
        <section className="qa-grid">
          {[
            { label: "Start a Brief", sub: "Client or market", path: "M4 7h16M4 12h16M4 17h10" },
            { label: "Create Initiative", sub: "OKR-aligned", path: "M12 5v14M5 12h14" },
            { label: "Submit Update", sub: "Weekly status", path: "M5 13l4 4L19 7" },
            { label: "Open Knowledge", sub: "Playbooks & SOPs", path: "M4 6h16M6 10h12M6 14h8" },
          ].map((a) => (
            <a key={a.label} href="/apps" className="qa tile hover-tilt reveal">
              <Icon path={a.path} />
              <div>
                <div className="qa-l">{a.label}</div>
                <div className="qa-s muted">{a.sub}</div>
              </div>
              <span className="arrow">→</span>
            </a>
          ))}
        </section>

        {/* DATA DOMAINS (centralized database categories) */}
        <section id="domains" className="section">
          <h2 className="section-title">Centralized data domains</h2>
          <p className="muted">Everything the Strategy team touches — modeled, searchable, permissioned.</p>
          <div className="domain-grid">
            {[
              { t: "Competitors", d: "Profiles, moves, benchmarks", p: "M3 12h18M12 3v18" },
              { t: "Accounts", d: "Account plans, exec notes", p: "M4 7h16M4 12h16M4 17h16" },
              { t: "Markets", d: "TAM, growth, segments", p: "M4 20l8-16 8 16H4z" },
              { t: "Programs", d: "Initiatives, milestones", p: "M5 12h14M12 5v14M7 7l10 10" },
              { t: "OKRs", d: "Objectives, KRs, owners", p: "M5 13l4 4L19 7" },
              { t: "Playbooks", d: "SOPs, templates", p: "M4 6h16M6 10h12M6 14h8" },
              { t: "Risks", d: "Registry, mitigations", p: "M12 2l9 4v6c0 6-4 10-9 11-5-1-9-5-9-11V6l9-4z" },
              { t: "Insights", d: "Findings, briefs", p: "M3 3v18h18M7 15l3-3 3 3 4-5" },
            ].map((i) => (
              <div className="domain card hover-raise reveal border-gradient" key={i.t}>
                <div className="domain-h"><Icon path={i.p} /> <strong>{i.t}</strong></div>
                <div className="muted">{i.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="section">
          <h2 className="section-title">Built-in capabilities</h2>
          <p className="muted">Kickoffs, approvals and knowledge — centrally managed.</p>
          <div className="feature-grid">
            <FeatureCard title="Project Workspaces" desc="Docs, tasks and approvals together so teams move faster." path="M3 3v18h18M7 15l3-3 3 3 4-5" />
            <FeatureCard title="Knowledge Base" desc="Curated playbooks, SOPs and reusable templates." path="M4 6h16M6 10h12M6 14h8M6 18h6" />
            <FeatureCard title="Access & Security" desc="SSO, RBAC, audit logs and residency controls." path="M12 3l7 4v5c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V7l7-4z" />
            <FeatureCard title="Automations" desc="Intake forms, routing rules and status workflows." path="M5 12h14M12 5v14M7 7l10 10" />
          </div>
        </section>

        {/* USE CASES */}
        <section id="usecases" className="section">
          <h2 className="section-title">Use cases</h2>
          <div className="pill-row">
            {["Market Intel", "OKRs", "Programs"].map((t) => (
              <Pill key={t} label={t} active={tab === t} onClick={() => setTab(t)} />
            ))}
          </div>
          <div className="usecase card reveal border-gradient">
            {tab === "Market Intel" && (
              <div>
                <strong>Market Intelligence</strong>
                <p className="muted">Centralize competitor briefs, TAM analyses and customer insights.</p>
                <ul>
                  <li>Standard brief templates</li>
                  <li>Tagging & advanced search</li>
                  <li>Signals → initiative suggestions</li>
                </ul>
              </div>
            )}
            {tab === "OKRs" && (
              <div>
                <strong>Objectives & Key Results</strong>
                <p className="muted">Track outcomes by pillar with automated check-ins.</p>
                <ul>
                  <li>Org → team → initiative alignment</li>
                  <li>Automated reminders & rollups</li>
                  <li>Outcome dashboards</li>
                </ul>
              </div>
            )}
            {tab === "Programs" && (
              <div>
                <strong>Strategic Programs</strong>
                <p className="muted">From kickoff to impact with playbooks and governance.</p>
                <ul>
                  <li>Stage-gate reviews</li>
                  <li>Risk registry & escalations</li>
                  <li>Exec reports & insights</li>
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section">
          <h2 className="section-title">FAQ</h2>
          <FAQ q="How do I request access to an app?" a="Go to Apps → Request Access. Approvals route to your manager automatically." />
          <FAQ q="Where can I find brand assets?" a="Open Resources → Brand. You'll find logos, fonts and templates." />
          <FAQ q="What's the security policy?" a="See Security → Policies. Data is encrypted at rest and in transit." />
          <FAQ q="Who do I contact for help?" a="Open a ticket via Helpdesk in Apps or reach #it-support on Slack." />
        </section>

        <footer className="footer">
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/security">Security</a>
            <a href="/resources">Resources</a>
            <a href="/contact">Contact</a>
          </div>
          <div>© {year} Zinnov. Internal use only.</div>
        </footer>
      </main>

      {/* Floating Login CTA */}
      <a href="/signup" className="floating-cta" aria-label="Login">
        <span>Login</span>
        <Icon size={18} path="M5 12h14M13 5l7 7-7 7" />
      </a>

      {/* Styles */}
      <style>{`
        :root {
          --bg1:#1e3c72; --bg2:#2a5298;
          --accent1:#ffd700; --accent2:#ff9800;
          --spot: radial-gradient(600px 600px at var(--mx,50%) var(--my,40%), rgba(255,255,255,.06), transparent 60%);
        }
        * { box-sizing: border-box; }
        .page {
          min-height: 100vh; position: relative; overflow-x: hidden; color: #fff;
          background: linear-gradient(135deg, var(--bg1) 0%, var(--bg2) 100%), var(--spot);
          background-blend-mode: screen;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        .gridbg { position: absolute; inset: 0; opacity: .14; }
        .sparkles {
          position: absolute; inset:0; pointer-events:none;
          background:
            radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,.5), transparent 60%),
            radial-gradient(2px 2px at 70% 60%, rgba(255,255,255,.35), transparent 60%),
            radial-gradient(1.6px 1.6px at 40% 80%, rgba(255,255,255,.35), transparent 60%);
          mix-blend-mode: screen; opacity:.25; animation: twinkle 4s ease-in-out infinite alternate;
        }
        @keyframes twinkle { from { opacity:.15 } to { opacity:.35 } }

        .muted { color: #e6ecff; opacity: .95; }
        .grad { background: linear-gradient(90deg, var(--accent1), var(--accent2)); -webkit-background-clip: text; color: transparent; }

        /* Header */
        .hdr { position: sticky; top: 0; width: 100%; z-index: 5; transition: backdrop-filter .25s ease, border-color .25s ease, box-shadow .25s ease; }
        .hdr-scrolled { backdrop-filter: saturate(140%) blur(6px); border-bottom: 1px solid rgba(255,255,255,.16); box-shadow: 0 12px 40px rgba(0,0,0,.25); }
        .hdr-inner { height: 70px; padding: 0 20px; display:flex; align-items:center; justify-content:space-between; }
        .brand { font-weight: 800; color:#fff; text-decoration:none; letter-spacing:.5px; }

        .nav { display:flex; gap:16px; align-items:center; }
        .nav a, .nav button { color:#e0e0e0; text-decoration:none; font-weight:600; background: transparent; border: none; cursor: pointer; }
        .navlink { position: relative; }
        .navlink::after {
          content:""; position:absolute; left:0; right:0; bottom:-6px; height:2px; border-radius:2px;
          background: linear-gradient(90deg, var(--accent1), var(--accent2)); transform: scaleX(0); transform-origin: left; transition: transform .25s ease;
        }
        .navlink:hover::after { transform: scaleX(1); }

        /* Buttons */
        .btn {
          display:inline-flex; align-items:center; justify-content:center; gap:8px; font-weight:700;
          border-radius:30px; text-decoration:none; transition: transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;
          position: relative; overflow: hidden;
        }
        .btn-primary { padding:.9rem 2.2rem; background: linear-gradient(90deg, var(--accent1) 0%, var(--accent2) 100%); color:#1e3c72; box-shadow:0 4px 24px rgba(0,0,0,.15); }
        .btn-primary:hover, .btn-primary:focus-visible { transform: translateY(-2px) scale(1.03); box-shadow:0 10px 30px rgba(0,0,0,.25); outline:none; }
        .btn-ghost { padding:.9rem 2.0rem; border:1px solid rgba(255,255,255,.35); color:#fff; }
        .btn-ghost:hover, .btn-ghost:focus-visible { transform: translateY(-1px); box-shadow:0 8px 24px rgba(0,0,0,.18); outline:none; }
        .btn-light { padding:8px 14px; background:#fff; color:#1e3c72; border-radius:999px; font-weight:700; }
        .btn-outline {
          padding:.7rem 1.4rem; color:#fff; border:1.5px solid rgba(255,255,255,.45); border-radius:999px;
          background: linear-gradient(#ffffff0d, #ffffff0d);
        }
        .btn-outline:hover { transform: translateY(-2px); border-color: #fff; box-shadow: 0 10px 24px rgba(0,0,0,.25); }

        .glow { position:relative; }
        .glow::after { content:""; position:absolute; inset:-2px; border-radius:32px; background: radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,.4), transparent 60%); opacity:.0; transition: opacity .2s; }
        .glow:hover::after { opacity:.5; }

        /* Modal (command palette) */
        .modal { position: fixed; inset:0; background: rgba(13,22,48,.55); backdrop-filter: blur(6px); display:grid; place-items:center; z-index: 10; animation: fadeIn .2s ease both; }
        .modal-card { width:min(680px,92vw); background: rgba(255,255,255,.12); border-radius:16px; box-shadow: 0 18px 60px rgba(0,0,0,.4); overflow:hidden; }
        .modal-h { display:flex; align-items:center; gap:10px; padding:10px 12px; border-bottom: 1px solid rgba(255,255,255,.18); }
        .modal-h input { flex:1; background: transparent; border:none; outline:none; color:#fff; font-size:15px; }
        .modal-h .x { background: transparent; border: 1px solid rgba(255,255,255,.35); color: #fff; border-radius: 8px; padding: 6px 10px; cursor: pointer; }
        .modal-list { display:grid; grid-template-columns:1fr; }
        .modal-item { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; text-decoration:none; color:#fff; border-top:1px solid rgba(255,255,255,.12); }
        .modal-item:hover { background: rgba(255,255,255,.08); }

        /* Cards */
        .card { background: rgba(255,255,255,.10); border-radius: 18px; box-shadow: 0 12px 40px rgba(0,0,0,.25); backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,.12); }
        .border-gradient { position: relative; }
        .border-gradient::before {
          content:""; position:absolute; inset:-1px; border-radius: inherit; padding:1px; background: linear-gradient(120deg, rgba(255,215,0,.6), rgba(255,152,0,.5), rgba(255,255,255,.12));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events:none;
        }
        .shine { overflow: hidden; }
        .shine::after {
          content:""; position:absolute; inset:-1px; background:
            linear-gradient(120deg, transparent 0%, rgba(255,255,255,.18) 50%, transparent 100%);
          transform: translateX(-120%); transition: transform .6s ease; pointer-events:none;
        }
        .shine:hover::after { transform: translateX(120%); }

        .hover-raise { transition: transform .25s ease, box-shadow .25s ease; }
        .hover-raise:hover { transform: translateY(-6px); box-shadow: 0 18px 50px rgba(0,0,0,.32); }
        .hover-tilt { transition: transform .2s ease, box-shadow .25s ease; transform-style: preserve-3d; }
        .hover-tilt:hover { transform: perspective(800px) rotateX(2deg) rotateY(-3deg) translateY(-4px); box-shadow: 0 18px 50px rgba(0,0,0,.32); }

        /* Reveal on scroll */
        .reveal { opacity: 0; transform: translateY(14px); transition: opacity .5s ease, transform .5s ease; }
        .reveal.in { opacity: 1; transform: translateY(0); }

        /* Main / Hero */
        .main { width:min(1120px, 92vw); margin: 0 auto; padding: 56px 0 20px; position: relative; z-index: 1; }
        .hero { display:grid; grid-template-columns:1.1fr 1fr; gap:28px; align-items:center; }
        .hero-title { font-size: 44px; line-height:1.1; font-weight:900; letter-spacing:.4px; margin:14px 0 10px; text-shadow:0 4px 22px rgba(0,0,0,.25); animation: fadeInDown 1.2s; }
        .hero-ctas { display:flex; gap:12px; flex-wrap:wrap; margin-top:18px; }

        .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border-radius:999px; background: rgba(255,255,255,.10); font-size:12px; letter-spacing:.4px; }

        .search { margin-top:16px; display:flex; align-items:center; gap:10px; padding:10px 12px; }
        .search input { flex:1; background: transparent; border:none; outline:none; color:#fff; font-size:15px; }
        .kbd { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; padding:2px 6px; border-radius:8px; background: rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.25); }

        .kpi-row { margin-top: 18px; display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:10px; }
        .kpi { padding: 16px 18px; }
        .kpi-k { font-size:26px; font-weight:800; }
        .kpi-v { opacity:.9; }

        .preview { padding:14px; }
        .preview-top { display:flex; gap:10px; margin-bottom:10px; }
        .preview-top span { width:10px; height:10px; border-radius:999px; display:block; opacity:.9; }
        .preview-grid { display:grid; grid-template-columns:1.2fr 1fr; gap:12px; }
        .pane { background: rgba(255,255,255,.06); border-radius: 14px; padding: 10px; }
        .pane-h { font-weight:700; margin-bottom:6px; }
        .bars { display:flex; gap:6px; align-items:flex-end; }
        .bars div { width:12px; background: rgba(255,255,255,.55); border-radius: 4px; animation: grow .9s ease both; }
        .bars div:nth-child(odd){ animation-delay:.06s }
        .bars div:nth-child(even){ animation-delay:.12s }
        @keyframes grow { from { transform: scaleY(.3); opacity:.6 } to { transform: scaleY(1); opacity:1 } }

        /* Divider flair */
        .divider {
          margin: 28px 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent);
          filter: drop-shadow(0 8px 20px rgba(0,0,0,.35));
          border-radius: 2px;
        }

        /* Ticker */
        .ticker { margin-top:10px; padding:10px 14px; overflow:hidden; white-space:nowrap; }
        .ticker span { display:inline-block; padding-right:18px; animation: ticker 24s linear infinite; }
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }

        /* Quick Actions */
        .qa-grid { margin-top: 26px; display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:14px; }
        .tile { padding:14px; display:flex; align-items:center; gap:12px; text-decoration:none; color:#fff; position:relative; border: 1px solid rgba(255,255,255,.12); }
        .tile::before { content:""; position:absolute; inset:0; background: radial-gradient(300px 200px at var(--mx,50%) var(--my,50%), rgba(255,255,255,.08), transparent 60%); opacity:0; transition: opacity .25s; border-radius: 18px; }
        .tile:hover::before { opacity:1; }
        .tile .arrow { margin-left:auto; opacity:.8; transition: transform .2s ease; }
        .tile:hover .arrow { transform: translateX(4px); }
        .qa-l { font-weight:700; }
        .qa-s { font-size: 13px; }

        /* Domain grid */
        .domain-grid { margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
        .domain { padding: 14px; }
        .domain-h { display:flex; align-items:center; gap:10px; margin-bottom:6px; }

        /* Feature grid */
        .section { margin-top: 40px; }
        .section-title { margin:0 0 10px; }
        .feature-grid { margin-top: 16px; display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; }
        .feature-h { display:flex; align-items:center; gap:10px; }
        .feature-ico { width:36px; height:36px; border-radius:10px; display:grid; place-items:center; background: linear-gradient(135deg, rgba(255,215,0,.25), rgba(255,152,0,.2)); }
        .mini-bars { display:flex; gap:6px; align-items:flex-end; margin-top:6px; }
        .mini-bars div { width:8px; border-radius:3px; background: rgba(255,255,255,.35); }

        /* Pills */
        .pill-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:6px; }
        .pill { border:1px solid rgba(255,255,255,.25); background:transparent; color:#fff; padding:8px 12px; border-radius:999px; cursor:pointer; font-weight:600; transition: transform .2s ease, background .2s ease; }
        .pill:hover { transform: translateY(-2px); }
        .pill-active { background:#fff; color:#1e3c72; }

        .usecase { margin-top: 16px; padding:18px; }

        /* Footer */
        .footer { margin-top: 56px; padding: 24px 0; text-align:center; color:#cfd8ff; font-size:14px; }
        .footer-links { display:flex; gap:16px; justify-content:center; margin-bottom:10px; }
        .footer a { color: inherit; text-decoration: none; }

        /* Floating CTA */
        .floating-cta {
          position: fixed; right: 18px; bottom: 18px; z-index: 8;
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 14px; border-radius: 999px; text-decoration: none; color: #1e3c72;
          background: linear-gradient(90deg, var(--accent1), var(--accent2));
          box-shadow: 0 14px 30px rgba(0,0,0,.35);
          transform: translateY(0); transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
          opacity: .95;
        }
        .floating-cta:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,.4); opacity: 1; }

        /* Animations & responsive */
        @keyframes float { 0% { transform: translateY(0px);} 100% { transform: translateY(40px);} }
        @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-40px);} 100% { opacity: 1; transform: translateY(0);} }
        @keyframes fadeIn { 0% { opacity: 0;} 100% { opacity: 1;} }
        @media (max-width: 900px){
          .hero { grid-template-columns: 1fr !important; }
          .hdr-inner { height: 64px; }
          .nav { gap: 10px; }
          .btn-ghost, .btn-outline { padding:.7rem 1rem; }
        }
        @media (prefers-reduced-motion: reduce){
          * { animation: none !important; transition: none !important; }
          .ticker span{ animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Landing;
