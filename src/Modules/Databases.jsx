// src/Modules/Databases.jsx (Sleek Pro Redesign)
// deps: @mui/material @emotion/react @mui/icons-material react-router-dom
import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { keyframes } from "@emotion/react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar, Toolbar, Container, Box, Typography, Button, Paper, Grid, Chip, Stack, Divider, Link,
  Breadcrumbs, CssBaseline, ThemeProvider, createTheme, IconButton, useMediaQuery, Switch, Tooltip,
  TextField, MenuItem, InputAdornment, Skeleton, ToggleButton, ToggleButtonGroup, Badge,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Alert, CircularProgress, Snackbar
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TableChartIcon from "@mui/icons-material/TableChart";
import SlideshowIcon from "@mui/icons-material/Slideshow";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import ColorLensIcon from "@mui/icons-material/ColorLens";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import GridViewIcon from "@mui/icons-material/GridView";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DoneIcon from "@mui/icons-material/Done";

/* API base */
const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:5000";

/* Animations */
const appear = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const shimmer = keyframes`0%{transform:translateX(-40%)}100%{transform:translateX(140%)}`;
const glow = keyframes`0%{box-shadow:0 0 0 rgba(0,150,214,0)}50%{box-shadow:0 10px 34px rgba(0,150,214,.25)}100%{box-shadow:0 0 0 rgba(0,150,214,0)}`;

/* Theme */
const ZBLUE = "#0096D6", ZTEAL = "#00BFA6", ZBG = "linear-gradient(0deg, #f8fbff, #f3f6fb)";
const makeTheme = (mode="light") => createTheme({
  palette: {
    mode, primary: { main: ZBLUE, contrastText: "#fff" }, secondary: { main: ZTEAL },
    background: { default: mode === "light" ? "#f2f5fa" : "#0b1116", paper: mode === "light" ? "#ffffff" : "#0f1620" },
    text: { primary: mode === "light" ? "#0e1a2b" : "#e8f1f9", secondary: mode === "light" ? "#5b6777" : "#a9bacb" },
    divider: mode === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial",
    h1: { fontSize: "clamp(1.6rem, 2.2vw + 1rem, 2.4rem)", fontWeight: 900, letterSpacing: -0.5 },
    h2: { fontSize: "clamp(1.2rem, 1.1vw + 0.9rem, 1.6rem)", fontWeight: 800 },
    button: { fontWeight: 700 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease" } } },
    MuiButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 14 } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: "none", borderRadius: 10 } } },
  },
});

/* Constants + helpers */
const SUB_PRACTICES = ["Automation", "Platforms", "M/A", "Services", "Zones"];
const TYPE_META = {
  EXCEL: { label: "Excel", icon: <TableChartIcon fontSize="small" />, color: "#2E7D32" },
  POWERPOINT: { label: "PowerPoint", icon: <SlideshowIcon fontSize="small" />, color: "#D32F2F" },
  REPORT: { label: "Report", icon: <DescriptionIcon fontSize="small" />, color: "#5E35B1" },
};
const SORTS = [
  { value: "recent", label: "Recent" },
  { value: "title_asc", label: "Title A→Z" },
  { value: "title_desc", label: "Title Z→A" },
];
const nf = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const df = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function asTagArray(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String);
  try { const j = JSON.parse(tags); return Array.isArray(j) ? j.map(String) : []; }
  catch { return String(tags).replace(/[{}\[\]]/g,"").split(/[;,]+/g).flatMap((s)=>s.split(",")).map((s)=>s.trim()).filter(Boolean); }
}
function applyFilters(files, { query, type, sort, subPractice }) {
  let list = [...files];
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((f) =>
      (f.title || "").toLowerCase().includes(q) ||
      (f.original_name || "").toLowerCase().includes(q) ||
      asTagArray(f.tags).join(" ").toLowerCase().includes(q)
    );
  }
  if (type) list = list.filter((f) => f.type === type);
  if (subPractice && subPractice !== "All") list = list.filter((f) => (f.sub_practice || "Unassigned") === subPractice);
  switch (sort) {
    case "title_asc": list.sort((a,b)=>(a.title||"").localeCompare(b.title||"")); break;
    case "title_desc": list.sort((a,b)=>(b.title||"").localeCompare(a.title||"")); break;
    default: list.sort((a,b)=> new Date(b.updated_at||b.created_at) - new Date(a.updated_at||a.created_at));
  }
  return list;
}

/* Shared building blocks */
const GlassPaper = (props) => (
  <Paper
    variant="outlined"
    {...props}
    sx={{
      borderRadius: 3,
      background: (t) =>
        t.palette.mode === "light"
          ? "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.88))"
          : "linear-gradient(180deg, rgba(22,30,39,.92), rgba(22,30,39,.84))",
      borderColor: "divider",
      boxShadow: (t) =>
        t.palette.mode === "light"
          ? "0 6px 24px rgba(16,24,40,.06)"
          : "0 8px 30px rgba(0,0,0,.35)",
      transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
      "&:hover": {
        transform: { md: "translateY(-2px)" },
        borderColor: "primary.main",
        boxShadow: (t) =>
          t.palette.mode === "light"
            ? "0 14px 40px rgba(16,24,40,.10)"
            : "0 16px 50px rgba(0,0,0,.55)",
      },
      ...props.sx,
    }}
  />
);

const ActionBar = ({ children }) => (
  <Stack
    direction="row"
    spacing={0.75}
    sx={{
      opacity: 0,
      transform: "translateY(4px)",
      transition: "all .18s ease",
      ".file-card:hover & , tr.MuiTableRow-hover:hover &": { opacity: 1, transform: "translateY(0)" },
      "& .MuiButton-root": { borderRadius: 2 }
    }}
  >
    {children}
  </Stack>
);

/* Command Bar */
function CommandBar({ query, setQuery, type, setType, sort, setSort, subPractice, setSubPractice, totals, dark, setDark, onSaveView, density, setDensity, view, setView }) {
  return (
    <GlassPaper elevation={0} sx={{
      p: { xs: 2, sm: 3 }, mb: 2, borderRadius: 4,
      animation: `${appear} .55s ease-out`, position: "sticky", top: 72, zIndex: 2,
    }}>
      <Stack spacing={1.25}>
        <Box sx={{ position: "relative", maxWidth: 980, mx: "auto" }}>
          <TextField
            fullWidth placeholder="Search everything — title, file name, tags  (⌘/Ctrl + K)"
            value={query} onChange={(e) => setQuery(e.target.value)}
            InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4, py: 0.25, background: (t)=> t.palette.mode === "light" ? "#fff" : "rgba(255,255,255,0.04)", animation: `${glow} 4.5s ease-in-out infinite` } }}
          />
          <Box aria-hidden sx={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(90deg, transparent, rgba(0,150,214,0.12), transparent)",
            width: "40%", animation: `${shimmer} 3.2s linear infinite`,
            maskImage: "linear-gradient(to right, transparent, black, transparent)",
          }} />
        </Box>

        <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
          {/* Quick facets */}
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <ToggleButtonGroup color="primary" exclusive value={type} onChange={(_, v) => setType(v || "")} sx={{ flexWrap: "wrap" }}>
              <ToggleButton value=""><Typography variant="body2">All</Typography></ToggleButton>
              <ToggleButton value="EXCEL"><TableChartIcon sx={{ mr: .5 }} fontSize="small" />Excel</ToggleButton>
              <ToggleButton value="POWERPOINT"><SlideshowIcon sx={{ mr: .5 }} fontSize="small" />PPT</ToggleButton>
              <ToggleButton value="REPORT"><DescriptionIcon sx={{ mr: .5 }} fontSize="small" />Reports</ToggleButton>
            </ToggleButtonGroup>

            <TextField select size="small" value={subPractice} onChange={(e)=>setSubPractice(e.target.value)} sx={{ minWidth: 160 }}>
              {["All", ...SUB_PRACTICES].map((sp)=>(<MenuItem key={sp} value={sp}>{sp}</MenuItem>))}
            </TextField>

            <TextField select size="small" value={sort} onChange={(e)=>setSort(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SortIcon fontSize="small" /></InputAdornment>) }}
              sx={{ minWidth: 180 }}>
              {SORTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>

            <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => setView(v || view)}>
              <ToggleButton value="cards"><GridViewIcon fontSize="small" sx={{ mr: .5 }} />Cards</ToggleButton>
              <ToggleButton value="rows"><ViewAgendaIcon fontSize="small" sx={{ mr: .5 }} />Rows</ToggleButton>
            </ToggleButtonGroup>

            <TextField select size="small" value={density} onChange={(e)=>setDensity(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><DensityMediumIcon fontSize="small" /></InputAdornment>) }}
              sx={{ minWidth: 160 }}>
              {[
                {k:"comfortable", l:"Comfortable"},
                {k:"cozy", l:"Cozy"},
                {k:"compact", l:"Compact"},
              ].map(x=> <MenuItem key={x.k} value={x.k}>{x.l}</MenuItem>)}
            </TextField>
          </Stack>

          {/* Right controls */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1}>
              <Chip icon={<TableChartIcon />} label={`Excel ${nf.format(totals.EXCEL)}`} />
              <Chip icon={<SlideshowIcon />} label={`PPT ${nf.format(totals.POWERPOINT)}`} />
              <Chip icon={<DescriptionIcon />} label={`Reports ${nf.format(totals.REPORT)}`} />
              <Chip color="primary" label={`Total ${nf.format(totals.all)}`} />
            </Stack>
            <Tooltip title={dark ? "Switch to light" : "Switch to dark"}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1 }}>
                <ColorLensIcon fontSize="small" />
                <Switch checked={dark} onChange={() => setDark(d => !d)} inputProps={{ "aria-label": "Toggle dark mode" }} />
              </Stack>
            </Tooltip>
            <Button variant="outlined" onClick={onSaveView}>Save view</Button>
          </Stack>
        </Stack>
      </Stack>
    </GlassPaper>
  );
}

/* File card */
function FileCardPro({ file, favorites, onFav, onEditExcel }) {
  const meta = TYPE_META[file.type] || TYPE_META.REPORT;
  const fav = favorites.has(file.id);
  const sizeMB = file.size ? (Number(file.size) / (1024 * 1024)).toFixed(2) : null;

  return (
    <GlassPaper className="file-card" sx={{
      p: 1.5, display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 1.25,
      minHeight: 126, borderColor: "divider",
      position: "relative", overflow: "hidden"
    }}>
      {/* Icon tile with glossy ring */}
      <Box sx={{ position: "relative" }}>
        <Box sx={{ width: 56, height: 56, borderRadius: 2.5, bgcolor: meta.color, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center",
          backgroundImage: "linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,0))" }}>
          {meta.icon}
        </Box>
        {fav && (
          <Box sx={{ position:"absolute", top:-2, right:-2, width: 14, height: 14, borderRadius: "50%", bgcolor: "#FFC107", boxShadow: "0 0 0 2px white" }} />
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.15, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
                    title={file.title || file.original_name}>
          {file.title || file.original_name}
        </Typography>
        <Typography variant="caption" sx={{ mt: 0.25, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New'", color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    title={file.original_name}>
          {file.original_name}
        </Typography>

        <Stack direction="row" spacing={0.75} sx={{ mt: 0.75, flexWrap: "wrap", alignItems:"center" }}>
          <Chip size="small" label={(file.ext || "").toUpperCase() || "FILE"} sx={{ fontWeight: 700 }} />
          <Chip size="small" label={meta.label} sx={{ bgcolor: `${meta.color}22`, color: meta.color, fontWeight: 700 }} />
          <Chip size="small" variant="outlined" label={file.sub_practice || "Unassigned"} />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            v{file.version} · {sizeMB ? `${sizeMB} MB · ` : ""}Updated {df.format(new Date(file.updated_at || file.created_at))}
          </Typography>
        </Stack>

        {!!asTagArray(file.tags).length && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.75, flexWrap: "wrap" }}>
            {asTagArray(file.tags).slice(0, 3).map((t, i) => (<Chip key={i} size="small" label={t} sx={{ mr: 0.5, mb: 0.5 }} />))}
            {asTagArray(file.tags).length > 3 && <Chip size="small" label={`+${asTagArray(file.tags).length - 3}`} />}
          </Stack>
        )}
      </Box>

      <ActionBar>
        {file.type === "EXCEL" && (
          <Tooltip title="Edit data"><Button size="small" variant="contained" startIcon={<EditIcon />} onClick={() => onEditExcel(file)}>Edit</Button></Tooltip>
        )}
        {file.download_url && (
          <Tooltip title="Download"><Button size="small" variant="outlined" startIcon={<CloudDownloadIcon />} href={file.download_url} target="_blank" rel="noopener noreferrer">Download</Button></Tooltip>
        )}
        <Tooltip title={fav ? "Unfavorite" : "Favorite"}>
          <IconButton size="small" onClick={() => onFav(file.id)}>{fav ? <StarIcon color="warning" /> : <StarBorderIcon />}</IconButton>
        </Tooltip>
        <Tooltip title="More">
          <IconButton size="small"><MoreVertIcon /></IconButton>
        </Tooltip>
      </ActionBar>
    </GlassPaper>
  );
}

/* Rows view (Power mode) */
function RowsTablePro({ files, favorites, onFav, onEditExcel, density }) {
  const rowHeights = { comfortable: 56, cozy: 48, compact: 40 };
  const size = density === "comfortable" ? "medium" : "small";

  return (
    <GlassPaper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Table size={size} stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "40%", position:"sticky", left:0, background:"background.paper", zIndex:1 }}>Title</TableCell>
            <TableCell sx={{ width: "18%" }}>File Name</TableCell>
            <TableCell sx={{ width: "12%" }}>Type</TableCell>
            <TableCell sx={{ width: "14%" }}>Updated</TableCell>
            <TableCell sx={{ width: "8%", position:"sticky", right:0, background:"background.paper", zIndex:1 }} align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {files.map((f) => {
            const meta = TYPE_META[f.type] || TYPE_META.REPORT;
            const fav = favorites.has(f.id);
            return (
              <TableRow key={f.id} hover sx={{ height: rowHeights[density] }}>
                <TableCell sx={{ position:"sticky", left:0, background:"background.paper", zIndex:1 }}>
                  <Typography sx={{ fontWeight: 900 }} title={f.title || f.original_name}>{f.title || f.original_name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: .25 }}>
                    <Chip size="small" variant="outlined" label={f.sub_practice || "Unassigned"} />
                    {!!asTagArray(f.tags).length && <Typography variant="caption" color="text.secondary">{asTagArray(f.tags).slice(0,2).join(" · ")}{asTagArray(f.tags).length>2?" · +"+(asTagArray(f.tags).length-2):""}</Typography>}
                  </Stack>
                </TableCell>
                <TableCell title={f.original_name}><Typography variant="caption" sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New'" }}>{f.original_name}</Typography></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: meta.color }} />
                    <Typography variant="body2">{meta.label}</Typography>
                    <Chip size="small" label={(f.ext || "").toUpperCase() || "FILE"} />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{df.format(new Date(f.updated_at || f.created_at))}</Typography>
                  <Typography variant="caption" color="text.secondary">v{f.version}</Typography>
                </TableCell>
                <TableCell align="right" sx={{ position:"sticky", right:0, background:"background.paper", zIndex:1 }}>
                  <ActionBar>
                    {f.type === "EXCEL" && (
                      <Tooltip title="Edit data"><IconButton size="small" onClick={() => onEditExcel(f)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    {f.download_url && (
                      <Tooltip title="Download"><IconButton size="small" href={f.download_url} target="_blank" rel="noopener noreferrer"><CloudDownloadIcon fontSize="small" /></IconButton></Tooltip>
                    )}
                    <Tooltip title={fav ? "Unfavorite" : "Favorite"}>
                      <IconButton size="small" onClick={() => onFav(f.id)}>{fav ? <StarIcon color="warning" fontSize="small" /> : <StarBorderIcon fontSize="small" />}</IconButton>
                    </Tooltip>
                    <Tooltip title="More"><IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton></Tooltip>
                  </ActionBar>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </GlassPaper>
  );
}

/* Excel editor dialog - Sleek Pro */
function ExcelEditDialog({ open, onClose, file }) {
  const [tabs, setTabs] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);

  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState({ columns: [], rows: [], total: 0 });
  const [dbCols, setDbCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const active = tabs[tabIndex];

  useEffect(() => {
    if (!open || !file?.id) return;
    (async () => {
      setErr("");
      try {
        const r = await fetch(`${API_BASE}/api/excel/file/${file.id}/sheets`);
        if (!r.ok) throw new Error(`Sheets fetch failed (${r.status})`);
        const sheets = await r.json();
        setTabs(sheets); setTabIndex(0); setOffset(0);
      } catch (e) { setTabs([]); setErr(e.message || "Failed to load sheets"); }
    })();
  }, [open, file?.id]);

  const loadColumns = useCallback(async () => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/file/${file.id}/sheet/${encodeURIComponent(active.sheetName)}/columns`);
    if (!r.ok) throw new Error(`Columns fetch failed (${r.status})`);
    const payload = await r.json(); setDbCols((payload.columns || []).map((c) => c));
  }, [active, file?.id]);

  const loadRows = useCallback(async () => {
    if (!active) return;
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API_BASE}/api/excel/file/${file.id}/sheet/${encodeURIComponent(active.sheetName)}/rows?limit=${limit}&offset=${offset}`);
      if (!r.ok) throw new Error(`Rows fetch failed (${r.status})`);
      const payload = await r.json();
      setData({ columns: payload.columns || [], rows: payload.rows || [], total: payload.total || 0 });
      if (!dbCols.length) setDbCols(payload.columns || []);
    } catch (e) { setData({ columns: [], rows: [], total: 0 }); setErr(e.message || "Failed to load rows"); }
    finally { setLoading(false); }
  }, [active, file?.id, limit, offset, dbCols.length]);

  useEffect(() => {
    if (!open || !active) return;
    (async () => { try { await loadColumns(); } catch (e) { setErr(e.message); } await loadRows(); })();
  }, [open, tabIndex, limit, offset, active, loadColumns, loadRows]);

  // Column ops
  const addColumn = async (name, type = "text", defVal) => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/table/${active.schemaName}/${active.tableName}/columns`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, type, default: defVal })
    });
    if (!r.ok) throw new Error(await r.text() || "Add column failed");
  };
  const renameColumn = async (oldName, newName) => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/table/${active.schemaName}/${active.tableName}/columns/${encodeURIComponent(oldName)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newName })
    });
    if (!r.ok) throw new Error(await r.text() || "Rename column failed");
  };
  const dropColumn = async (name) => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/table/${active.schemaName}/${active.tableName}/columns/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text() || "Delete column failed");
  };

  // Row ops
  const addRow = async () => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/table/${active.schemaName}/${active.tableName}/rows`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: {} })
    });
    if (!r.ok) throw new Error(await r.text() || "Add row failed");
  };
  const updateCell = async (_rid, col, value) => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/table/${active.schemaName}/${active.tableName}/rows/${_rid}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: { [col]: value } })
    });
    if (!r.ok) throw new Error(await r.text() || "Update cell failed");
  };
  const deleteRow = async (_rid) => {
    if (!active) return;
    const r = await fetch(`${API_BASE}/api/excel/table/${active.schemaName}/${active.tableName}/rows/${_rid}`, { method: "DELETE" });
    if (!r.ok) throw new Error(await r.text() || "Delete row failed");
  };

  const newColRef = useRef(); const newColTypeRef = useRef(); const newColDefRef = useRef();
  const [renameFrom, setRenameFrom] = useState(""); const [renameTo, setRenameTo] = useState(""); const [dropWhich, setDropWhich] = useState("");
  useEffect(() => { setRenameFrom(""); setRenameTo(""); setDropWhich(""); }, [tabIndex, dbCols.join("|")]); // eslint-disable-line

  const pageStart = data.total === 0 ? 0 : offset + 1;
  const pageEnd = Math.min(offset + data.rows.length, data.total);

  const flashSnack = (msg, severity="success") => setSnack({ open: true, msg, severity });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>Excel Data — {file?.title || file?.original_name}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 1.5 }}>
          {tabs.length > 0 ? (
            <>
              <Tabs value={tabIndex} onChange={(_, v) => { setTabIndex(v); setOffset(0); }}
                    variant="scrollable" scrollButtons="auto" sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                {tabs.map((s, i) => (<Tab key={i} label={`${s.sheetName} (${nf.format(s.rowCount)})`} />))}
              </Tabs>

              {/* toolbars */}
              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}
                     justifyContent="space-between" sx={{ py: 1.25 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <TextField inputRef={newColRef} size="small" placeholder="New column name" />
                  <TextField inputRef={newColTypeRef} size="small" select defaultValue="text" sx={{ width: 140 }}>
                    <MenuItem value="text">text</MenuItem>
                    <MenuItem value="numeric">numeric</MenuItem>
                    <MenuItem value="date">date</MenuItem>
                    <MenuItem value="bool">bool</MenuItem>
                  </TextField>
                  <TextField inputRef={newColDefRef} size="small" placeholder="Default (optional)" />
                  <Button variant="contained" startIcon={<AddIcon />} onClick={async () => {
                    try {
                      await addColumn(newColRef.current.value, newColTypeRef.current.value, newColDefRef.current.value);
                      newColRef.current.value = ""; newColDefRef.current.value = "";
                      await loadColumns(); await loadRows(); flashSnack("Column added");
                    } catch (e) { setErr(e.message); flashSnack(e.message, "error"); }
                  }}>Add Column</Button>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <TextField select size="small" value={renameFrom} onChange={(e)=>setRenameFrom(e.target.value)} sx={{ minWidth: 220 }}>
                    {dbCols.filter(c=>c!=="_rid").map(c=>(<MenuItem key={c} value={c}>{c}</MenuItem>))}
                  </TextField>
                  <TextField size="small" placeholder="New name" value={renameTo} onChange={(e)=>setRenameTo(e.target.value)} />
                  <Button variant="outlined" startIcon={<SaveIcon />} onClick={async () => {
                    try { if (!renameFrom || !renameTo) return; await renameColumn(renameFrom, renameTo);
                      setRenameFrom(""); setRenameTo(""); await loadColumns(); await loadRows(); flashSnack("Column renamed"); } catch (e) { setErr(e.message); flashSnack(e.message, "error"); }
                  }}>Rename</Button>

                  <TextField select size="small" label="Rows" value={String(limit)} onChange={(e)=>{ setLimit(Number(e.target.value)); setOffset(0); }} sx={{ width: 120, ml: { md: 1 } }}>
                    {[50, 100, 500, 1000].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </TextField>

                  <Tooltip title="Reload"><IconButton onClick={async()=>{ await loadColumns(); await loadRows(); flashSnack("Reloaded"); }}><RefreshIcon /></IconButton></Tooltip>
                  <Button variant="contained" startIcon={<AddIcon />} onClick={async()=>{ try { await addRow(); await loadRows(); flashSnack("Row added"); } catch(e){ setErr(e.message); flashSnack(e.message, "error"); } }}>Add Row</Button>
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}
                     justifyContent="space-between" sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <TextField select size="small" value={dropWhich} onChange={(e)=>setDropWhich(e.target.value)} sx={{ minWidth: 220 }}>
                    {dbCols.filter(c=>c!=="_rid").map(c=>(<MenuItem key={c} value={c}>{c}</MenuItem>))}
                  </TextField>
                  <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={async()=>{ try {
                    if (!dropWhich) return; await dropColumn(dropWhich); setDropWhich(""); await loadColumns(); await loadRows(); flashSnack("Column deleted");
                  } catch(e){ setErr(e.message); flashSnack(e.message, "error"); } }}>Delete Column</Button>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Button variant="outlined" disabled={offset === 0} onClick={()=>setOffset(o=>Math.max(0, o - limit))}>Prev</Button>
                  <Button variant="outlined" disabled={offset + limit >= data.total} onClick={()=>setOffset(o=>o + limit)}>Next</Button>
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {active ? `${active.tableName} · showing ${nf.format(pageStart)}–${nf.format(pageEnd)} of ${nf.format(data.total)}` : ""}
                  </Typography>
                </Stack>
              </Stack>

              {err && <Alert severity="error" sx={{ mb: 1, mx: 0.5 }}>{err}</Alert>}

              <Box sx={{ p: 1.25 }}>
                <GlassPaper variant="outlined" sx={{ borderRadius: 2, overflow: "auto" }}>
                  {loading ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ p: 6 }}><CircularProgress /></Stack>
                  ) : data.columns.length === 0 ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ p: 6 }}><Typography color="text.secondary">No rows</Typography></Stack>
                  ) : (
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {data.columns.map((c) => (<TableCell key={c} sx={{ fontWeight: 800 }}>{c}</TableCell>))}
                          <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.rows.map((r, idx) => (
                          <TableRow key={r._rid ?? idx} hover>
                            {data.columns.map((c) => (
                              <TableCell key={c} sx={{ minWidth: 160 }}>
                                <InlineEditableCell
                                  defaultValue={r[c] ?? ""}
                                  onSave={async (val) => { try { await updateCell(r._rid, c, val); setSnack({open:true, msg:"Saved", severity:"success"}); } catch (e1) { setErr(e1.message); setSnack({open:true, msg:e1.message, severity:"error"}); } }}
                                />
                              </TableCell>
                            ))}
                            <TableCell align="right">
                              <Tooltip title="Delete row">
                                <IconButton size="small" onClick={async () => { try { await deleteRow(r._rid); await loadRows(); flashSnack("Row deleted"); } catch (e2) { setErr(e2.message); flashSnack(e2.message, "error"); } }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </GlassPaper>
              </Box>
            </>
          ) : (<Box sx={{ p: 4 }}>{err ? <Alert severity="error">{err}</Alert> : <CircularProgress />}</Box>)}
        </Box>
      </DialogContent>

      <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
      <Snackbar open={snack.open} autoHideDuration={2000} onClose={()=>setSnack(s=>({...s, open:false}))}
        message={snack.msg}
      />
    </Dialog>
  );
}

function InlineEditableCell({ defaultValue, onSave }) {
  const [val, setVal] = useState(defaultValue);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(()=> setVal(defaultValue), [defaultValue]);

  return (
    <Box sx={{ position:"relative" }}>
      <TextField
        variant="standard"
        value={val}
        onChange={(e)=>setVal(e.target.value)}
        onBlur={async ()=>{
          if (String(val) !== String(defaultValue)) {
            try { setSaving(true); await onSave(val); setSaved(true); setTimeout(()=>setSaved(false), 800); } finally { setSaving(false); }
          }
        }}
        onKeyDown={async (e)=>{
          if (e.key === "Enter") { e.currentTarget.blur(); }
          if (e.key === "Escape") { setVal(defaultValue); e.currentTarget.blur(); }
        }}
        fullWidth
      />
      {saving && <CircularProgress size={16} sx={{ position:"absolute", right: 8, top: 6 }} />}
      {saved && <DoneIcon fontSize="small" sx={{ position:"absolute", right: 8, top: 6, color: "success.main" }} />}
    </Box>
  );
}

/* Left rail */
function LeftRail({ filesBySPFiltered, totals, countsPerSP, activeSP, onJump }) {
  return (
    <GlassPaper sx={{ position: { md: "sticky" }, top: { md: 140 }, p: 1.25, borderRadius: 3, display: { xs: "none", md: "block" } }}>
      <Stack spacing={0.25}>
        {["All", ...Object.keys(filesBySPFiltered)].filter((v,i,a)=>a.indexOf(v)===i).map((sp) => (
          <Button key={sp} onClick={() => onJump(sp)} fullWidth
                  variant={activeSP === sp ? "contained" : "text"} color={activeSP === sp ? "primary" : "inherit"}
                  sx={{ justifyContent: "space-between", borderRadius: 2, px: 1.25, py: 1, my: 0.25 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FolderIcon fontSize="small" />
              <Typography sx={{ fontWeight: 800 }}>{sp}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Badge color="primary" badgeContent={(sp === "All" ? totals.EXCEL : (filesBySPFiltered[sp]||[]).filter(f => f.type === "EXCEL").length)} sx={{ mr: 0.5 }}><TableChartIcon fontSize="small" /></Badge>
              <Badge color="secondary" badgeContent={(sp === "All" ? totals.POWERPOINT : (filesBySPFiltered[sp]||[]).filter(f => f.type === "POWERPOINT").length)} sx={{ mr: 0.5 }}><SlideshowIcon fontSize="small" /></Badge>
              <Badge color="default" badgeContent={(sp === "All" ? totals.REPORT : (filesBySPFiltered[sp]||[]).filter(f => f.type === "REPORT").length)}><DescriptionIcon fontSize="small" /></Badge>
            </Stack>
          </Button>
        ))}
      </Stack>
      <Divider sx={{ my: 1 }} />
      <Button fullWidth variant="text" startIcon={<ArrowUpwardIcon />} onClick={() => onJump("All")}>Back to top</Button>
    </GlassPaper>
  );
}
function SectionHeader({ sp, list }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
      <FolderIcon color="primary" />
      <Typography variant="h2" sx={{ fontSize: 18, fontWeight: 800 }}>{sp}</Typography>
      <Chip size="small" label={nf.format(list.length)} />
      <Box sx={{ ml: "auto" }}>
        <Badge color="primary" badgeContent={list.filter(f => f.type === "EXCEL").length} sx={{ mr: 1 }}><TableChartIcon fontSize="small" /></Badge>
        <Badge color="secondary" badgeContent={list.filter(f => f.type === "POWERPOINT").length} sx={{ mr: 1 }}><SlideshowIcon fontSize="small" /></Badge>
        <Badge color="default" badgeContent={list.filter(f => f.type === "REPORT").length}><DescriptionIcon fontSize="small" /></Badge>
      </Box>
    </Stack>
  );
}
function Footer() {
  return (
    <Box component="footer" role="contentinfo" sx={{ py: 4, px: 3, background: "linear-gradient(180deg, rgba(0,150,214,0.08), rgba(0,191,166,0.08))", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Zinnov Platform · <Link href="#" underline="hover">Privacy</Link> · <Link href="#" underline="hover">Terms</Link>
      </Typography>
    </Box>
  );
}

/* Main */
export default function Databases() {
  const [dark, setDark] = useState(false);
  const theme = useMemo(() => makeTheme(dark ? "dark" : "light"), [dark]);
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

  const [loading, setLoading] = useState(true);
  const [filesBySP, setFilesBySP] = useState(new Map());
  const [fallbackFlat, setFallbackFlat] = useState([]);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recent");
  const [view, setView] = useState("cards");
  const [subPractice, setSubPractice] = useState("All");
  const [density, setDensity] = useState("cozy");
  const [activeSP, setActiveSP] = useState("All");
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("z_favs") || "[]")); } catch { return new Set(); }
  });

  const sectionRefs = useRef({}); const containerRef = useRef(null);

  // ⌘/Ctrl + K focus
  useEffect(() => {
    const handler = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('global-search-input');
        if (el) el.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/files/organized`);
        if (res.ok) {
          const data = await res.json();
          if (ignore) return;
          const map = new Map();
          Object.entries(data || {}).forEach(([sp, obj]) => {
            map.set(sp, { files: Array.isArray(obj.files) ? obj.files : [], counts: obj.counts || {} });
          });
          setFilesBySP(map); setFallbackFlat([]);
        } else {
          const r2 = await fetch(`${API_BASE}/api/files?limit=2000`);
          const list = r2.ok ? await r2.json() : [];
          if (ignore) return;
          setFallbackFlat(Array.isArray(list) ? list : []); setFilesBySP(new Map());
        }
      } finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, []);

  const allFiles = useMemo(() => filesBySP.size ? [...filesBySP.values()].flatMap(v => v.files) : fallbackFlat, [filesBySP, fallbackFlat]);
  const countsPerSP = useMemo(() => {
    const map = new Map();
    for (const f of allFiles) { const k = f.sub_practice || "Unassigned"; map.set(k, (map.get(k) || 0) + 1); }
    for (const sp of SUB_PRACTICES) if (!map.has(sp)) map.set(sp, 0);
    return map;
  }, [allFiles]);

  const baseBySP = useMemo(() => {
    return filesBySP.size
      ? Object.fromEntries([...filesBySP.entries()].map(([sp, obj]) => [sp, obj.files]))
      : allFiles.reduce((acc, f) => { const k = f.sub_practice || "Unassigned"; (acc[k] ||= []).push(f); return acc; }, {});
  }, [filesBySP, allFiles]);

  const filesBySPFiltered = useMemo(() => {
    const out = {};
    for (const [sp, list] of Object.entries(baseBySP)) {
      const filtered = applyFilters(list, { query, type, sort, subPractice });
      if (filtered.length) out[sp] = filtered;
    }
    return out;
  }, [baseBySP, query, type, sort, subPractice]);

  const totals = useMemo(() => {
    const all = Object.values(filesBySPFiltered).flat();
    return {
      all: all.length,
      EXCEL: all.filter(f => f.type === "EXCEL").length,
      POWERPOINT: all.filter(f => f.type === "POWERPOINT").length,
      REPORT: all.filter(f => f.type === "REPORT").length,
    };
  }, [filesBySPFiltered]);

  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const sections = Object.keys(filesBySPFiltered);
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting).sort((a,b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) {
        const sp = vis[0].target.getAttribute("data-sp");
        if (sp && sp !== activeSP && activeSP !== "All") setActiveSP(sp);
      }
    }, { root: null, rootMargin: "-40% 0px -55% 0px", threshold: 0.01 });
    sections.forEach(sp => { const node = sectionRefs.current[sp]; if (node) obs.observe(node); });
    return () => obs.disconnect();
  }, [filesBySPFiltered, activeSP]);

  const onFav = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem("z_favs", JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const scrollToSP = (sp) => {
    if (sp === "All") { window.scrollTo({ top: 0, behavior: "smooth" }); setActiveSP("All"); return; }
    const node = sectionRefs.current[sp]; if (node) { node.scrollIntoView({ behavior: "smooth", block: "start" }); setActiveSP(sp); }
  };

  const [excelDialog, setExcelDialog] = useState({ open: false, file: null });

  const handleSaveView = () => {
    try {
      const viewObj = { query, type, sort, view, subPractice, density };
      localStorage.setItem("z_saved_view", JSON.stringify(viewObj));
      alert("View saved");
    } catch {}
  };

  useEffect(() => {
    // Optional: restore saved view
    try {
      const v = JSON.parse(localStorage.getItem("z_saved_view")||"null");
      if (v) { setQuery(v.query||""); setType(v.type||""); setSort(v.sort||"recent"); setView(v.view||"cards"); setSubPractice(v.subPractice||"All"); setDensity(v.density||"cozy"); }
    } catch {}
  }, []);

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
        <AppBar position="sticky" elevation={0} role="navigation" aria-label="Primary" sx={{
          bgcolor: "transparent",
          backgroundImage: theme.palette.mode === "light"
            ? "linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.45))"
            : "linear-gradient(180deg, rgba(20,28,36,0.75), rgba(20,28,36,0.45))",
          backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <Toolbar sx={{ gap: 1.5, minHeight: 72, px: { xs: 1.5, md: 3 } }}>
            <IconButton component={RouterLink} to="/dashboard" aria-label="Back to Dashboard"><MenuIcon /></IconButton>
            <Breadcrumbs sx={{ ml: 1, color: "text.secondary" }} aria-label="breadcrumbs">
              <Link component={RouterLink} underline="hover" to="/dashboard" color="inherit">Dashboard</Link>
              <Typography color="text.primary" fontWeight={700}>Databases</Typography>
            </Breadcrumbs>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" component={RouterLink} to="/upload" startIcon={<CloudUploadIcon />} aria-label="Upload new file" sx={{ borderRadius: 2 }}>
              Upload
            </Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth={false} sx={{ py: { xs: 2.5, md: 5 } }}>
          <Box sx={{ maxWidth: "1440px", mx: "auto", px: { xs: 1.5, md: 3 } }}>

            <CommandBar
              query={query} setQuery={setQuery}
              type={type} setType={setType}
              sort={sort} setSort={setSort}
              subPractice={subPractice} setSubPractice={setSubPractice}
              totals={totals}
              dark={dark} setDark={setDark}
              onSaveView={handleSaveView}
              density={density} setDensity={setDensity}
              view={view} setView={setView}
            />

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px 1fr" }, gap: 2, alignItems: "start" }}>
              <LeftRail filesBySPFiltered={filesBySPFiltered} totals={totals} countsPerSP={countsPerSP} activeSP={activeSP} onJump={scrollToSP} />
              <Box ref={containerRef}>
                {loading ? (
                  <Grid container spacing={1.25}>
                    {Array.from({ length: 12 }).map((_, i) => (<Grid key={i} item xs={12} sm={6} md={4} lg={3}><Skeleton variant="rounded" height={126} /></Grid>))}
                  </Grid>
                ) : Object.keys(filesBySPFiltered).length === 0 ? (
                  <GlassPaper sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>No files match</Typography>
                    <Typography color="text.secondary">Try different filters or{" "}
                      <Link component={RouterLink} to="/upload" underline="hover">upload a file</Link>.
                    </Typography>
                  </GlassPaper>
                ) : (
                  <Stack spacing={2}>
                    {Object.entries(filesBySPFiltered).sort((a,b)=>a[0].localeCompare(b[0])).map(([sp, list]) => (
                      <GlassPaper key={sp} variant="outlined" data-sp={sp} ref={(el)=>{ if (el) (sectionRefs.current[sp] = el); }}
                             sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, animation: `${appear} .45s ease-out` }}>
                        <SectionHeader sp={sp} list={list} />
                        {view === "cards" ? (
                          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 1.5, alignItems: "stretch" }}>
                            {list.filter(f => favorites.has(f.id)).map(f => (
                              <FileCardPro key={`fav-${f.id}`} file={f} favorites={favorites} onFav={onFav}
                                        onEditExcel={(file) => setExcelDialog({ open: true, file })} />
                            ))}
                            {list.filter(f => !favorites.has(f.id)).map(f => (
                              <FileCardPro key={f.id} file={f} favorites={favorites} onFav={onFav}
                                        onEditExcel={(file) => setExcelDialog({ open: true, file })} />
                            ))}
                          </Box>
                        ) : (
                          <RowsTablePro
                            files={[...list.filter(f => favorites.has(f.id)), ...list.filter(f => !favorites.has(f.id))]}
                            favorites={favorites} onFav={onFav}
                            onEditExcel={(file) => setExcelDialog({ open: true, file })}
                            density={density}
                          />
                        )}
                      </GlassPaper>
                    ))}
                  </Stack>
                )}
                <Divider sx={{ my: { xs: 3, md: 5 } }} />
                <Footer />
              </Box>
            </Box>
          </Box>
        </Container>

        <ExcelEditDialog open={excelDialog.open} file={excelDialog.file} onClose={() => setExcelDialog({ open: false, file: null })} />
      </Box>
    </ThemeProvider>
  );
}