import { useState, useEffect } from "react";
import {
  Plane, User, Lock, Mail, MapPin, Calendar, Users, ArrowRight, CheckCircle2,
  X, ChevronRight, CreditCard, Clock, ArrowLeftRight, LogOut, Ticket, Send,
  Sun, Moon, Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// STATIC DATA
// ---------------------------------------------------------------------------
const CITIES = [
  { code: "MAA", city: "Chennai", country: "India" },
  { code: "BOM", city: "Mumbai", country: "India" },
  { code: "DEL", city: "Delhi", country: "India" },
  { code: "BLR", city: "Bengaluru", country: "India" },
  { code: "CCU", city: "Kolkata", country: "India" },
  { code: "HYD", city: "Hyderabad", country: "India" },
  { code: "GOI", city: "Goa", country: "India" },
  { code: "COK", city: "Kochi", country: "India" },
  { code: "PNQ", city: "Pune", country: "India" },
  { code: "JAI", city: "Jaipur", country: "India" },
  { code: "DXB", city: "Dubai", country: "UAE" },
  { code: "SIN", city: "Singapore", country: "Singapore" },
  { code: "LHR", city: "London", country: "UK" },
  { code: "JFK", city: "New York", country: "USA" },
  { code: "FRA", city: "Frankfurt", country: "Germany" },
  { code: "SYD", city: "Sydney", country: "Australia" },
];

const POPULAR_ROUTES = [
  ["Chennai", "Mumbai"], ["Delhi", "Dubai"], ["Bengaluru", "Singapore"],
  ["Mumbai", "London"], ["Chennai", "Kolkata"], ["Delhi", "New York"],
];

function pad(n) { return n.toString().padStart(2, "0"); }

function fmtDuration(min) {
  const h = Math.floor(min / 60), m = min % 60;
  return `${h}h ${pad(m)}m`;
}

function fmtMoney(n) {
  return "₹" + n.toLocaleString("en-IN");
}

function formatCardNumber(v) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

// ---------------------------------------------------------------------------
// BACKEND CONNECTION
// ---------------------------------------------------------------------------
// Point this at wherever `python manage.py runserver` is running.
const API = import.meta.env.VITE_API_URL || "https://crossair-backend-2.onrender.com/api";

function getTokens() {
  return {
    access: localStorage.getItem("crossair_access"),
    refresh: localStorage.getItem("crossair_refresh"),
  };
}
function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("crossair_access", access);
  if (refresh) localStorage.setItem("crossair_refresh", refresh);
}
function clearTokens() {
  localStorage.removeItem("crossair_access");
  localStorage.removeItem("crossair_refresh");
}
function authHeaders() {
  const { access } = getTokens();
  return access ? { Authorization: `Bearer ${access}` } : {};
}
// Small wrapper so every call gets JSON headers + auth automatically,
// and a failed response's `detail` bubbles up as a normal thrown error.
async function api(path, { method = "GET", body, auth = true } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? authHeaders() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.detail || Object.values(data)[0]?.[0] || "Something went wrong.";
    throw new Error(msg);
  }
  return data;
}

// ---------------------------------------------------------------------------
// THEME
// ---------------------------------------------------------------------------
// Every color used anywhere in the UI lives here, split into a dark and a
// light palette. Components never hardcode a hex value — they reference the
// CSS custom property (var(--xxx)) that GlobalStyle below defines per theme,
// so flipping the toggle re-paints the whole app instantly and smoothly.
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');

      [data-theme="dark"] {
        --bg-gradient: radial-gradient(ellipse at top, #142038 0%, #0B1220 55%);
        --panel: #121B2E;
        --panel-2: #17233b;
        --panel-border: #1c283f;
        --input-bg: #0d1626;
        --input-border: #23324c;
        --divider: #2a3a56;
        --text: #F5F3EC;
        --text-soft: #c7cfdd;
        --text-muted: #8B96AC;
        --text-faint: #5b6b8a;
        --accent: #F2A93B;
        --accent-2: #ffcf80;
        --accent-ink: #0B1220;
        --teal: #4FD1C5;
        --danger: #E8615A;
        --danger-bg: rgba(232,97,90,0.1);
        --danger-border: rgba(232,97,90,0.32);
        --shadow: rgba(0,0,0,0.45);
        --shadow-soft: rgba(0,0,0,0.25);
        --overlay: rgba(4,8,18,0.65);
        --blob-1: rgba(242,169,59,0.16);
        --blob-2: rgba(79,209,197,0.14);
        --date-icon-invert: 0.65;
        color-scheme: dark;
      }
      [data-theme="light"] {
        --bg-gradient: radial-gradient(ellipse at top, #ffffff 0%, #e9edf8 60%);
        --panel: #ffffff;
        --panel-2: #f3f5fb;
        --panel-border: #e1e6f2;
        --input-bg: #f5f7fc;
        --input-border: #dbe2f0;
        --divider: #e1e6f2;
        --text: #16213a;
        --text-soft: #33415e;
        --text-muted: #5c6a85;
        --text-faint: #8b96ac;
        --accent: #e2952e;
        --accent-2: #ffb648;
        --accent-ink: #17130a;
        --teal: #0e9c8e;
        --danger: #cf4038;
        --danger-bg: rgba(207,64,56,0.08);
        --danger-border: rgba(207,64,56,0.28);
        --shadow: rgba(30,41,70,0.14);
        --shadow-soft: rgba(30,41,70,0.08);
        --overlay: rgba(20,26,46,0.45);
        --blob-1: rgba(226,149,46,0.18);
        --blob-2: rgba(14,156,142,0.14);
        --date-icon-invert: 0.35;
        color-scheme: light;
      }

      * { box-sizing: border-box; }
      html, body, #root { min-height: 100%; }
      html, body {
        background: var(--bg-gradient);
      }
      body {
        margin: 0;
        transition: background-color 0.5s ease, color 0.4s ease;
      }
      .app-root {
        transition: background 0.6s ease;
      }
      input::placeholder { color: var(--text-faint); }
      input[type="date"]::-webkit-calendar-picker-indicator {
        filter: invert(var(--date-icon-invert));
        cursor: pointer;
        transition: filter 0.4s ease;
      }
      ::selection { background: var(--accent); color: var(--accent-ink); }

      /* Smooth color transition for every themed element */
      div, span, p, h1, h2, h3, label, input, select, button, a {
        transition: background-color 0.35s ease, border-color 0.35s ease, color 0.35s ease, box-shadow 0.25s ease;
      }

      @keyframes fadeSlideIn {
        from { opacity: 0; transform: translateY(16px) scale(0.99); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .fade-in { animation: fadeSlideIn 0.55s cubic-bezier(0.16, 1, 0.3, 1); }

      @keyframes popIn {
        from { opacity: 0; transform: scale(0.85); }
        to   { opacity: 1; transform: scale(1); }
      }
      .pop-in { animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }

      @keyframes floatBlob {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(24px, -30px) scale(1.06); }
      }
      .bg-blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(70px);
        pointer-events: none;
        animation: floatBlob 12s ease-in-out infinite;
        z-index: 0;
      }

      @keyframes spin { to { transform: rotate(360deg); } }
      .spin { animation: spin 0.9s linear infinite; }

      .hover-lift {
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease, border-color 0.28s ease;
      }
      .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 16px 32px var(--shadow);
        border-color: var(--accent);
      }

      .btn-anim {
        transition: transform 0.16s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
      }
      .btn-anim:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 8px 20px var(--shadow-soft); transform: translateY(-1px); }
      .btn-anim:active:not(:disabled) { transform: scale(0.96) translateY(0); }

      .field-shell {
        transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
      }
      .field-shell:focus-within {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 4px var(--danger-bg);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
      }

      .route-chip {
        transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .route-chip:hover {
        background: var(--accent);
        color: var(--accent-ink);
        border-color: var(--accent);
        transform: translateY(-3px);
      }

      .nav-link {
        position: relative;
        transition: color 0.25s ease;
      }
      .nav-link::after {
        content: "";
        position: absolute;
        left: 0; right: 0; bottom: -6px;
        height: 2px;
        background: var(--accent);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .nav-link.active::after { transform: scaleX(1); }

      .theme-toggle {
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, border-color 0.3s ease;
      }
      .theme-toggle:hover { transform: rotate(18deg) scale(1.08); }
      .theme-toggle-icon { transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease; }

      .toast-in { animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      @keyframes toastIn {
        from { opacity: 0; transform: translate(-50%, 16px); }
        to   { opacity: 1; transform: translate(-50%, 0); }
      }

      .modal-in { animation: popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
      .overlay-in { animation: overlayIn 0.3s ease; }
      @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

      .flap-cell {
        transition: background-color 0.4s ease;
      }
    `}</style>
  );
}

function ThemeToggle({ theme, setTheme, style }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="btn-anim theme-toggle"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 40, height: 40, borderRadius: 999, cursor: "pointer",
        border: "1px solid var(--panel-border)", background: "var(--panel)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--accent)", flexShrink: 0,
        ...style,
      }}
    >
      <span
        className="theme-toggle-icon"
        style={{ display: "inline-flex", transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      >
        {isDark ? <Moon size={17} /> : <Sun size={17} />}
      </span>
    </button>
  );
}

function BackgroundBlobs() {
  return (
    <>
      <div className="bg-blob" style={{ width: 380, height: 380, top: -120, left: -100, background: "var(--blob-1)" }} />
      <div className="bg-blob" style={{ width: 420, height: 420, bottom: -160, right: -120, background: "var(--blob-2)", animationDelay: "3s" }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// SPLIT-FLAP DISPLAY (signature element)
// ---------------------------------------------------------------------------
const FLAP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -".split("");

function SplitFlapChar({ target, delay }) {
  const [display, setDisplay] = useState(" ");
  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    const totalFrames = 8 + Math.floor(Math.random() * 6);
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (cancelled) return;
        frame++;
        if (frame >= totalFrames) {
          setDisplay(target);
          clearInterval(interval);
        } else {
          setDisplay(FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)]);
        }
      }, 45);
      return () => clearInterval(interval);
    }, delay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [target, delay]);
  return (
    <span className="flap-cell" style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: "0.72em", height: "1.05em", background: "var(--input-bg)",
      borderRadius: "2px", margin: "0 1px", fontFamily: "'JetBrains Mono', monospace",
      color: "var(--accent)", fontWeight: 700, boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.06)",
      fontSize: "1em",
    }}>
      {display === " " ? "\u00A0" : display}
    </span>
  );
}

function SplitFlap({ text, size = 34, cycleKey }) {
  const chars = text.toUpperCase().split("");
  return (
    <div style={{ display: "flex", fontSize: size, lineHeight: 1 }} key={cycleKey}>
      {chars.map((c, i) => (
        <SplitFlapChar key={i + text} target={c} delay={i * 55} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SHARED UI BITS
// ---------------------------------------------------------------------------
// IMPORTANT: every component below lives at module scope (outside CrossAir).
// If they were declared *inside* CrossAir's function body instead, React
// would treat them as a brand-new component type on every re-render (a new
// setState anywhere causes CrossAir to re-run, which redefines the nested
// function, which gives it a new identity) — and swap the whole subtree for
// a fresh one, wiping out focus after a single keystroke. Keeping them here,
// with state and handlers passed in as props, is what prevents that.
// ---------------------------------------------------------------------------
function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'Oswald', sans-serif" }}>
      <Plane size={size} color="var(--accent)" style={{ transform: "rotate(45deg)" }} />
      <span style={{ fontSize: size, letterSpacing: 1.5, fontWeight: 600, color: "var(--text)", textTransform: "uppercase" }}>
        Cross<span style={{ color: "var(--accent)" }}>Air</span>
      </span>
    </div>
  );
}

function Field({ icon: Icon, label, ...props }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6, fontFamily: "'Inter', sans-serif" }}>
        {label}
      </span>
      <div className="field-shell" style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "10px 12px", gap: 10 }}>
        {Icon && <Icon size={16} color="var(--text-muted)" />}
        <input
          {...props}
          style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, width: "100%", fontFamily: "'Inter', sans-serif" }}
        />
      </div>
    </label>
  );
}

function Button({ children, variant = "primary", style, className = "", ...props }) {
  const base = {
    padding: "12px 22px", borderRadius: 8, border: "none", fontWeight: 600,
    fontSize: 14, letterSpacing: 0.4, cursor: "pointer", fontFamily: "'Inter', sans-serif",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  };
  const variants = {
    primary: { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", color: "var(--accent-ink)" },
    secondary: { background: "transparent", color: "var(--text)", border: "1px solid var(--divider)" },
    teal: { background: "var(--teal)", color: "var(--accent-ink)" },
    ghost: { background: "transparent", color: "var(--text-muted)" },
  };
  return (
    <button
      {...props}
      className={`btn-anim ${className}`}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

function ErrorText({ children }) {
  return <div className="pop-in" style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)", fontSize: 13, padding: "9px 12px", borderRadius: 6, marginBottom: 14 }}>{children}</div>;
}

function SwitchLine({ text, action, onClick }) {
  return (
    <p style={{ marginTop: 18, fontSize: 13.5, color: "var(--text-muted)", textAlign: "center" }}>
      {text} <span onClick={onClick} style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}>{action}</span>
    </p>
  );
}

function ArrowRightSmall() { return <span style={{ color: "var(--accent)" }}>→</span>; }

function AuthShell({ title, subtitle, children, theme, setTheme }) {
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20, overflow: "hidden" }}>
      <BackgroundBlobs />
      <ThemeToggle theme={theme} setTheme={setTheme} style={{ position: "fixed", top: 24, right: 24, zIndex: 2 }} />
      <div className="fade-in" style={{ position: "relative", zIndex: 1, width: 380, background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 14, padding: 32, boxShadow: "0 24px 60px var(--shadow-soft)" }}>
        <div style={{ marginBottom: 20 }}><Logo /></div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, margin: "0 0 6px", fontWeight: 600, color: "var(--text)" }}>{title}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: "0 0 24px", lineHeight: 1.5 }}>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function SelectField({ label, icon: Icon, value, onChange }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>{label}</span>
      <div className="field-shell" style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "10px 12px", gap: 10 }}>
        <Icon size={16} color="var(--text-muted)" />
        <select value={value} onChange={e => onChange(e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, width: "100%", fontFamily: "'Inter', sans-serif" }}>
          {CITIES.map(c => <option key={c.code} value={c.city} style={{ background: "var(--panel)", color: "var(--text)" }}>{c.city} ({c.code})</option>)}
        </select>
      </div>
    </label>
  );
}

function FlightSummaryCard({ f, date }) {
  if (!f) return null;
  return (
    <div style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13.5, flexWrap: "wrap", gap: 8 }}>
      <div>
        <strong style={{ color: "var(--text)" }}>{f.from} → {f.to}</strong>
        <div style={{ color: "var(--text-muted)", marginTop: 2 }}>{f.airline} · {f.flightNo} · {f.dep} – {f.arr} · {date}</div>
      </div>
      <div style={{ color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{fmtMoney(f.price)}</div>
    </div>
  );
}

// ---------------- NAV ----------------
function Nav({ currentUser, screen, setScreen, handleLogout, theme, setTheme }) {
  if (!currentUser) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", borderBottom: "1px solid var(--panel-border)", flexWrap: "wrap", gap: 12 }}>
      <div onClick={() => setScreen("dashboard")} style={{ cursor: "pointer" }}><Logo size={20} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 14 }}>
        <span
          className={`nav-link ${screen === "dashboard" ? "active" : ""}`}
          onClick={() => setScreen("dashboard")}
          style={{ cursor: "pointer", color: screen === "dashboard" ? "var(--accent)" : "var(--text-muted)" }}
        >
          Search
        </span>
        <span
          className={`nav-link ${screen === "trips" ? "active" : ""}`}
          onClick={() => setScreen("trips")}
          style={{ cursor: "pointer", color: screen === "trips" ? "var(--accent)" : "var(--text-muted)" }}
        >
          My Trips
        </span>
        <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}><User size={14} />{currentUser.username}</span>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <Button variant="ghost" onClick={handleLogout} style={{ padding: "8px 10px" }}><LogOut size={14} />Log out</Button>
      </div>
    </div>
  );
}

// ---------------- WELCOME ----------------
function Welcome({ setScreen, theme, setTheme }) {
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, textAlign: "center", overflow: "hidden" }}>
      <BackgroundBlobs />
      <ThemeToggle theme={theme} setTheme={setTheme} style={{ position: "fixed", top: 24, right: 24, zIndex: 2 }} />
      <div className="fade-in" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ marginBottom: 10, opacity: 0.85 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--teal)", fontSize: 12, letterSpacing: 3 }}>DEPARTURES</span>
        </div>
        <SplitFlap text="CROSSAIR" size={44} cycleKey="hero" />
        <p style={{ color: "var(--text-muted)", maxWidth: 420, margin: "22px 0 34px", fontSize: 15, lineHeight: 1.6 }}>
          Search real-feeling routes across India and the world, book a seat, pay, and get your PNR — all in one flight deck.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <Button variant="primary" onClick={() => setScreen("register")}>
            New here? Register <ArrowRight size={16} />
          </Button>
          <Button variant="secondary" onClick={() => setScreen("login")}>
            I have an account
          </Button>
        </div>
        <div style={{ marginTop: 56, display: "flex", gap: 26, flexWrap: "wrap", justifyContent: "center", maxWidth: 560 }}>
          {POPULAR_ROUTES.map(([a, b]) => (
            <div key={a + b} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 6 }}>
              {a} <ArrowRightSmall /> {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- REGISTER ----------------
function Register({ regForm, setRegForm, error, setError, handleRegister, setScreen, theme, setTheme }) {
  return (
    <AuthShell theme={theme} setTheme={setTheme} title="Create your account" subtitle="Register with a username, email, and password to start booking.">
      <form onSubmit={handleRegister}>
        <Field icon={User} label="Username" value={regForm.username} onChange={e => setRegForm(prev => ({ ...prev, username: e.target.value }))} placeholder="e.g. arjun_flies" />
        <Field icon={Mail} label="Email" type="email" value={regForm.email} onChange={e => setRegForm(prev => ({ ...prev, email: e.target.value }))} placeholder="you@example.com" />
        <Field icon={Lock} label="Password" type="password" value={regForm.password} onChange={e => setRegForm(prev => ({ ...prev, password: e.target.value }))} placeholder="At least 6 characters" />
        {error && <ErrorText>{error}</ErrorText>}
        <Button variant="primary" style={{ width: "100%", marginTop: 6 }} type="submit">Register</Button>
      </form>
      <SwitchLine text="Already registered?" action="Log in" onClick={() => { setError(""); setScreen("login"); }} />
    </AuthShell>
  );
}

// ---------------- LOGIN ----------------
function Login({ loginForm, setLoginForm, error, setError, handleLogin, setScreen, theme, setTheme }) {
  return (
    <AuthShell theme={theme} setTheme={setTheme} title="Welcome back" subtitle="Log in to search flights and manage your bookings.">
      <form onSubmit={handleLogin}>
        <Field icon={User} label="Username" value={loginForm.username} onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))} placeholder="Your username" />
        <Field icon={Lock} label="Password" type="password" value={loginForm.password} onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Your password" />
        {error && <ErrorText>{error}</ErrorText>}
        <Button variant="primary" style={{ width: "100%", marginTop: 6 }} type="submit">Log in</Button>
      </form>
      <SwitchLine text="New to CrossAir?" action="Register" onClick={() => { setError(""); setScreen("register"); }} />
    </AuthShell>
  );
}

// ---------------- DASHBOARD / SEARCH ----------------
function Dashboard({ nav, currentUser, search, setSearch, error, handleSearch }) {
  return (
    <div>
      <Nav {...nav} />
      <div className="fade-in" style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 30, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text)" }}>
          Where to, {currentUser.username}?
        </h1>
        <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 14 }}>{CITIES.length} cities · thousands of route combinations, generated fresh for every search.</p>
        <form onSubmit={handleSearch} style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 14, padding: 28, boxShadow: "0 20px 48px var(--shadow-soft)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "end", marginBottom: 18 }}>
            <SelectField label="Current location" icon={MapPin} value={search.from} onChange={v => setSearch(prev => ({ ...prev, from: v }))} />
            <Button type="button" variant="ghost" style={{ marginBottom: 16 }} onClick={() => setSearch(prev => ({ ...prev, from: prev.to, to: prev.from }))}>
              <ArrowLeftRight size={18} />
            </Button>
            <SelectField label="Going to" icon={MapPin} value={search.to} onChange={v => setSearch(prev => ({ ...prev, to: v }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
            <Field icon={Calendar} label="Travel date" type="date" value={search.date} min={new Date().toISOString().slice(0, 10)} onChange={e => setSearch(prev => ({ ...prev, date: e.target.value }))} />
            <Field icon={Users} label="Passengers" type="number" min="1" max="6" value={search.passengers} onChange={e => setSearch(prev => ({ ...prev, passengers: Math.max(1, Math.min(6, Number(e.target.value) || 1)) }))} />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <Button variant="primary" type="submit" style={{ width: "100%", marginTop: 8, padding: "13px" }}>
            Search flights <ArrowRight size={16} />
          </Button>
        </form>
        <div style={{ marginTop: 26 }}>
          <div style={{ fontSize: 12, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Popular routes</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {POPULAR_ROUTES.map(([a, b]) => (
              <div key={a + b} className="route-chip" onClick={() => setSearch(prev => ({ ...prev, from: a, to: b }))}
                style={{ cursor: "pointer", border: "1px solid var(--input-border)", borderRadius: 20, padding: "7px 14px", fontSize: 13, color: "var(--text-soft)", display: "flex", gap: 6, alignItems: "center" }}>
                {a} <ArrowRightSmall /> {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- RESULTS ----------------
function Results({ nav, search, results, selectFlight, setScreen }) {
  return (
    <div>
      <Nav {...nav} />
      <div className="fade-in" style={{ maxWidth: 820, margin: "0 auto", padding: "36px 24px" }}>
        <div onClick={() => setScreen("dashboard")} style={{ color: "var(--text-muted)", fontSize: 13, cursor: "pointer", marginBottom: 14 }}>&larr; Edit search</div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, marginBottom: 4, textTransform: "uppercase", color: "var(--text)" }}>
          {search.from} <span style={{ color: "var(--accent)" }}>&rarr;</span> {search.to}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 22 }}>{search.date} · {search.passengers} passenger{search.passengers > 1 ? "s" : ""} · {results.length} flights found</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {results.map((f, i) => (
            <div
              key={f.id}
              className="hover-lift fade-in"
              style={{
                background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 12,
                padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 14, animationDelay: `${i * 60}ms`, animationFillMode: "backwards",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>{f.airline} · {f.flightNo}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span style={{ fontSize: 20, color: "var(--text)" }}>{f.dep}</span>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={11} />{fmtDuration(f.durationMin)}</div>
                    <div style={{ width: 60, height: 1, background: "var(--divider)", margin: "4px 0" }} />
                    <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{f.stops === 0 ? "Nonstop" : `${f.stops} stop`}</div>
                  </div>
                  <span style={{ fontSize: 20, color: "var(--text)" }}>{f.arr}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 21, fontWeight: 700, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtMoney(f.price)}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginBottom: 10 }}>per passenger</div>
                <Button variant="primary" onClick={() => selectFlight(f)}>Select <ChevronRight size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- PASSENGERS ----------------
function Passengers({ nav, selectedFlight, passengerList, setPassengerList, error, handlePassengersSubmit, search, setScreen }) {
  function update(i, field, value) {
    const copy = [...passengerList];
    copy[i] = { ...copy[i], [field]: value };
    setPassengerList(copy);
  }
  return (
    <div>
      <Nav {...nav} />
      <div className="fade-in" style={{ maxWidth: 620, margin: "0 auto", padding: "36px 24px" }}>
        <div onClick={() => setScreen("results")} style={{ color: "var(--text-muted)", fontSize: 13, cursor: "pointer", marginBottom: 14 }}>&larr; Back to results</div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, marginBottom: 20, textTransform: "uppercase", color: "var(--text)" }}>Passenger details</h2>
        <FlightSummaryCard f={selectedFlight} date={search.date} />
        <form onSubmit={handlePassengersSubmit} style={{ marginTop: 20 }}>
          {passengerList.map((p, i) => (
            <div key={i} className="hover-lift" style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Passenger {i + 1}</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
                <Field label="Full name" value={p.name} onChange={e => update(i, "name", e.target.value)} placeholder="As per ID" />
                <Field label="Age" type="number" min="0" value={p.age} onChange={e => update(i, "age", e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "block", marginBottom: 4 }}>
                  <span style={{ display: "block", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Gender</span>
                  <div className="field-shell" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "10px 12px" }}>
                    <select value={p.gender} onChange={e => update(i, "gender", e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, width: "100%" }}>
                      <option style={{ background: "var(--panel)" }}>Male</option>
                      <option style={{ background: "var(--panel)" }}>Female</option>
                      <option style={{ background: "var(--panel)" }}>Other</option>
                    </select>
                  </div>
                </label>
                <label style={{ display: "block", marginBottom: 4 }}>
                  <span style={{ display: "block", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>Seat preference</span>
                  <div className="field-shell" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "10px 12px" }}>
                    <select value={p.seat} onChange={e => update(i, "seat", e.target.value)} style={{ background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, width: "100%" }}>
                      <option style={{ background: "var(--panel)" }}>Window</option>
                      <option style={{ background: "var(--panel)" }}>Aisle</option>
                      <option style={{ background: "var(--panel)" }}>Middle</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>
          ))}
          {error && <ErrorText>{error}</ErrorText>}
          <Button variant="primary" type="submit" style={{ width: "100%", padding: 13 }}>Continue to payment <ArrowRight size={16} /></Button>
        </form>
      </div>
    </div>
  );
}

// ---------------- PAYMENT ----------------
function Payment({ nav, selectedFlight, passengerList, payment, setPayment, error, paying, handlePayment, setScreen }) {
  const total = selectedFlight.price * passengerList.length;
  return (
    <div>
      <Nav {...nav} />
      <div className="fade-in" style={{ maxWidth: 460, margin: "0 auto", padding: "36px 24px" }}>
        <div onClick={() => setScreen("passengers")} style={{ color: "var(--text-muted)", fontSize: 13, cursor: "pointer", marginBottom: 14 }}>&larr; Back</div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, marginBottom: 6, textTransform: "uppercase", color: "var(--text)" }}>Payment</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, marginBottom: 20 }}>
          {passengerList.length} passenger{passengerList.length > 1 ? "s" : ""} × {fmtMoney(selectedFlight.price)} = <strong style={{ color: "var(--text)" }}>{fmtMoney(total)}</strong>
        </p>
        <form onSubmit={handlePayment} style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 14, padding: 26, boxShadow: "0 20px 48px var(--shadow-soft)" }}>
          <Field icon={User} label="Name on card" value={payment.name} onChange={e => setPayment(prev => ({ ...prev, name: e.target.value }))} placeholder="As on your card" />
          <Field icon={CreditCard} label="Card number" value={payment.number} onChange={e => setPayment(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))} placeholder="4242 4242 4242 4242" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Expiry (MM/YY)" value={payment.expiry} onChange={e => {
              let v = e.target.value.replace(/\D/g, "").slice(0, 4);
              if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
              setPayment(prev => ({ ...prev, expiry: v }));
            }} placeholder="08/29" />
            <Field label="CVV" value={payment.cvv} onChange={e => setPayment(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="123" />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
          <Button variant="primary" type="submit" disabled={paying} style={{ width: "100%", padding: 13, opacity: paying ? 0.85 : 1 }}>
            {paying ? (<><Loader2 size={16} className="spin" /> Processing payment…</>) : `Pay ${fmtMoney(total)}`}
          </Button>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 14, lineHeight: 1.5, textAlign: "center" }}>
            This is a simulated payment for demo purposes — no real card is charged.
          </p>
        </form>
      </div>
    </div>
  );
}

// ---------------- CONFIRMATION ----------------
function Confirmation({ nav, booking, setEmailModal, setScreen }) {
  if (!booking) return null;
  return (
    <div>
      <Nav {...nav} />
      <div className="fade-in" style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
        <div className="pop-in" style={{ display: "inline-flex" }}>
          <CheckCircle2 size={52} color="var(--teal)" style={{ marginBottom: 16 }} />
        </div>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, marginBottom: 6, textTransform: "uppercase", color: "var(--text)" }}>Booking confirmed</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 26 }}>A confirmation has been sent to <strong style={{ color: "var(--text)" }}>{booking.email}</strong></p>

        <div style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 14, padding: 26, textAlign: "left", boxShadow: "0 20px 48px var(--shadow-soft)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>PNR</span>
            <SplitFlap text={booking.pnr} size={22} cycleKey={booking.pnr} />
          </div>
          <FlightSummaryCard f={booking.flight} date={booking.date} />
          <div style={{ marginTop: 14, fontSize: 13.5, color: "var(--text-soft)" }}>
            {booking.passengers.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < booking.passengers.length - 1 ? "1px solid var(--panel-border)" : "none", flexWrap: "wrap", gap: 6 }}>
                <span>{p.name} · {p.gender}, {p.age}</span>
                <span style={{ color: "var(--text-muted)" }}>{p.seat} seat</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--panel-border)", fontWeight: 700, color: "var(--text)" }}>
            <span>Total paid</span>
            <span style={{ color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{fmtMoney(booking.total)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 22, flexWrap: "wrap" }}>
          <Button variant="teal" onClick={() => setEmailModal(booking)}><Send size={14} /> View confirmation email</Button>
          <Button variant="secondary" onClick={() => setScreen("dashboard")}>Book another flight</Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- MY TRIPS ----------------
function Trips({ nav, myBookings }) {
  return (
    <div>
      <Nav {...nav} />
      <div className="fade-in" style={{ maxWidth: 700, margin: "0 auto", padding: "36px 24px" }}>
        <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: 24, marginBottom: 20, textTransform: "uppercase", color: "var(--text)" }}>My trips</h2>
        {myBookings.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 14, background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 12, padding: 26, textAlign: "center" }}>
            No bookings yet — search a route and lock in a fare.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {myBookings.slice().reverse().map((b, i) => (
            <div key={b.pnr} className="hover-lift fade-in" style={{ background: "var(--panel)", border: "1px solid var(--panel-border)", borderRadius: 12, padding: 18, animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'JetBrains Mono', monospace", color: "var(--accent)", fontWeight: 700 }}>
                  <Ticket size={14} /> {b.pnr}
                </div>
                <span style={{ color: "var(--teal)", fontSize: 12 }}>Confirmed</span>
              </div>
              <FlightSummaryCard f={b.flight} date={b.date} />
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginTop: 8 }}>{b.passengers.length} passenger{b.passengers.length > 1 ? "s" : ""} · {b.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- EMAIL MODAL ----------------
function EmailModal({ emailModal, setEmailModal, currentUser }) {
  if (!emailModal) return null;
  const b = emailModal;
  return (
    <div className="overlay-in" style={{ position: "fixed", inset: 0, background: "var(--overlay)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50 }} onClick={() => setEmailModal(null)}>
      <div onClick={e => e.stopPropagation()} className="modal-in" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 12, width: 480, maxWidth: "100%", overflow: "hidden", boxShadow: "0 30px 70px var(--shadow)" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--panel-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--panel)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}><Mail size={13} /> Simulated inbox preview</span>
          <X size={16} style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setEmailModal(null)} />
        </div>
        <div style={{ padding: 20, fontSize: 13.5 }}>
          <div style={{ color: "var(--text-faint)", marginBottom: 2 }}>To: {b.email}</div>
          <div style={{ color: "var(--text-faint)", marginBottom: 12 }}>From: bookings@crossair.example</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: "var(--text)" }}>Your CrossAir flight is confirmed — PNR {b.pnr}</div>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6 }}>Hi {b.passengers[0]?.name || currentUser?.username},</p>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6 }}>
            Your booking on {b.flight.airline} flight {b.flight.flightNo} from {b.flight.from} to {b.flight.to} on {b.date} is confirmed.
            Departure {b.flight.dep}, arrival {b.flight.arr}. Total paid: {fmtMoney(b.total)}.
          </p>
          <p style={{ color: "var(--text-soft)", lineHeight: 1.6 }}>Safe travels,<br />The CrossAir team</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN APP — owns all state, renders the module-level screens with props
// ---------------------------------------------------------------------------
export default function CrossAir() {
  const [screen, setScreen] = useState("welcome"); // welcome, register, login, dashboard, results, passengers, payment, confirmation, trips
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [emailModal, setEmailModal] = useState(null);

  // Theme: default to the user's OS preference, then remember whatever they
  // pick from then on (in localStorage, so it survives a page reload).
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("crossair_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("crossair_theme", theme);
  }, [theme]);

  // form state
  const [regForm, setRegForm] = useState({ username: "", email: "", password: "" });
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [search, setSearch] = useState({ from: "Chennai", to: "Mumbai", date: "", passengers: 1 });
  const [results, setResults] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [passengerList, setPassengerList] = useState([{ name: "", age: "", gender: "Male", seat: "Window" }]);
  const [payment, setPayment] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [paying, setPaying] = useState(false);
  const [booking, setBooking] = useState(null);
  const [myBookings, setMyBookings] = useState([]);

  // Restore a session on reload if we still have a valid access token.
  useEffect(() => {
    const { access } = getTokens();
    if (!access) return;
    (async () => {
      try {
        const user = await api("/auth/me/");
        setCurrentUser(user);
        const trips = await api("/bookings/my/");
        setMyBookings(trips);
        setScreen("dashboard");
      } catch {
        clearTokens();
      }
    })();
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api("/auth/login/", { method: "POST", body: loginForm, auth: false });
      setTokens(data);
      setCurrentUser(data.user);
      const trips = await api("/bookings/my/");
      setMyBookings(trips);
      setScreen("dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    const { refresh } = getTokens();
    if (refresh) {
      api("/auth/logout/", { method: "POST", body: { refresh } }).catch(() => {});
    }
    clearTokens();
    setCurrentUser(null);
    setScreen("welcome");
    setBooking(null);
    setResults([]);
    setMyBookings([]);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    const { username, email, password } = regForm;
    if (!username || !email || !password) { setError("All fields are required."); return; }
    if (!email.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    try {
      const data = await api("/auth/register/", { method: "POST", body: regForm, auth: false });
      showToast(data.detail);
      setLoginForm({ username, password: "" });
      setScreen("login");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    if (search.from === search.to) { setError("Origin and destination can't be the same city."); return; }
    if (!search.date) { setError("Choose a travel date."); return; }
    try {
      const params = new URLSearchParams({ from: search.from, to: search.to, date: search.date });
      const flights = await api(`/flights/search/?${params}`);
      setResults(flights);
      setScreen("results");
    } catch (err) {
      setError(err.message);
    }
  }

  function selectFlight(f) {
    setSelectedFlight(f);
    setPassengerList(Array.from({ length: search.passengers }, () => ({ name: "", age: "", gender: "Male", seat: "Window" })));
    setScreen("passengers");
  }

  function handlePassengersSubmit(e) {
    e.preventDefault();
    for (const p of passengerList) {
      if (!p.name || !p.age) { setError("Fill in every passenger's name and age."); return; }
    }
    setError("");
    setScreen("payment");
  }

  async function handlePayment(e) {
    e.preventDefault();
    setError("");
    const digits = payment.number.replace(/\s/g, "");
    if (digits.length !== 16) { setError("Enter a valid 16-digit card number."); return; }
    if (!/^\d{2}\/\d{2}$/.test(payment.expiry)) { setError("Expiry must be in MM/YY format."); return; }
    if (!/^\d{3,4}$/.test(payment.cvv)) { setError("Enter a valid CVV."); return; }
    if (!payment.name) { setError("Enter the name on the card."); return; }
    setPaying(true);
    try {
      // The 1.6s pause is just UX polish — the backend does real work
      // (validating the card, generating the PNR, saving the booking)
      // while this plays out.
      const [newBooking] = await Promise.all([
        api("/bookings/", {
          method: "POST",
          body: {
            flight: selectedFlight,
            passengers: passengerList,
            travel_date: search.date,
            payment,
          },
        }),
        new Promise(res => setTimeout(res, 1600)),
      ]);
      setMyBookings(prev => [...prev, newBooking]);
      setBooking(newBooking);
      setScreen("confirmation");
      setEmailModal(newBooking);
    } catch (err) {
      setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  const pageWrap = {
    minHeight: "100%", background: "var(--bg-gradient)",
    color: "var(--text)", fontFamily: "'Inter', sans-serif", padding: 0,
  };

  // Bundled so every screen can just spread {...nav} onto <Nav /> instead
  // of repeating the same props everywhere.
  const nav = { currentUser, screen, setScreen, handleLogout, theme, setTheme };

  return (
    <div className="app-root" data-theme={theme} style={pageWrap}>
      <GlobalStyle />
      {screen === "welcome" && <Welcome setScreen={setScreen} theme={theme} setTheme={setTheme} />}
      {screen === "register" && (
        <Register regForm={regForm} setRegForm={setRegForm} error={error} setError={setError} handleRegister={handleRegister} setScreen={setScreen} theme={theme} setTheme={setTheme} />
      )}
      {screen === "login" && (
        <Login loginForm={loginForm} setLoginForm={setLoginForm} error={error} setError={setError} handleLogin={handleLogin} setScreen={setScreen} theme={theme} setTheme={setTheme} />
      )}
      {screen === "dashboard" && currentUser && (
        <Dashboard nav={nav} currentUser={currentUser} search={search} setSearch={setSearch} error={error} handleSearch={handleSearch} />
      )}
      {screen === "results" && currentUser && (
        <Results nav={nav} search={search} results={results} selectFlight={selectFlight} setScreen={setScreen} />
      )}
      {screen === "passengers" && currentUser && (
        <Passengers nav={nav} selectedFlight={selectedFlight} passengerList={passengerList} setPassengerList={setPassengerList} error={error} handlePassengersSubmit={handlePassengersSubmit} search={search} setScreen={setScreen} />
      )}
      {screen === "payment" && currentUser && (
        <Payment nav={nav} selectedFlight={selectedFlight} passengerList={passengerList} payment={payment} setPayment={setPayment} error={error} paying={paying} handlePayment={handlePayment} setScreen={setScreen} />
      )}
      {screen === "confirmation" && currentUser && (
        <Confirmation nav={nav} booking={booking} setEmailModal={setEmailModal} setScreen={setScreen} />
      )}
      {screen === "trips" && currentUser && (
        <Trips nav={nav} myBookings={myBookings} />
      )}

      {toast && (
        <div className="toast-in" style={{ position: "fixed", bottom: 24, left: "50%", background: "var(--panel)", border: "1px solid var(--panel-border)", color: "var(--text)", padding: "12px 20px", borderRadius: 10, fontSize: 13.5, boxShadow: "0 8px 24px var(--shadow)" }}>
          {toast}
        </div>
      )}
      <EmailModal emailModal={emailModal} setEmailModal={setEmailModal} currentUser={currentUser} />
    </div>
  );
}
