// src/Modules/Dashboard.jsx
import * as React from "react";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { keyframes } from "@emotion/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  AppBar, Toolbar, Container, Box, Typography, Button, Paper, Grid, Chip, Stack, Divider, Link,
  Avatar, Breadcrumbs, CssBaseline, ThemeProvider, createTheme, Skeleton, IconButton, Drawer, List,
  ListItem, ListItemButton, ListItemIcon, ListItemText, useMediaQuery, Switch, Tooltip, Badge, TextField
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import StorageIcon from "@mui/icons-material/Storage";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TableChartIcon from "@mui/icons-material/TableChart";
import InsightsIcon from "@mui/icons-material/Insights";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import UpdateIcon from "@mui/icons-material/Update";
import FolderIcon from "@mui/icons-material/Folder";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BoltIcon from "@mui/icons-material/Bolt";
import ShieldIcon from "@mui/icons-material/Shield";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NorthEastIcon from "@mui/icons-material/NorthEast";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import SearchIcon from "@mui/icons-material/Search";
import NewspaperIcon from "@mui/icons-material/Newspaper";

import { jsonFetch } from "../api";

/* ---------- Animations ---------- */
const appear = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`0%{transform:translateX(-40%)}100%{transform:translateX(140%)}`;
const pulse = keyframes`0%{box-shadow:0 0 0 0 rgba(0,150,214,.25)}70%{box-shadow:0 0 0 18px rgba(0,150,214,0)}100%{box-shadow:0 0 0 0 rgba(0,150,214,0)}`;

/* ---------- Theme ---------- */
const ZBLUE = "#0096D6", ZTEAL = "#00BFA6";
const ZBG_LIGHT = "linear-gradient(0deg, #f8fbff, #f3f6fb)";
const makeTheme = (mode = "light") =>
  createTheme({
    palette: {
      mode,
      primary: { main: ZBLUE, contrastText: "#fff" },
      secondary: { main: ZTEAL },
      background: {
        default: mode === "light" ? "#eef3f8" : "#0a0f14",
        paper: mode === "light" ? "#ffffff" : "#0f1620"
      },
      text: {
        primary: mode === "light" ? "#0e1a2b" : "#e8f1f9",
        secondary: mode === "light" ? "#5b6777" : "#a9bacb"
      }
    },
    shape: { borderRadius: 16 },
    typography: {
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial",
      h1: { fontSize: "clamp(2rem, 2.2vw + 1rem, 2.8rem)", fontWeight: 900, letterSpacing: -0.4 },
      h2: { fontSize: "clamp(1.2rem, 1.1vw + 0.9rem, 1.6rem)", fontWeight: 800 },
      button: { fontWeight: 700 }
    },
    components: {
      MuiPaper: { styleOverrides: { root: { transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease" } } },
      MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 20 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 700 } } }
    }
  });

/* ---------- Utils ---------- */
const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const nfp2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const fromNow = (date) => {
  const d = new Date(date);
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000); // negative => "x ago"
  const steps = [[60,"second"],[60,"minute"],[24,"hour"],[7,"day"],[4.345,"week"],[12,"month"],[1e9,"year"]];
  let v = Math.abs(diffSec), unit = "second";
  for (const [s, u] of steps) { if (v < s) { unit = u; break; } v /= s; }
  return rtf.format(Math.round(v) * Math.sign(diffSec), unit);
};

function useCountUp(value, duration = 800) {
  const [display, setDisplay] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const from = last.current;
    const to = Number(value) || 0;
    if (to === from) return;
    let raf = 0;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      setDisplay(v);
      if (p < 1) raf = requestAnimationFrame(step);
      else last.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

function TiltPaper({ children, sx, ...rest }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: (t)=>`1px solid ${t.palette.mode==="light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"}`,
        background: (t)=> t.palette.mode==="light"
          ? "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.86))"
          : "linear-gradient(180deg, rgba(22,30,39,0.95), rgba(22,30,39,0.86))",
        borderRadius: 4,
        ...sx
      }}
      {...rest}
    >
      {children}
    </Paper>
  );
}

function Confetti({ fire = false }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!fire) return;
    const colors = ["#00bfa6","#0096d6","#74e3ff","#ffffff"];
    const arr = Array.from({ length: 22 }).map((_,i)=>({
      id: i, left: 50 + (Math.random()*30-15), delay: Math.random() * 100,
      rotate: Math.random()*360, color: colors[i % colors.length]
    }));
    setPieces(arr);
    const t = setTimeout(()=>setPieces([]), 1600);
    return ()=>clearTimeout(t);
  }, [fire]);
  return (
    <Box sx={{ pointerEvents: "none", position: "absolute", inset: 0, overflow: "hidden" }}>
      {pieces.map(p=>(
        <Box key={p.id} sx={{
          position: "absolute", top: 0, left: `${p.left}%`, width: 8, height: 10, bgcolor: p.color,
          transform: `rotate(${p.rotate}deg)`, borderRadius: .5,
          animation: `fall 1.6s ease-out ${p.delay}ms forwards`,
          "@keyframes fall": {
            "0%": { transform: `translateY(-20px) rotate(${p.rotate}deg)`, opacity: 0 },
            "20%": { opacity: 1 },
            "100%": { transform: `translateY(120%) rotate(${p.rotate+120}deg)`, opacity: 0 }
          }
        }}/>
      ))}
    </Box>
  );
}

function KPI({ icon, label, value, hint, loading, accent="primary", bars=[], delta }) {
  const numeric = Number(String(value).replace(/\D+/g,"")) || 0;
  const display = useCountUp(loading ? 0 : numeric);
  const hasDelta = typeof delta === "number";
  const Up = delta > 0;
  const Down = delta < 0;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 3,
        borderColor: (t)=> t.palette.mode==="light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
        background: (t)=> t.palette.mode==="light"
          ? "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.9))"
          : "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{
          width: 46, height: 46, borderRadius: 2, color: "#fff",
          bgcolor: (t)=> accent==="primary" ? t.palette.primary.main : accent==="secondary" ? t.palette.secondary.main : "#6D28D9",
          display: "inline-flex", alignItems: "center", justifyContent: "center"
        }}>
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" color="text.secondary">{label}</Typography>
          {loading
            ? <Skeleton width={90} height={30} />
            : <Stack direction="row" spacing={1} alignItems="baseline">
                <Typography variant="h6" sx={{ lineHeight: 1.1 }}>{nf.format(display)}</Typography>
                {hasDelta && (
                  <Chip
                    size="small"
                    icon={Up ? <NorthEastIcon fontSize="small"/> : Down ? <SouthEastIcon fontSize="small"/> : undefined}
                    label={`${Up?"+":""}${delta}%`}
                    sx={{
                      bgcolor: Up ? "rgba(0,191,166,.14)" : Down ? "rgba(237,76,92,.18)" : "rgba(0,0,0,.06)"
                    }}
                  />
                )}
              </Stack>}
          {hint && !loading && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
        </Box>
      </Stack>
      {!!bars.length && <Box sx={{ mt: 1.25 }}><SparkBars data={bars} gradient={accent} /></Box>}
    </Paper>
  );
}

/* ---------- Main ---------- */
export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const theme = useMemo(() => makeTheme(dark ? "dark" : "light"), [dark]);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [drawer, setDrawer] = useState(false);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    datasets: 0, workbooks: 0, rowsTotal: 0, imports7d: 0, avgCols: 0,
    queryAvgMs: 0, todayQueries: 0, compliant: true,
    trendImports14: [], trendQueries14: []
  });
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState([]);
  const [topSheets, setTopSheets] = useState([]);
  const [insights, setInsights] = useState({ hourly: [], topTags: [] });
  const [celebrate, setCelebrate] = useState(false);
  const lastImports = useRef(0);
  const [command, setCommand] = useState("");
  const [user, setUser] = useState(null);

  // Auth + load user
  useEffect(() => {
    const keepHere = () => {
      try { window.history.pushState(null, "", window.location.href); } catch {}
    };
    keepHere();
    const pop = () => keepHere();
    window.addEventListener("popstate", pop);

    const keyNavBlocker = (e) => {
      const tag = (e.target?.tagName || "").toLowerCase();
      const isEditable = tag === "input" || tag === "textarea" || (e.target?.isContentEditable || e.target?.closest?.('[contenteditable="true"]'));
      if ((e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) ||
          ((e.metaKey || e.ctrlKey) && (e.key === "[" || e.key === "]")) ||
          (e.key === "Backspace" && !isEditable)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", keyNavBlocker);

    const beforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);

    try { const stored = localStorage.getItem("authUser"); if (stored) setUser(JSON.parse(stored)); } catch {}
    if (!localStorage.getItem("authUser")) navigate("/", { replace: true });

    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("keydown", keyNavBlocker);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [navigate]);

  // Cmd palette hotkey
  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); document.getElementById("global-cmd")?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const runCommand = useCallback((val) => {
    const v = (val || "").trim().toLowerCase();
    if (!v) return;
    if (v.startsWith("up") || v.includes("upload")) navigate("/upload");
    else if (v.startsWith("data") || v.includes("db")) navigate("/files");
    else if (v.startsWith("news") || v.includes("news")) navigate("/news");
    else if (v.startsWith("help") || v.includes("doc")) navigate("/help");
    setCommand("");
  }, [navigate]);

  const onLogout = useCallback(async () => {
    try { await jsonFetch("/api/logout", { method: "POST", credentials: "include" }).catch(()=>{}); }
    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
      sessionStorage.clear();
      window.location.replace("/");
    }
  }, []);

  // 🔧 FIXED: use jsonFetch directly (no .json())
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);

        const [dash, wbs, act, top, ins] = await Promise.allSettled([
          jsonFetch("/api/dashboard"),                 // returns object
          jsonFetch("/api/workbooks"),                 // returns array
          jsonFetch("/api/activity?limit=10"),         // returns array
          jsonFetch("/api/top-sheets?limit=5"),        // returns array
          jsonFetch("/api/insights").catch(()=>({}))   // returns object
        ]);

        if (ignore) return;

        if (dash.status === "fulfilled" && dash.value) {
          const d = dash.value || {};
          if (!loading && (d.imports7d ?? 0) > lastImports.current) setCelebrate(true);
          lastImports.current = d.imports7d || 0;
          setKpis({
            datasets: d.datasets || 0,
            workbooks: d.workbooks || 0,
            rowsTotal: d.rowsTotal || 0,
            imports7d: d.imports7d || 0,
            avgCols: d.avgCols || 0,
            queryAvgMs: d.queryAvgMs || 0,
            todayQueries: d.todayQueries || 0,
            compliant: !!d.compliant,
            trendImports14: Array.isArray(d.trendImports14) ? d.trendImports14 : [],
            trendQueries14: Array.isArray(d.trendQueries14) ? d.trendQueries14 : []
          });
        }

        if (wbs.status === "fulfilled" && Array.isArray(wbs.value)) {
          const sorted = [...wbs.value].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
          setRecent(sorted.slice(0, 8));
        } else {
          setRecent([]); // ensure empty, not undefined
        }

        if (act.status === "fulfilled" && Array.isArray(act.value)) setActivity(act.value);
        else setActivity([]);

        if (top.status === "fulfilled" && Array.isArray(top.value)) setTopSheets(top.value);
        else setTopSheets([]);

        if (ins.status === "fulfilled" && ins.value) setInsights(ins.value || { hourly: [], topTags: [] });
        else setInsights({ hourly: [], topTags: [] });

      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []); // run once

  useEffect(()=>{ if (celebrate){ const t=setTimeout(()=>setCelebrate(false), 1700); return ()=>clearTimeout(t);} }, [celebrate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          overflowX: "hidden",
          background: theme.palette.mode === "light"
            ? `radial-gradient(1200px 600px at 12% -10%, rgba(0,150,214,0.10), transparent),
               radial-gradient(900px 500px at 88% 0%, rgba(0,191,166,0.10), transparent), ${ZBG_LIGHT}`
            : `radial-gradient(1200px 600px at 12% -10%, rgba(0,150,214,0.12), transparent),
               radial-gradient(900px 500px at 88% 0%, rgba(0,191,166,0.12), transparent), linear-gradient(0deg, #0b1116, #0d141c)`
        }}
      >
        {/* AppBar */}
        <AppBar
          position="sticky"
          elevation={0}
          role="navigation"
          aria-label="Primary"
          sx={{
            bgcolor: "transparent",
            backgroundImage: theme.palette.mode === "light"
              ? "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))"
              : "linear-gradient(180deg, rgba(20,28,36,0.75), rgba(20,28,36,0.45))",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(0,0,0,0.06)"
          }}
        >
          <Toolbar sx={{ gap: 1.25, minHeight: 72, px: { xs: 1.25, md: 3 } }}>
            {isMobile && <IconButton onClick={()=>setDrawer(true)} aria-label="menu"><MenuIcon/></IconButton>}
            <Box
              aria-label="Zinnov Home"
              role="img"
              sx={{
                position: "relative", px: { xs: 1.2, sm: 1.6 }, py: .7, borderRadius: 2,
                bgcolor: theme.palette.primary.main, color: "#fff", fontWeight: 900, letterSpacing: "0.02em",
                overflow: "hidden", display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: { xs: 14, sm: 16 }
              }}>
              ZINNOV
              <Box aria-hidden sx={{
                position: "absolute", inset: 0,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                width: "40%", animation: `${shimmer} 2.4s linear infinite`
              }}/>
            </Box>
            <Breadcrumbs sx={{ ml: 2, color: "text.secondary", display: { xs: "none", md: "block" } }}>
              <Link component={RouterLink} underline="hover" to="/dashboard" color="inherit">Platform</Link>
              <Typography color="text.primary" fontWeight={800}>Dashboard</Typography>
            </Breadcrumbs>
            <Box sx={{ flexGrow: 1 }} />

            {/* Command bar */}
            <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 1, mr: 1.5 }}>
              <Box sx={{ position: "relative", width: 360 }}>
                <TextField
                  id="global-cmd"
                  size="small"
                  placeholder="Jump to: Upload, Databases, News, Help  (⌘/Ctrl + K)"
                  value={command}
                  onChange={(e)=>setCommand(e.target.value)}
                  onKeyDown={(e)=>{ if (e.key === "Enter") runCommand(command); }}
                  InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, opacity: .7 }} /> }}
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      background: theme.palette.mode==="light" ? "rgba(0,0,0,.03)" : "rgba(255,255,255,.06)",
                      borderRadius: 999,
                      "& fieldset": { borderColor: theme.palette.mode==="light" ? "rgba(0,0,0,.08)" : "rgba(255,255,255,.08)" },
                      "&:hover fieldset": { borderColor: theme.palette.mode==="light" ? "rgba(0,0,0,.16)" : "rgba(255,255,255,.16)" }
                    }
                  }}
                />
              </Box>
              <Button variant="outlined" onClick={()=>runCommand(command)} sx={{ borderRadius: 999 }}>Go</Button>
            </Box>

            <Tooltip title={dark?"Switch to light":"Switch to dark"}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 1 }}>
                <ColorLensIcon fontSize="small" />
                <Switch checked={dark} onChange={()=>setDark(d=>!d)} inputProps={{ "aria-label":"Toggle dark mode" }}/>
              </Stack>
            </Tooltip>
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/files">Databases</Button>
              <Button color="inherit" component={RouterLink} to="/news" startIcon={<NewspaperIcon/>}>News</Button>
              <Button color="inherit" component={RouterLink} to="/help" startIcon={<HelpOutlineIcon/>}>Help</Button>
              <Button variant="contained" component={RouterLink} to="/upload" sx={{ borderRadius: 2 }}>Get Started</Button>
              <Button color="error" variant="outlined" onClick={onLogout}>Logout</Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Drawer anchor="left" open={drawer} onClose={()=>setDrawer(false)}>
          <Box sx={{ width: 280 }} role="presentation" onClick={()=>setDrawer(false)} onKeyDown={()=>setDrawer(false)}>
            <List>
              {[
                { label: "Databases", to: "/files", icon: <TableChartIcon /> },
                { label: "Upload", to: "/upload", icon: <CloudUploadIcon /> },
                { label: "News", to: "/news", icon: <NewspaperIcon /> },
                { label: "Help", to: "/help", icon: <HelpOutlineIcon /> },
              ].map((n)=>(
                <ListItem key={n.label} disablePadding>
                  <ListItemButton component={RouterLink} to={n.to}>
                    <ListItemIcon>{n.icon}</ListItemIcon>
                    <ListItemText primary={n.label}/>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main */}
        <Container maxWidth={false} sx={{ pt: { xs: 2, md: 5 }, pb: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: "1280px", mx: "auto", px: { xs: 1.5, md: 3 }, position: "relative" }}>
            <Confetti fire={celebrate} />

            {/* Hero */}
            <TiltPaper sx={{ p: { xs: 2.5, md: 4 }, mb: 3, borderRadius: { xs: 3, md: 4 }, animation: `${appear} .55s ease-out` }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems="center" justifyContent="space-between">
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
                    <Chip icon={<AutoAwesomeIcon/>} label="Experience 3.0" color="primary" sx={{ color: "#fff" }}/>
                    <Chip label="Fast • Secure • Searchable" variant="outlined" color="secondary" />
                  </Stack>

                  <Typography
                    variant="h1"
                    gutterBottom
                    sx={{
                      background: "linear-gradient(90deg, #1b2a3b, #0e7ab7 40%, #00bfa6 90%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent"
                    }}
                  >
                    Data that feels delightful
                  </Typography>

                  <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
                    Upload spreadsheets, ingest sheets, and manage schemas—then explore everything with zero friction.
                  </Typography>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
                    <Button
                      variant="contained" size="large" startIcon={<CloudUploadIcon/>}
                      component={RouterLink} to="/upload" sx={{ px: 3, animation: `${pulse} 2.8s ease-out infinite` }}>
                      Upload Now
                    </Button>
                    <Button variant="outlined" size="large" startIcon={<TableChartIcon/>}
                      component={RouterLink} to="/files" color="secondary" sx={{ px: 3 }}>
                      Browse Databases
                    </Button>
                  </Stack>

                  {!!(insights.topTags||[]).length && (
                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
                      {(insights.topTags||[]).map(t=>(
                        <Chip key={t.tag} label={`#${t.tag}`} size="small"
                          sx={{ bgcolor: theme.palette.mode==="light" ? "rgba(0,0,0,.04)" : "rgba(255,255,255,.06)" }} />
                      ))}
                    </Stack>
                  )}
                </Box>

                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    minWidth: { md: 320 },
                    borderRadius: 3,
                    borderColor: theme.palette.mode==="light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)",
                    background: theme.palette.mode==="light"
                      ? "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.90))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.03))",
                  }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar sx={{ bgcolor: ZTEAL, width: 44, height: 44, fontWeight: 800 }}>
                      {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                    </Avatar>
                    <Box>
                      <Typography fontWeight={800}>{user?.name || "Guest User"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user?.role ? `${user.role}${user?.dept ? ` – ${user.dept}` : ""}` : "Zinnov Platform"}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 1.25 }} />
                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Email</Typography>
                      <Typography fontWeight={700}>{user?.email || "—"}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                      <Typography fontWeight={700}>{user?.empId || "—"}</Typography>
                    </Stack>
                    <Divider sx={{ my: 1 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Uptime</Typography>
                      <Typography fontWeight={700}><Badge color="success" variant="dot"/> 99.99%</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Backups</Typography>
                      <Typography fontWeight={700} color="secondary.main">ON</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">Security</Typography>
                      <Typography fontWeight={700}><ShieldIcon fontSize="small" sx={{ mr: .5 }} /> Compliant</Typography>
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>
            </TiltPaper>

            {/* KPIs */}
            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={12} sm={6} md={4}>
                <KPI icon={<StorageIcon/>} label="Total Datasets" value={nf.format(kpis.datasets)} loading={loading}
                     accent="primary" bars={kpis.trendImports14} delta={kpis.datasets ? 3 : 0}/>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <KPI icon={<FolderIcon/>} label="Workbooks" value={nf.format(kpis.workbooks)} loading={loading}
                     accent="secondary" bars={insights.hourly} delta={kpis.workbooks ? 2 : 0}/>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <KPI icon={<TrendingUpIcon/>} label="Rows Total" value={nf.format(kpis.rowsTotal)} loading={loading}
                     accent="violet" delta={kpis.rowsTotal ? 5 : 0}/>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <KPI icon={<UpdateIcon/>} label="Imports (7d)" value={nf.format(kpis.imports7d)} loading={loading}
                     hint={!loading && kpis.imports7d>0 ? "Great momentum!" : ""} accent="primary" delta={kpis.imports7d ? 7 : 0}/>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <KPI icon={<InsightsIcon/>} label="Avg. Query Time"
                     value={loading ? "…" : `${nfp2.format(kpis.queryAvgMs)}ms`} accent="secondary" delta={-4}/>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <KPI icon={<VerifiedUserIcon/>} label="Security"
                     value={loading ? "…" : (kpis.compliant ? "Compliant" : "Issues")} accent="violet"/>
              </Grid>
            </Grid>

            {/* Trends • Activity • Top Datasets */}
            <Grid container spacing={2.5} alignItems="stretch">
              <Grid item xs={12} md={6} lg={5}>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, height: "100%", borderRadius: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <BoltIcon color="primary" />
                    <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>Activity Trends</Typography>
                  </Stack>
                  {loading ? (
                    <Skeleton height={140} />
                  ) : (
                    <Stack spacing={2}>
                      <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary" sx={{ mb: .5 }}>Imports (14d)</Typography>
                          <Chip size="small" label={`${kpis.trendImports14.length} pts`} />
                        </Stack>
                        <SparkBars data={kpis.trendImports14} height={52} gradient="primary" />
                      </Box>
                      <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary" sx={{ mb: .5 }}>Queries (14d)</Typography>
                          <Chip size="small" label={`${kpis.trendQueries14.length} pts`} />
                        </Stack>
                        <SparkBars data={kpis.trendQueries14} height={52} gradient="secondary" />
                      </Box>
                    </Stack>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={6} lg={4}>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, height: "100%", borderRadius: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <UpdateIcon color="primary" />
                    <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>Recent Activity</Typography>
                    {!loading && <Chip size="small" label={`${activity.length}`} sx={{ ml: "auto" }} />}
                  </Stack>
                  <Stack spacing={1.1}>
                    {loading
                      ? Array.from({ length: 6 }).map((_,i)=><Skeleton key={i} height={34}/>)
                      : activity.length
                        ? activity.map((a,i)=>(
                            <Paper key={i} variant="outlined" sx={{ p: 1, borderRadius: 2 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip size="small" label={a.evt?.replace?.(/_/g," ") || "event"} sx={{ textTransform:"capitalize" }} />
                                <Typography sx={{ fontWeight: 700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                  {a.title || a.table || a.sheet_name || "—"}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                                  {a.at ? fromNow(a.at) : "—"}
                                </Typography>
                              </Stack>
                            </Paper>
                          ))
                        : <Typography color="text.secondary">No recent activity.</Typography>}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12} lg={3}>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, height: "100%", borderRadius: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <TrendingUpIcon color="primary" />
                    <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>Top Datasets</Typography>
                    {!loading && <Chip size="small" label={`${topSheets.length}`} sx={{ ml: "auto" }} />}
                  </Stack>
                  <Stack spacing={1.1}>
                    {loading
                      ? Array.from({ length: 5 }).map((_,i)=><Skeleton key={i} height={34}/>)
                      : topSheets.length
                        ? topSheets.map((s,i)=>(
                            <Stack key={s.id ?? i} direction="row" spacing={1} alignItems="center">
                              <Chip size="small" label={`#${i+1}`} />
                              <Box sx={{ overflow:"hidden" }}>
                                <Typography sx={{ fontWeight: 800, maxWidth: 220, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                  {(s.schema_name || "public") + "." + (s.table_name || "table")}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">{nf.format(s.row_count || 0)} rows</Typography>
                              </Box>
                            </Stack>
                          ))
                        : <Typography color="text.secondary">No datasets yet.</Typography>}
                  </Stack>
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ position: "relative", p: { xs: 2, sm: 2.5 }, borderRadius: 4, overflow: "hidden" }}>
                  <Box aria-hidden sx={{
                    position: "absolute", inset: 0, borderRadius: 4,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}22, transparent 40%, ${theme.palette.secondary.main}22)`,
                    filter: "blur(24px)", opacity: .6, pointerEvents: "none"
                  }}/>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, "&:hover":{ transform:{ md:"translateY(-2px)" } } }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <CloudUploadIcon color="primary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={800}>Upload a file</Typography>
                            <Typography variant="caption" color="text.secondary">Excel, PowerPoint, or Report</Typography>
                          </Box>
                          <Button variant="contained" size="small" component={RouterLink} to="/upload" endIcon={<ArrowForwardIcon/>}>Go</Button>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <TableChartIcon color="secondary" />
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={800}>Explore databases</Typography>
                            <Typography variant="caption" color="text.secondary">Search & manage data</Typography>
                          </Box>
                          <Button variant="outlined" color="secondary" size="small" component={RouterLink} to="/files">Open</Button>
                        </Stack>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <HelpOutlineIcon color="action" />
                          <Box sx={{ flex: 1 }}>
                            <Typography fontWeight={800}>Need help?</Typography>
                            <Typography variant="caption" color="text.secondary">Guides & best practices</Typography>
                          </Box>
                          <Button size="small" component={RouterLink} to="/help">Learn</Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Recent Workbooks */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <FolderIcon color="primary" />
                    <Typography variant="h6" fontWeight={800}>Recent Workbooks</Typography>
                    {!loading && <Chip size="small" label={`${recent.length}`} sx={{ ml: 1 }} />}
                  </Stack>
                  <Grid container spacing={1.5}>
                    {(loading ? Array.from({ length: 8 }) : recent).map((wb, i)=>(
                      <Grid key={wb?.id ?? i} item xs={12} sm={6} md={4} lg={3}>
                        <Paper variant="outlined"
                          sx={{
                            p: 1.5, display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 1,
                            alignItems: "center", borderRadius: 3,
                            "&:hover":{ borderColor: `${theme.palette.primary.main}66`, transform:{ md:"translateY(-2px)" } }
                          }}>
                          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: theme.palette.primary.main, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                            <FolderIcon fontSize="small" />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {loading ? <Skeleton width={140}/> : (wb.name || wb.title || "Untitled")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {loading ? <Skeleton width={100}/> : (wb.updated_at ? `Updated ${fromNow(wb.updated_at)}` : "—")}
                            </Typography>
                          </Box>
                          <Chip size="small" label={loading ? "…" : `${(wb.sheets||[]).length ?? 0} sheets`} />
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>

            {/* Footer */}
            <Divider sx={{ my: { xs: 3, md: 5 } }} />
            <Box component="footer" sx={{
              py: 4, px: 3,
              background: "linear-gradient(180deg, rgba(0,150,214,0.12), rgba(0,191,166,0.12))",
              borderTop: "1px solid rgba(0,0,0,0.06)"
            }}>
              <Typography variant="body2" color="text.secondary" align="center">
                © {new Date().getFullYear()} Zinnov Platform · <Link href="#" underline="hover">Privacy</Link> · <Link href="#" underline="hover">Terms</Link>
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

/* ---------- Micro Spark Bars ---------- */
function SparkBars({ data = [], height = 36, gradient="primary" }) {
  const max = Math.max(1, ...data);
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height }}>
      {data.map((v, i) => (
        <Box key={i}
          sx={{
            flex: 1, minWidth: 6, height: `${(v / max) * 100}%`, borderRadius: 1,
            background: (t) => gradient==="primary"
              ? `linear-gradient(180deg, ${t.palette.primary.main}b0, ${t.palette.primary.main})`
              : `linear-gradient(180deg, ${t.palette.secondary.main}b0, ${t.palette.secondary.main})`,
            boxShadow: "0 0 12px rgba(0,150,214,.15)",
            opacity: 0.95
          }}
        />
      ))}
    </Box>
  );
}
