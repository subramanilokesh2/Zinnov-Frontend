// Revamped Upload.jsx — Advanced, smart, and polished (no new deps)
// deps (unchanged): npm i @mui/material @emotion/react @emotion/styled @mui/icons-material xlsx jszip
// Drop-in replacement. API unchanged.

import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { keyframes } from "@emotion/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import {
  AppBar, Toolbar, Container, Box, Typography, Button, Paper, Grid, Chip, Stack, Divider, Link,
  Avatar, Breadcrumbs, CssBaseline, ThemeProvider, createTheme, IconButton, Switch, Tooltip,
  TextField, MenuItem, Snackbar, Alert, LinearProgress, Table, TableBody, TableCell, TableHead,
  TableRow, FormHelperText, Checkbox, FormControlLabel, Select as MuiSelect, TableContainer,
  Stepper, Step, StepLabel, Tabs, Tab, Badge, InputAdornment
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TableChartIcon from "@mui/icons-material/TableChart";
import PreviewIcon from "@mui/icons-material/Preview";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import ImageIcon from "@mui/icons-material/Image";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";

// API base
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:5000";

/* Animations */
const appear = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const pulse = keyframes`0%{box-shadow:0 0 0 0 rgba(0,150,214,.25)}70%{box-shadow:0 0 0 18px rgba(0,150,214,0)}100%{box-shadow:0 0 0 0 rgba(0,150,214,0)}`;
const float = keyframes`0%{transform:translateY(0)}50%{transform:translateY(-4px)}100%{transform:translateY(0)}`;

/* Theme */
const ZBLUE = "#0096D6", ZTEAL = "#00BFA6", ZBG = "linear-gradient(0deg, #f8fbff, #f3f6fb)";
const makeTheme = (mode = "light") => createTheme({
  palette: {
    mode,
    primary: { main: ZBLUE, contrastText: "#fff" },
    secondary: { main: ZTEAL },
    background: { default: mode === "light" ? "#eef3f8" : "#0a0f14", paper: mode === "light" ? "#ffffff" : "#0f1620" },
    text: { primary: mode === "light" ? "#0e1a2b" : "#e8f1f9", secondary: mode === "light" ? "#5b6777" : "#a9bacb" },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial",
    h1: { fontSize: "clamp(1.8rem, 2.2vw + 1rem, 2.6rem)", fontWeight: 900, letterSpacing: -0.4 },
    h2: { fontSize: "clamp(1.2rem, 1.1vw + 0.9rem, 1.6rem)", fontWeight: 800 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { transition: "transform .25s ease, box-shadow .25s ease, border-color .25s ease" } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 20 } } },
    MuiTabs: { styleOverrides: { indicator: { height: 3, borderRadius: 3 } } },
  },
});

/* Constants */
const SUB_PRACTICES = ["Automation", "Platforms", "M/A", "Services", "Zones"];
const FILE_TYPES = [
  { label: "Excel (.xlsx, .xls)", value: "EXCEL" },
  { label: "PowerPoint (.pptx)", value: "POWERPOINT" },
  { label: "Report (.pdf/.docx/.doc)", value: "REPORT" },
];
const DEFAULT_TYPES = ["text", "numeric", "date", "bool"];
const FILE_LIMIT_MB = 100; // UX soft limit

/* Reserved words (subset across major SQL engines) */
const RESERVED = new Set([
  "select","from","where","order","group","by","limit","offset","join","inner","left","right","full","outer","on","and","or","not","as","create","table","index","insert","into","values","update","delete","drop","alter","add","primary","key","unique","null","true","false"
]);

/* Utils */
const stripExt = (name = "") => name.replace(/\.[^.]+$/, "");
const ext = (name = "") => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const isExcelExt = (f) => ["xlsx", "xls"].includes(ext(f?.name || ""));
const isPptx = (f) => ext(f?.name || "") === "pptx";
const isPdf = (f) => ext(f?.name || "") === "pdf";
const isDocx = (f) => ext(f?.name || "") === "docx";
const isDoc = (f) => ext(f?.name || "") === "doc";

const normalize = (s) => (s || "").toString().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
const sanitizeIdentifier = (s) => normalize(s).replace(/[^A-Za-z0-9_\s]/g, " ").trim().replace(/\s+/g, "_");
const startsWithLetter = (s) => /^[A-Za-z_]/.test(s);
const isNumeric = (v) => (typeof v === "number" ? !Number.isNaN(v) : !!String(v).trim() && !Number.isNaN(Number(String(v).replace(/,/g, ""))));
const isDateLike = (v) => {
  if (v instanceof Date && !isNaN(v.valueOf())) return true;
  if (typeof v === "number" && v > 20000 && v < 90000) return true; // excel serial
  const s = String(v).trim(); if (!s) return false; const d = Date.parse(s); return !Number.isNaN(d);
};
const isBoolLike = (v) => ["true","false","yes","no","y","n","0","1"].includes(String(v).trim().toLowerCase());

const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
function displayCell(v) {
  if (v instanceof Date && !isNaN(v.valueOf())) return df.format(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v == null) return ""; return String(v);
}

/* Profiling & inference */
function profileColumn(values, limit = 100) {
  const sample = values.slice(0, limit);
  let n=0,d=0,b=0,t=0, empty=0; let minLen=Infinity, maxLen=0; let minVal=Infinity, maxVal=-Infinity; let minDate=Infinity, maxDate=-Infinity;
  const uniques = new Set();
  for (const v of sample) {
    const s = v == null ? "" : String(v).trim();
    if (!s) { empty++; continue; }
    uniques.add(s);
    if (isNumeric(v)) { n++; const num = Number(String(v).replace(/,/g, "")); if (!Number.isNaN(num)) { minVal=Math.min(minVal,num); maxVal=Math.max(maxVal,num);} }
    else if (isDateLike(v)) { d++; const ts = new Date(v).valueOf(); if (!Number.isNaN(ts)) { minDate=Math.min(minDate,ts); maxDate=Math.max(maxDate,ts);} }
    else if (isBoolLike(v)) { b++; }
    else { t++; const len = s.length; minLen=Math.min(minLen,len); maxLen=Math.max(maxLen,len); }
  }
  const total = sample.length || 1; const ratio = (x)=>x/total;
  const guess = ratio(n)>=.7?"numeric": ratio(d)>=.7?"date": ratio(b)>=.7?"bool": (ratio(n)>=.5 && ratio(t)<=.4?"numeric":"text");
  return {
    total, empty, uniqueCount: uniques.size,
    uniqueRatio: uniques.size/Math.max(1,total-empty),
    minLen: isFinite(minLen)?minLen:0, maxLen: isFinite(maxLen)?maxLen:0,
    minVal: isFinite(minVal)?minVal:null, maxVal: isFinite(maxVal)?maxVal:null,
    minDate: isFinite(minDate)?new Date(minDate):null, maxDate: isFinite(maxDate)?new Date(maxDate):null,
    guess
  };
}

function detectHeaderRow(rows, maxScan = 40) {
  let bestIdx = -1, bestScore = -1; const limit = Math.min(maxScan, rows.length);
  const headerHints = new Set(["id","name","date","status","type","amount","total","email","phone","country","region","category","title"]);
  for (let r = 0; r < limit; r++) {
    const row = rows[r] || [];
    const cells = row.map((c) => (c == null ? "" : String(c).trim()));
    const nonEmpty = cells.filter((c) => c !== "").length; if (!nonEmpty) continue;
    const uniq = new Set(cells.filter(Boolean)).size;
    const numericish = cells.filter((c) => isNumeric(c)).length;
    const avgLen = nonEmpty ? cells.filter(Boolean).reduce((a,b)=>a+b.length,0)/nonEmpty : 0;
    const hintHits = cells.reduce((acc,c)=>acc+(headerHints.has(c.toLowerCase())?1:0),0);
    const punctPenalty = cells.reduce((a,c)=>a+(/[,;:]/.test(c)?0.25:0),0);
    const score = nonEmpty + uniq - numericish*0.8 + hintHits*1.5 + Math.min(avgLen,20)/20 - punctPenalty;
    if (score > bestScore) { bestScore = score; bestIdx = r; }
  }
  return bestIdx < 0 ? 0 : bestIdx;
}

function uniqueSanitized(headers) {
  const fixed = []; const seen = new Set();
  for (let i=0;i<headers.length;i++) {
    let name = sanitizeIdentifier(headers[i] || `col_${i+1}`).toLowerCase();
    if (!startsWithLetter(name)) name = `c_${name}`;
    if (RESERVED.has(name)) name = `${name}_col`;
    if (!name) name = `col_${i+1}`;
    let base = name; let j=1; while (seen.has(name)) { j++; name = `${base}_${j}`; }
    fixed.push(name); seen.add(name);
  }
  return fixed;
}

function buildSheetPreview(sheetName, sheet, maxRows = 200) {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
  if (!rows.length) return null;
  const headerRowIdx = detectHeaderRow(rows);
  const headerRow = rows[headerRowIdx] || [];
  let headers = headerRow.map((c, i) => (String(c).trim() ? String(c).trim() : `Column ${i + 1}`));
  if (!headers.some((h) => h?.trim())) {
    for (let r = headerRowIdx + 1; r < Math.min(rows.length, headerRowIdx + 10); r++) {
      const candidate = rows[r] || []; const nonEmpty = candidate.filter((c) => String(c).trim() !== "").length;
      if (nonEmpty >= 1) { headers = candidate.map((c, i) => (String(c).trim() ? String(c).trim() : `Column ${i + 1}`)); break; }
    }
  }
  const headersSanitized = uniqueSanitized(headers);
  const dataRows = rows.slice(headerRowIdx + 1, headerRowIdx + 1 + maxRows);
  const colCount = headersSanitized.length;
  const types = Array.from({ length: colCount }).map((_, c) => profileColumn(dataRows.map((r) => r && r[c])).guess);
  const profiles = Array.from({ length: colCount }).map((_, c) => profileColumn(dataRows.map((r) => r && r[c])));
  const sample = dataRows.slice(0, 12).map((r) => r.slice(0, colCount));
  return { name: sheetName, headerRowIdx, selected: true, headers, headersSanitized, types, sample, profiles };
}

/* PPTX & DOCX helpers */
async function parsePptxSlides(file) {
  const zip = await JSZip.loadAsync(file);
  const slidePaths = Object.keys(zip.files).filter((p) => p.startsWith("ppt/slides/slide") && p.endsWith(".xml"))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] || 0) - Number(b.match(/slide(\d+)/)?.[1] || 0));
  const slides = [];
  for (let i = 0; i < slidePaths.length; i++) {
    const xml = await zip.file(slidePaths[i]).async("string");
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
    const full = texts.join(" ").replace(/\s+/g, " ").trim(); const snippet = full.split(" ").slice(0, 28).join(" ");
    slides.push({ index: i + 1, title: texts[0] || `Slide ${i + 1}`, snippet });
  }
  return slides;
}
async function parseDocxPreview(file, maxParas = 16) {
  const zip = await JSZip.loadAsync(file);
  const docFile = zip.file("word/document.xml"); const docXml = docFile ? await docFile.async("string") : null;
  if (!docXml) return [];
  const paras = docXml.split("</w:p>").map((frag) => {
    const ts = [...frag.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((m) => m[1].replace(/\s+/g, " ").trim());
    return ts.join("").trim();
  });
  return paras.filter(Boolean).slice(0, maxParas);
}

/* Component */
const steps = ["Select File", "Preview & Configure", "Review & Submit"];

export default function Upload() {
  const [dark, setDark] = useState(false);
  const theme = useMemo(() => makeTheme(dark ? "dark" : "light"), [dark]);
  const navigate = useNavigate();

  const [fileType, setFileType] = useState("EXCEL");
  const [subPractice, setSubPractice] = useState("Automation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [workbook, setWorkbook] = useState([]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [schemaError, setSchemaError] = useState("");

  const [slides, setSlides] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [docxParas, setDocxParas] = useState([]);
  const [reportInfo, setReportInfo] = useState("");

  const [snack, setSnack] = useState({ open: false, msg: "", sev: "info" });
  const [activeTab, setActiveTab] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const activeSheet = workbook?.[activeSheetIdx];

  const canSubmit = useMemo(() => {
    if (!file) return false;
    if (!(title.trim() || file?.name)) return false;
    if (!SUB_PRACTICES.includes(subPractice)) return false;
    if (fileType === "EXCEL") {
      if (!workbook.length) return false;
      if (!workbook.some((s) => s.selected)) return false;
      if (workbook.some((s) => s.selected && s.headersSanitized.length === 0)) return false;
    }
    return true;
  }, [file, title, subPractice, fileType, workbook]);

  // -------- Logout (keep consistent with Dashboard changes) --------
  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/api/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    } finally {
      localStorage.removeItem("authToken");
      sessionStorage.clear();
      navigate("/");
    }
  }, [navigate]);

  // Keyboard: Ctrl/Cmd + Enter to submit, Ctrl/Cmd + S to auto-fix
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter" && canSubmit && !uploading) handleSubmit();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); autoFixSanitized(activeSheetIdx); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [canSubmit, uploading, activeSheetIdx]);

  useEffect(() => {
    setWorkbook([]); setActiveSheetIdx(0); setSchemaError(""); setSlides([]);
    setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return null; });
    setDocxParas([]); setReportInfo("");
  }, [file, fileType]);

  useEffect(() => { if (file && !title.trim()) setTitle(stripExt(file.name)); }, [file]);

  const validateFile = (f) => {
    if (!f) return false;
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > FILE_LIMIT_MB) setSnack({ open: true, msg: `File is ${sizeMb.toFixed(1)} MB. Consider < ${FILE_LIMIT_MB} MB for quicker preview.`, sev: "warning" });
    if (fileType === "EXCEL" && !isExcelExt(f)) return setSchemaError("Please select a valid Excel file (.xlsx or .xls)."), false;
    if (fileType === "POWERPOINT" && !isPptx(f)) return setSchemaError("Preview supports .pptx only."), false;
    if (fileType === "REPORT" && !(isPdf(f) || isDocx(f) || isDoc(f))) return setSchemaError("Unsupported report format. Use .pdf, .docx, or .doc."), false;
    return true;
  };

  useEffect(() => {
    const run = async () => {
      if (!file) return; if (!validateFile(file)) return;
      if (fileType === "EXCEL") {
        setPreviewLoading(true);
        try {
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf, { type: "array", cellDates: true, raw: true });
          const sheets = wb.SheetNames || [];
          const previews = [];
          for (const name of sheets) {
            const sheet = wb.Sheets[name]; if (!sheet) continue;
            const prev = buildSheetPreview(name, sheet);
            if (prev?.headersSanitized?.length) previews.push(prev);
          }
          if (!previews.length) setSchemaError("No usable data found in this workbook.");
          setWorkbook(previews); setActiveSheetIdx(0); setActiveTab(0);
        } catch (e) { console.error(e); setSchemaError("Failed to read Excel. The file may be corrupted or encrypted."); }
        finally { setPreviewLoading(false); }
      }
      if (fileType === "POWERPOINT") {
        setPreviewLoading(true);
        try { setSlides(await parsePptxSlides(file)); setActiveTab(1); }
        catch (e) { console.error(e); setReportInfo("Could not parse PPTX."); }
        finally { setPreviewLoading(false); }
      }
      if (fileType === "REPORT") {
        if (isPdf(file)) { const url = URL.createObjectURL(file); setPdfUrl(url); setReportInfo(""); setActiveTab(2); }
        else if (isDocx(file)) {
          setPreviewLoading(true);
          try { setDocxParas(await parseDocxPreview(file)); setReportInfo(""); setActiveTab(2); }
          catch (e) { console.error(e); setReportInfo("Could not parse DOCX."); }
          finally { setPreviewLoading(false); }
        } else if (isDoc(file)) setReportInfo("Inline preview for .doc is not supported by the browser.");
      }
    };
    run();
    return () => { setPdfUrl((old) => { if (old) URL.revokeObjectURL(old); return null; }); };
  }, [file, fileType]);

  const setSheetMut = (idx, mut) => setWorkbook((prev) => prev.map((s, i) => (i === idx ? mut(s) : s)));

  const autoFixSanitized = (idx) => setSheetMut(idx, (s) => {
    const fixed = uniqueSanitized(s.headersSanitized);
    return { ...s, headersSanitized: fixed };
  });

  const handleTypeChange = (colIdx, newType) => setSheetMut(activeSheetIdx, (s) => {
    const next = { ...s, types: [...s.types] }; next.types[colIdx] = newType; return next;
  });

  const handleSanitizedChange = (colIdx, newVal) => setSheetMut(activeSheetIdx, (s) => {
    // live sanitize but keep user intent
    let name = sanitizeIdentifier(newVal).toLowerCase();
    if (!startsWithLetter(name)) name = `c_${name}`;
    if (RESERVED.has(name)) name = `${name}_col`;
    const raw = [...s.headersSanitized]; raw[colIdx] = name || `col_${colIdx + 1}`;
    return { ...s, headersSanitized: raw };
  });

  const dupSanitizedInActive = useMemo(() => {
    if (!workbook.length || !activeSheet) return [];
    const counts = activeSheet.headersSanitized.reduce((m,k)=>{ m[k]=(m[k]||0)+1; return m; },{});
    return Object.keys(counts).filter(k=>counts[k]>1);
  }, [workbook, activeSheet]);

  const columnIssue = (name) => {
    const issues = [];
    if (!startsWithLetter(name)) issues.push("Must start with a letter or _ (auto-fix adds c_)");
    if (RESERVED.has(name)) issues.push("Reserved keyword (auto-fix adds _col)");
    if (!name) issues.push("Empty");
    return issues;
  };

  const schemaQuality = useMemo(() => {
    if (!activeSheet) return { score: 0, label: "—" };
    const total = activeSheet.headersSanitized.length || 1;
    let score = 100;
    // penalties
    score -= dupSanitizedInActive.length * 10;
    for (const h of activeSheet.headersSanitized) {
      if (RESERVED.has(h)) score -= 6;
      if (!startsWithLetter(h)) score -= 4;
      if (h.length < 2) score -= 2;
    }
    // bonus if many columns have high uniqueness and low empties
    let goodProfiles = 0;
    (activeSheet.profiles || []).forEach(p => { if (p && p.uniqueRatio > 0.6 && p.empty/Math.max(1,p.total) < 0.3) goodProfiles++; });
    score += Math.min(10, goodProfiles);
    score = Math.max(0, Math.min(100, score));
    const label = score >= 85 ? "Great" : score >= 70 ? "Good" : score >= 50 ? "Needs review" : "Poor";
    return { score, label };
  }, [activeSheet, dupSanitizedInActive]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setUploading(true);
      setSnack({ open: true, msg: "Uploading…", sev: "info" });

      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", fileType);
      fd.append("subPractice", subPractice);
      fd.append("title", (title || stripExt(file.name)).trim());
      fd.append("description", description.trim());
      fd.append("tags", JSON.stringify((tags || "").split(",").map((t) => t.trim()).filter(Boolean)));

      const createRes = await fetch(`${API_BASE}/api/files`, { method: "POST", body: fd });
      if (!createRes.ok) throw new Error(`Upload failed: ${createRes.status}`);
      const created = await createRes.json(); // { id }

      if (fileType === "EXCEL") {
        const selected = workbook.filter((s) => s.selected);
        for (const s of selected) {
          // ensure final uniqueness
          const finalSan = uniqueSanitized(s.headersSanitized);
          const cols = finalSan.map((name, i) => ({
            name,
            type: s.types[i] || "text",
            nullable: true,
            originalName: s.headers[i] || name,
          }));
          const tableName = selected.length === 1 ? sanitizeIdentifier(title || s.name).toLowerCase()
            : sanitizeIdentifier(`${title || stripExt(file.name)}__${s.name}`).toLowerCase();
          const body = {
            fileId: created?.id,
            sheetName: s.name,
            headerRowIndex: s.headerRowIdx,
            tableName: startsWithLetter(tableName) ? tableName : `t_${tableName}`,
            columns: cols,
            notes: "Initial schema (headers auto-detected, sanitized, conflicts resolved).",
          };
          const ingestRes = await fetch(`${API_BASE}/api/excel/ingest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!ingestRes.ok) throw new Error(await ingestRes.text());
        }
      }

      setSnack({ open: true, msg: "Upload complete!", sev: "success" });
      setTimeout(() => navigate("/files"), 600);
    } catch (e) {
      setSnack({ open: true, msg: e.message || "Upload error", sev: "error" });
    } finally {
      setUploading(false);
    }
  };

  // Drag & drop
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) { setFile(f); setSchemaError(""); } };

  const acceptByType = fileType === "EXCEL" ? ".xlsx,.xls" : fileType === "POWERPOINT" ? ".pptx" : ".pdf,.doc,.docx";

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: "100vh", overflowX: "hidden",
        background: theme.palette.mode === "light"
          ? `radial-gradient(1200px 600px at 12% -10%, rgba(0,150,214,0.10), transparent),
             radial-gradient(900px 500px at 88% 0%, rgba(0,191,166,0.10), transparent), ${ZBG}`
          : `radial-gradient(1200px 600px at 12% -10%, rgba(0,150,214,0.12), transparent),
             radial-gradient(900px 500px at 88% 0%, rgba(0,191,166,0.12), transparent), linear-gradient(0deg, #0b1116, #0d141c)`,
      }}>
        {/* Top bar */}
        <AppBar position="sticky" elevation={0} role="navigation" aria-label="Primary" sx={{
          bgcolor: "transparent",
          backgroundImage: theme.palette.mode === "light"
            ? "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))"
            : "linear-gradient(180deg, rgba(20,28,36,0.75), rgba(20,28,36,0.45))",
          backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <Toolbar sx={{ gap: 1.5, minHeight: 72, px: { xs: 1.5, md: 3 } }}>
            <IconButton component={RouterLink} to="/dashboard" aria-label="Back to Dashboard"><ArrowBackIcon /></IconButton>
            <Breadcrumbs sx={{ ml: 1, color: "text.secondary" }} aria-label="breadcrumbs">
              <Link component={RouterLink} underline="hover" to="/dashboard" color="inherit">Dashboard</Link>
              <Typography color="text.primary" fontWeight={700}>Upload</Typography>
            </Breadcrumbs>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title={dark ? "Switch to light" : "Switch to dark"}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mr: 1 }}>
                <ColorLensIcon fontSize="small" />
                <Switch checked={dark} onChange={() => setDark((d) => !d)} inputProps={{ "aria-label": "Toggle dark mode" }} />
              </Stack>
            </Tooltip>
            <Avatar sx={{ bgcolor: ZTEAL, width: 36, height: 36, fontWeight: 800, mr: 1 }}>SL</Avatar>
            <Button color="inherit" component={RouterLink} to="/files">View Files</Button>
            {/* ---- Consistent Logout button ---- */}
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>Logout</Button>
          </Toolbar>
        </AppBar>

        {/* Hero */}
        <Container maxWidth={false} sx={{ pt: { xs: 2, md: 5 }, pb: { xs: 2, md: 4 } }}>
          <Box sx={{ maxWidth: "1280px", mx: "auto", px: { xs: 1.5, md: 3 } }}>
            <Paper elevation={0} sx={{
              p: { xs: 2.5, md: 4 }, borderRadius: { xs: 3, md: 4 }, border: "1px solid",
              borderColor: theme.palette.mode === "light" ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
              background: theme.palette.mode === "light"
                ? "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.86))"
                : "linear-gradient(180deg, rgba(22,30,39,0.95), rgba(22,30,39,0.86))",
              animation: `${appear} .55s ease-out`,
            }}>
              <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }}
                     justifyContent="space-between" spacing={{ xs: 2, md: 3 }} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label="Zinnov Platform" sx={{ fontWeight: 700, bgcolor: ZBLUE, color: "#fff" }} />
                  <Chip label="Smart Upload" variant="outlined" color="secondary" sx={{ fontWeight: 700 }} />
                </Stack>
                <Avatar sx={{ bgcolor: ZTEAL, width: 40, height: 40, fontWeight: 800 }}>SL</Avatar>
              </Stack>

              <Typography variant="h1" component="h1" gutterBottom>Upload & Ingest Files</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Auto-detect headers, profile columns, sanitize names, and ingest selected sheets. Use <b>Ctrl/⌘ + S</b> to auto-fix columns, <b>Ctrl/⌘ + Enter</b> to submit.
              </Typography>

              {/* Stepper */}
              <Box sx={{ mb: 2 }}>
                <Stepper alternativeLabel activeStep={file ? 1 : 0}>
                  {steps.map((label) => (<Step key={label}><StepLabel>{label}</StepLabel></Step>))}
                </Stepper>
              </Box>

              <Grid container spacing={2.5} alignItems="stretch">
                {/* Left column */}
                <Grid item xs={12} md={4} lg={4}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                    <TextField label="Title" fullWidth value={title} onChange={(e)=>setTitle(e.target.value)}
                               placeholder="Auto-filled from file name" helperText="You can edit this" size="small" />
                    <TextField select label="Sub-Practice" fullWidth value={subPractice} onChange={(e)=>setSubPractice(e.target.value)} size="small">
                      {SUB_PRACTICES.map((sp) => (<MenuItem key={sp} value={sp}>{sp}</MenuItem>))}
                    </TextField>
                    <TextField select label="File Type" fullWidth value={fileType} onChange={(e)=>setFileType(e.target.value)} size="small">
                      {FILE_TYPES.map((t) => (<MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>))}
                    </TextField>
                    <TextField label="Description (optional)" fullWidth value={description} onChange={(e)=>setDescription(e.target.value)}
                               placeholder="Short summary to help teammates" size="small" />
                    <TextField label="Tags (comma-separated)" fullWidth value={tags} onChange={(e)=>setTags(e.target.value)}
                               placeholder="kpi, q3, finance" size="small" />
                    <FormHelperText>Tags improve searchability.</FormHelperText>

                    <Divider />

                    {/* Drop zone */}
                    <Box onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
                      role="button" tabIndex={0}
                      onKeyDown={(e)=>{ if(e.key === "Enter") inputRef.current?.click(); }}
                      sx={{ position:"relative", p: 2, border:"2px dashed", borderRadius: 3,
                        borderColor: dragOver ? theme.palette.primary.main : (theme.palette.mode === "light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)"),
                        background: dragOver ? (theme.palette.mode === "light" ? "rgba(0,150,214,0.06)" : "rgba(0,150,214,0.12)") : "transparent",
                        textAlign: "center", cursor: "pointer", outline: "none", transition: "all .2s" }}
                      onClick={()=>inputRef.current?.click()} aria-label="Choose or drop a file to upload">
                      <Stack alignItems="center" spacing={1}>
                        <CloudUploadIcon fontSize="large" sx={{ animation: `${float} 3s ease-in-out infinite` }} />
                        <Typography fontWeight={700}>Drop your file here</Typography>
                        <Typography variant="body2" color="text.secondary">or click to browse — accepted: {acceptByType}</Typography>
                        <input ref={inputRef} type="file" hidden accept={acceptByType}
                          onChange={(e)=>{ const f = (e.target.files && e.target.files[0]) || null; if (f) { setFile(f); setSchemaError(""); } }} />
                      </Stack>
                    </Box>

                    <Box>
                      {file ? (
                        <>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <InsertDriveFileIcon color="action" />
                            <Typography sx={{ fontWeight: 700 }}>{file.name}</Typography>
                            <Badge color="secondary" badgeContent={`${(file.size/(1024*1024)).toFixed(1)} MB`} />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">Type: {fileType}</Typography>
                        </>
                      ) : (<Typography color="text.secondary">No file selected yet.</Typography>)}
                    </Box>

                    {schemaError && <Alert severity="warning" icon={<WarningAmberIcon />}>{schemaError}</Alert>}
                    {reportInfo && <Alert severity="info">{reportInfo}</Alert>}
                    {previewLoading && <LinearProgress />}
                  </Paper>
                </Grid>

                {/* Right column */}
                <Grid item xs={12} md={8} lg={8}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>

                    {/* Tabs */}
                    <Tabs value={activeTab} onChange={(_,v)=>setActiveTab(v)} sx={{ mb: 1 }}>
                      <Tab icon={<TableChartIcon />} iconPosition="start" label="Excel" />
                      <Tab icon={<PreviewIcon />} iconPosition="start" label="PowerPoint" />
                      <Tab icon={<ImageIcon />} iconPosition="start" label="Report" />
                    </Tabs>

                    {/* Excel */}
                    {activeTab === 0 && (
                      <Stack spacing={2}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", sm: "center" }} flexWrap="wrap">
                          <TableChartIcon color="primary" />
                          <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>Excel Preview & Smart Schema</Typography>
                          {workbook.length > 1 && (
                            <Box sx={{ ml: { sm: "auto" }, minWidth: { xs: "100%", sm: 260 } }}>
                              <MuiSelect fullWidth size="small" value={activeSheetIdx} onChange={(e)=>setActiveSheetIdx(Number(e.target.value))}>
                                {workbook.map((s,i)=>(<MenuItem key={s.name + i} value={i}>{s.name}</MenuItem>))}
                              </MuiSelect>
                            </Box>
                          )}
                        </Stack>

                        {workbook.length > 0 && (
                          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <FormControlLabel control={<Checkbox checked={workbook[activeSheetIdx]?.selected || false}
                                onChange={(e)=>setSheetMut(activeSheetIdx,(prev)=>({...prev,selected:e.target.checked}))} />}
                                label={`Ingest ${workbook[activeSheetIdx]?.name || ''}`} />
                              {dupSanitizedInActive.length>0 && <Chip color="warning" icon={<WarningAmberIcon />} label={`${dupSanitizedInActive.length} duplicate name(s)`} />}
                              <Chip color={schemaQuality.score>=85?"success":schemaQuality.score>=70?"primary":"warning"}
                                    label={`Schema quality: ${schemaQuality.label} (${schemaQuality.score})`} />
                            </Stack>
                            <Box sx={{ ml: { sm: "auto" } }}>
                              <Tooltip title="Auto-fix sanitized names (Ctrl/⌘+S)"><Button size="small" startIcon={<AutoFixHighIcon />} onClick={()=>autoFixSanitized(activeSheetIdx)}>Auto-fix</Button></Tooltip>
                              <Tooltip title="Reset sanitized names from original headers"><Button size="small" startIcon={<CleaningServicesIcon />} onClick={()=>setSheetMut(activeSheetIdx,(s)=>({...s, headersSanitized: uniqueSanitized(s.headers)}))}>Reset</Button></Tooltip>
                            </Box>
                          </Stack>
                        )}

                        {workbook.length > 0 && activeSheet ? (
                          <>
                            <Typography variant="subtitle2">Columns</Typography>
                            <Grid container spacing={1.5} alignItems="stretch">
                              {activeSheet.headersSanitized.map((san, colIdx) => {
                                const issues = columnIssue(san);
                                const prof = activeSheet.profiles?.[colIdx];
                                return (
                                  <Grid key={colIdx} item xs={12} md={6} lg={4}>
                                    <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2, height: "100%", display: "grid", gridTemplateRows: "auto auto auto auto", gap: 0.6, minHeight: 140 }}>
                                      <Chip size="small" label={`Original: ${activeSheet.headers[colIdx] || `Column ${colIdx + 1}`}`} sx={{ justifySelf: "start", maxWidth: "100%" }} />
                                      <TextField size="small" label="Sanitized name" value={san}
                                                 onChange={(e)=>handleSanitizedChange(colIdx, e.target.value)}
                                                 InputProps={{ endAdornment: issues.length>0 ? <InputAdornment position="end"><WarningAmberIcon color="warning" /></InputAdornment> : null }}
                                      />
                                      <TextField select size="small" label="Type" value={activeSheet.types[colIdx] || "text"} onChange={(e)=>handleTypeChange(colIdx, e.target.value)}>
                                        {DEFAULT_TYPES.map((t)=>(<MenuItem key={t} value={t}>{t}</MenuItem>))}
                                      </TextField>
                                      {prof && (
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ overflow: "hidden" }}>
                                          <Chip size="small" variant="outlined" label={`unique ${(prof.uniqueRatio*100|0)}%`} />
                                          <Chip size="small" variant="outlined" label={`empty ${(prof.empty*100/prof.total|0)}%`} />
                                          {prof.minVal!=null && prof.maxVal!=null && <Chip size="small" variant="outlined" label={`${prof.minVal}–${prof.maxVal}`} />}
                                          {prof.minDate && prof.maxDate && <Chip size="small" variant="outlined" label={`${df.format(prof.minDate)} → ${df.format(prof.maxDate)}`} />}
                                        </Stack>
                                      )}
                                      {issues.length>0 && (
                                        <Alert severity="warning" sx={{ mt: .5 }}>
                                          {issues.join("; ")}
                                        </Alert>
                                      )}
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>

                            {activeSheet.sample.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                  <ContentPasteSearchIcon color="primary" />
                                  <Typography variant="subtitle2">Sample Rows — {activeSheet.name}</Typography>
                                  <Chip size="small" label={`${activeSheet.sample.length} shown`} />
                                </Stack>
                                <Paper variant="outlined" sx={{ borderRadius: 2 }}>
                                  <TableContainer sx={{ maxHeight: 420 }}>
                                    <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
                                      <TableHead>
                                        <TableRow>
                                          {activeSheet.headers.map((h, idx) => (
                                            <TableCell key={idx} sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>{displayCell(h)}</TableCell>
                                          ))}
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {activeSheet.sample.map((row, rIdx) => (
                                          <TableRow key={rIdx} hover>
                                            {activeSheet.headers.map((_, cIdx) => (
                                              <TableCell key={cIdx} sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {displayCell(row?.[cIdx])}
                                              </TableCell>
                                            ))}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Paper>
                              </Box>
                            )}
                          </>
                        ) : (!previewLoading && <Typography color="text.secondary">Select an Excel file to preview sheets and columns.</Typography>)}
                      </Stack>
                    )}

                    {/* PowerPoint */}
                    {activeTab === 1 && (
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <PreviewIcon color="primary" />
                          <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>PowerPoint Preview (slides)</Typography>
                        </Stack>
                        {slides.length > 0 ? (
                          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <TableContainer sx={{ maxHeight: 520 }}>
                              <Table size="small" stickyHeader sx={{ minWidth: 560 }}>
                                <TableHead><TableRow><TableCell sx={{ fontWeight: 700, width: 100 }}>Slide</TableCell><TableCell sx={{ fontWeight: 700 }}>Title / Text</TableCell></TableRow></TableHead>
                                <TableBody>
                                  {slides.map((s) => (
                                    <TableRow key={s.index} hover>
                                      <TableCell>#{s.index}</TableCell>
                                      <TableCell>
                                        <Typography sx={{ fontWeight: 700, mb: 0.25 }}>{s.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{s.snippet}</Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Paper>
                        ) : (!previewLoading && <Typography color="text.secondary">Select a .pptx file to preview slides.</Typography>)}
                      </Stack>
                    )}

                    {/* Reports */}
                    {activeTab === 2 && (
                      <Stack spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <ImageIcon color="primary" />
                          <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>Report Preview</Typography>
                        </Stack>
                        {pdfUrl && (
                          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <Box sx={{ height: { xs: 420, md: 560 } }}>
                              <iframe title="PDF Preview" src={pdfUrl} style={{ width: "100%", height: "100%", border: 0 }} />
                            </Box>
                          </Paper>
                        )}
                        {!pdfUrl && docxParas.length > 0 && (
                          <Paper variant="outlined" sx={{ borderRadius: 2, p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>First paragraphs</Typography>
                            <Stack spacing={1}>{docxParas.map((p,i)=>(<Typography key={i} variant="body2" sx={{ lineHeight: 1.5 }}>{p}</Typography>))}</Stack>
                          </Paper>
                        )}
                        {!pdfUrl && docxParas.length === 0 && !previewLoading && !reportInfo && (
                          <Typography color="text.secondary">Select a .pdf or .docx file to preview.</Typography>
                        )}
                      </Stack>
                    )}

                    {fileType !== "EXCEL" && !file && <Typography color="text.secondary">Choose a file to see its preview.</Typography>}
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Sticky bar */}
          <Box sx={{
            position: { md: "sticky" }, bottom: 0, mt: 3, zIndex: 5,
            background: theme.palette.mode === "light"
              ? "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.9))"
              : "linear-gradient(180deg, rgba(12,18,25,0), rgba(12,18,25,0.9))",
            borderTop: "1px solid rgba(0,0,0,0.06)",
          }}>
            <Box sx={{ maxWidth: "1280px", mx: "auto", px: { xs: 1.5, md: 3 }, py: 1.5 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <CheckCircleIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Review, auto-fix, then submit {fileType === "EXCEL" ? "(selected sheets will be ingested)" : ""}. Shortcuts: <b>Ctrl/⌘ + S</b>, <b>Ctrl/⌘ + Enter</b>.
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5}>
                  <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/dashboard">Cancel</Button>
                  <Button variant="outlined" startIcon={<DoneAllIcon />} disabled={!canSubmit || uploading} onClick={()=>window.scrollTo({ top: 0, behavior: 'smooth' })}>Review</Button>
                  <Button variant="contained" startIcon={<RocketLaunchIcon />} disabled={uploading || !canSubmit}
                          onClick={handleSubmit} sx={{ animation: `${pulse} 2.8s ease-out infinite` }}>
                    {uploading ? "Uploading…" : "Submit"}
                  </Button>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Snackbar open={snack.open} onClose={() => setSnack((s) => ({ ...s, open: false }))} autoHideDuration={4000}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.sev} variant="filled">
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
