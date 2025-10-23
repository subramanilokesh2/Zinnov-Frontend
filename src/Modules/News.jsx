// src/Modules/News.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Stack, Grid, Paper, Typography, Button, Chip, Divider, IconButton,
  TextField, Select, MenuItem, Tooltip, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, useTheme, Skeleton, Badge
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloudSyncIcon from "@mui/icons-material/CloudSync";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CategoryIcon from "@mui/icons-material/Category";
import SourceIcon from "@mui/icons-material/Source";
import TimelineIcon from "@mui/icons-material/Timeline";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/CheckCircle";
import ReportIcon from "@mui/icons-material/Report";
import RemoveIcon from "@mui/icons-material/RemoveCircleOutline";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import { jsonFetch } from "../api"; // <-- use hosted API helper

/** Colors used in Dashboard.jsx */
const ZBLUE = "#0096D6";
const ZTEAL = "#00BFA6";

/* -------------------- helpers -------------------- */
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "");
const toYMD = (d) => {
  try {
    const x = new Date(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  } catch {
    return "";
  }
};
const download = (filename, text) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* -------------------- tiny chips -------------------- */
function SentimentChip({ value }) {
  const v = (value || "neutral").toLowerCase();
  if (v === "positive")
    return <Chip icon={<CheckIcon />} label="Positive" size="small" sx={{ bgcolor: "rgba(0,191,166,.14)" }} />;
  if (v === "negative")
    return <Chip icon={<ReportIcon />} label="Negative" size="small" color="error" variant="outlined" />;
  return <Chip icon={<RemoveIcon />} label="Neutral" size="small" sx={{ bgcolor: "rgba(0,0,0,.06)" }} />;
}
function SourcePill({ source }) {
  return (
    <Chip
      size="small"
      icon={<SourceIcon sx={{ fontSize: 16 }} />}
      label={source || "Unknown"}
      sx={{ bgcolor: "rgba(0,0,0,.06)" }}
    />
  );
}

/* -------------------- main -------------------- */
export default function News() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Filters
  const [sentiment, setSentiment] = useState("all");
  const [source, setSource] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [catSel, setCatSel] = useState(new Set());
  const [group, setGroup] = useState("timeline"); // 'timeline' | 'category' | 'source'

const [active, setActive] = useState(null);
const searchRef = useRef(null);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setErr("");
    const ac = new AbortController();
    try {
      const res = await jsonFetch(`/api/news?limit=300`, { signal: ac.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.name !== "AbortError") {
        setErr(e?.message || "Failed to load news");
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
    return () => ac.abort();
  }, []);

  const refreshBatch = useCallback(async () => {
    setLoading(true);
    setErr("");
    const ac = new AbortController();
    try {
      const res = await jsonFetch(`/api/news/refresh-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
        signal: ac.signal,
      });
      if (!res.ok) throw new Error(`Refresh HTTP ${res.status}`);
      await loadSaved();
    } catch (e) {
      if (e?.name !== "AbortError") {
        setErr(e?.message || "Failed to fetch latest news");
        setLoading(false);
      }
    }
    return () => ac.abort();
  }, [loadSaved]);

  const analyze = useCallback(async () => {
    setLoading(true);
    setErr("");
    const ac = new AbortController();
    try {
      const res = await jsonFetch(`/api/news/analyze`, { method: "POST", signal: ac.signal });
      if (!res.ok) throw new Error(`Analyze HTTP ${res.status}`);
      await loadSaved();
    } catch (e) {
      if (e?.name !== "AbortError") {
        setErr(e?.message || "Failed to analyze");
        setLoading(false);
      }
    }
    return () => ac.abort();
  }, [loadSaved]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!cancel) await loadSaved();
    })();
    return () => { cancel = true; };
  }, [loadSaved]);

  // keyboard shortcuts (/, r, g, esc)
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (k === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (!e.metaKey && !e.ctrlKey && k === "r") {
        e.preventDefault();
        loadSaved();
      }
      if (!e.metaKey && !e.ctrlKey && k === "g") {
        e.preventDefault();
        setGroup((prev) => (prev === "timeline" ? "category" : prev === "category" ? "source" : "timeline"));
      }
      if (k === "escape") searchRef.current?.blur();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loadSaved]);

  // facets
  const sources = useMemo(() => {
    const s = new Set();
    items.forEach((a) => a?.source && s.add(a.source));
    return ["all", ...Array.from(s).sort()];
  }, [items]);

  const allCategories = useMemo(() => {
    const s = new Set();
    items.forEach((a) => (a?.insight?.categories || []).forEach((c) => s.add(c)));
    return Array.from(s).sort();
  }, [items]);

  // filtering
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((a) => {
      const matchesTerm = !term
        ? true
        : [a.title, a.source, a.summary, ...(a.tags || []), ...((a.insight?.categories) || [])]
            .filter(Boolean)
            .some((s) => String(s).toLowerCase().includes(term));

      const sVal = (a?.insight?.sentiment || "neutral").toLowerCase();
      const matchesSent = sentiment === "all" ? true : sVal === sentiment;
      const matchesSrc = source === "all" ? true : (a?.source || "") === source;

      const d = a.published_at ? new Date(a.published_at) : null;
      const inFrom = from ? (d ? d >= new Date(from + "T00:00:00") : false) : true;
      const inTo = to ? (d ? d <= new Date(to + "T23:59:59") : false) : true;

      const sel = catSel.size ? (a?.insight?.categories || []).some((c) => catSel.has(c)) : true;

      return matchesTerm && matchesSent && matchesSrc && inFrom && inTo && sel;
    });
  }, [items, q, sentiment, source, from, to, catSel]);

  // stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const uniqSources = new Set(filtered.map((a) => a.source).filter(Boolean)).size;
    const uniqCats = new Set(filtered.flatMap((a) => a?.insight?.categories || [])).size;

    const dates = filtered
      .map((a) => (a.published_at ? new Date(a.published_at).getTime() : null))
      .filter(Boolean)
      .sort((a, b) => a - b);
    const span =
      dates.length > 1
        ? `${new Date(dates[0]).toLocaleDateString()} → ${new Date(dates[dates.length - 1]).toLocaleDateString()}`
        : dates.length === 1
        ? new Date(dates[0]).toLocaleDateString()
        : "—";

    const sentCount = { positive: 0, neutral: 0, negative: 0 };
    filtered.forEach((a) => {
      const s = (a?.insight?.sentiment || "neutral").toLowerCase();
      if (s === "positive") sentCount.positive++;
      else if (s === "negative") sentCount.negative++;
      else sentCount.neutral++;
    });

    return { total, uniqSources, uniqCats, span, sentCount };
  }, [filtered]);

  // grouping
  const groups = useMemo(() => {
    if (group === "timeline") {
      const map = new Map();
      filtered.forEach((a) => {
        const key = a.published_at ? toYMD(a.published_at) : "Undated";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(a);
      });
      const keys = Array.from(map.keys()).sort((a, b) => {
        if (a === "Undated") return 1;
        if (b === "Undated") return -1;
        return new Date(b) - new Date(a);
      });
      return keys.map((k) => ({ key: k, items: map.get(k) }));
    }
    if (group === "category") {
      const map = new Map();
      filtered.forEach((a) => {
        const cats = a?.insight?.categories?.length ? a.insight.categories : ["Uncategorized"];
        cats.forEach((c) => {
          if (!map.has(c)) map.set(c, []);
          map.get(c).push(a);
        });
      });
      const keys = Array.from(map.keys()).sort((a, b) =>
        a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)
      );
      return keys.map((k) => ({ key: k, items: map.get(k) }));
    }
    const map = new Map();
    filtered.forEach((a) => {
      const key = a?.source || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    const keys = Array.from(map.keys()).sort((a, b) =>
      a === "Unknown" ? 1 : b === "Unknown" ? -1 : a.localeCompare(b)
    );
    return keys.map((k) => ({ key: k, items: map.get(k) }));
  }, [filtered, group]);

  const toggleCat = (c) => {
    setCatSel((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["id", "title", "source", "published_at", "url", "sentiment", "categories", "tags", "summary", "analyst_notes"];
    const rows = filtered.map((a) => [
      a.id ?? "",
      (a.title ?? "").replace(/\n/g, " ").replace(/"/g, '""'),
      a.source ?? "",
      a.published_at ?? "",
      a.url ?? "",
      a?.insight?.sentiment ?? "",
      (a?.insight?.categories || []).join("|"),
      (a.tags || []).join("|"),
      (a.summary || "").replace(/\n/g, " ").replace(/"/g, '""'),
      (a?.insight?.consultant_notes || "").replace(/\n/g, " ").replace(/"/g, '""'),
    ]);
    const csv = headers.join(",") + "\n" + rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    download(`news_export_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  /* -------------------- UI -------------------- */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          theme.palette.mode === "light"
            ? `radial-gradient(1200px 600px at 12% -10%, ${ZBLUE}1A, transparent),
               radial-gradient(900px 500px at 88% 0%, ${ZTEAL}1A, transparent),
               linear-gradient(0deg, #f8fbff, #f3f6fb)`
            : `radial-gradient(1200px 600px at 12% -10%, ${ZBLUE}20, transparent),
               radial-gradient(900px 500px at 88% 0%, ${ZTEAL}20, transparent),
               linear-gradient(0deg, #0b1116, #0d141c)`,
        pb: 4,
      }}
    >
      <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 1.5, md: 3 }, pt: { xs: 2, md: 4 } }}>
        {/* Header / actions */}
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 2, md: 2.5 },
            mb: 2,
            borderRadius: 4,
            background:
              theme.palette.mode === "light"
                ? "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.9))"
                : "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "flex-start", md: "center" }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <NewspaperIcon color="primary" />
              <Typography variant="h5" fontWeight={900}>
                Market Intelligence Feed
              </Typography>
            </Stack>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Tooltip title="Refresh saved (R)">
                <span>
                  <Button onClick={loadSaved} disabled={loading} variant="outlined" startIcon={<RefreshIcon />}>
                    Refresh
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Fetch latest from sources">
                <span>
                  <Button onClick={refreshBatch} disabled={loading} variant="contained" startIcon={<CloudSyncIcon />}>
                    Fetch Latest
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Auto-categorize & sentiment">
                <span>
                  <Button
                    onClick={analyze}
                    disabled={loading || !items.length}
                    color="secondary"
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                  >
                    Auto-Categorize
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title="Download CSV">
                <span>
                  <Button onClick={exportCSV} disabled={!filtered.length} variant="outlined" startIcon={<FileDownloadIcon />}>
                    Export CSV
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Filters */}
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={1.25} alignItems="center">
            <Grid item xs={12} md={5}>
              <Box sx={{ position: "relative" }}>
                <TextField
                  fullWidth
                  inputRef={searchRef}
                  placeholder="Search by keyword, source, summary… ( / )"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, opacity: 0.7 }} />,
                    endAdornment: q ? (
                      <IconButton size="small" onClick={() => setQ("")} aria-label="Clear search">
                        <CloseIcon />
                      </IconButton>
                    ) : null,
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                Sentiment
              </Typography>
              <Select fullWidth size="small" value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="neutral">Neutral</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={6} md={2}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                Source
              </Typography>
              <Select fullWidth size="small" value={source} onChange={(e) => setSource(e.target.value)}>
                {sources.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={6} md={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                From
              </Typography>
              <TextField fullWidth size="small" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Grid>
            <Grid item xs={6} md={1.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                To
              </Typography>
              <TextField fullWidth size="small" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Grid>
          </Grid>

          {!!allCategories.length && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                Categories:
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap">
                {allCategories.map((c) => {
                  const on = catSel.has(c);
                  return (
                    <Chip
                      key={c}
                      label={c}
                      onClick={() => toggleCat(c)}
                      color={on ? "primary" : "default"}
                      variant={on ? "filled" : "outlined"}
                      sx={{ borderRadius: 999 }}
                    />
                  );
                })}
                {catSel.size > 0 && (
                  <Button onClick={() => setCatSel(new Set())} size="small">
                    Clear
                  </Button>
                )}
              </Stack>
            </Stack>
          )}
        </Paper>

        {/* Stats & grouping */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} alignItems={{ xs: "stretch", md: "center" }} mb={1.5}>
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: 3,
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(120px, 1fr))",
              gap: 1,
              flex: 1,
            }}
          >
            {loading ? (
              <Skeleton height={40} />
            ) : (
              <>
                <KPI label="Articles" value={stats.total} />
                <KPI label="Sources" value={stats.uniqSources} />
                <KPI label="Categories" value={stats.uniqCats} />
                <KPI label="Date Span" value={stats.span} />
              </>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 0.5, borderRadius: 3 }}>
            <Tabs
              value={group}
              onChange={(_, v) => setGroup(v)}
              variant="fullWidth"
              sx={{
                "& .MuiTabs-indicator": { height: 3, backgroundColor: theme.palette.primary.main },
              }}
            >
              <Tab value="timeline" icon={<TimelineIcon />} label="Timeline" />
              <Tab value="category" icon={<CategoryIcon />} label="Category" />
              <Tab value="source" icon={<SourceIcon />} label="Source" />
            </Tabs>
          </Paper>

          <Paper
            variant="outlined"
            sx={{
              p: 1,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: { md: 260 },
              justifyContent: "space-between",
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
              Sentiment
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Badge color="success" variant="dot">
                <Chip size="small" label={stats.sentCount.positive} />
              </Badge>
              <Badge color="default" variant="dot">
                <Chip size="small" label={stats.sentCount.neutral} />
              </Badge>
              <Badge color="error" variant="dot">
                <Chip size="small" label={stats.sentCount.negative} />
              </Badge>
            </Stack>
          </Paper>
        </Stack>

        {/* Errors */}
        {err && (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 1.5,
              borderRadius: 3,
              bgcolor: theme.palette.mode === "light" ? "#fff5f5" : "rgba(255,0,0,.08)",
              borderColor: theme.palette.mode === "light" ? "#fecaca" : "rgba(255,255,255,.12)",
              color: theme.palette.mode === "light" ? "#7f1d1d" : "#ffcdd2",
            }}
          >
            <Typography fontWeight={800}>Problem:</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {err}
            </Typography>
            <Button size="small" onClick={loadSaved}>
              Try again
            </Button>
          </Paper>
        )}

        {/* content */}
        {loading ? (
          <Grid container spacing={1.25}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} key={i}>
                <Skeleton variant="rounded" height={92} />
              </Grid>
            ))}
          </Grid>
        ) : !groups.length ? (
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, textAlign: "center" }}>
            <Typography color="text.secondary">No news found for the current filters.</Typography>
          </Paper>
        ) : (
          groups.map((g) => (
            <Box key={g.key} sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={800}>
                  {g.key}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {g.items.length} item{g.items.length > 1 ? "s" : ""}
                </Typography>
              </Stack>

              <Grid container spacing={1.25}>
                {g.items.map((a, idx) => {
                  const date = a.published_at ? new Date(a.published_at) : null;
                  const cats = a.insight?.categories?.length ? a.insight.categories : [];
                  const tags = Array.isArray(a.tags) ? a.tags : [];
                  const key = a.id ?? a.url ?? `${a.title ?? "untitled"}-${idx}`;
                  return (
                    <Grid item xs={12} key={key}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 3,
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 1,
                          alignItems: "center",
                          "&:hover": { borderColor: `${theme.palette.primary.main}66` },
                        }}
                      >
                        <Box>
                          <Typography
                            variant="subtitle1"
                            fontWeight={900}
                            sx={{ cursor: "pointer" }}
                            onClick={() => setActive(a)}
                          >
                            {a.title || "Untitled"}
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25, flexWrap: "wrap" }}>
                            {a.source && <SourcePill source={a.source} />}
                            <SentimentChip value={a.insight?.sentiment} />
                            {date && (
                              <Typography variant="caption" color="text.secondary">
                                {date.toLocaleString()}
                              </Typography>
                            )}
                          </Stack>
                          {a.summary && (
                            <Typography variant="body2" sx={{ mt: 0.75, color: "text.primary" }}>
                              {a.summary}
                            </Typography>
                          )}
                          {(cats.length || tags.length) && (
                            <Stack direction="row" spacing={0.5} sx={{ mt: 0.75 }} flexWrap="wrap">
                              {cats.map((t, i) => (
                                <Chip key={`c-${i}`} label={t} size="small" color="primary" variant="outlined" />
                              ))}
                              {tags.map((t, i) => (
                                <Chip key={`t-${i}`} label={t} size="small" sx={{ bgcolor: "rgba(0,0,0,.04)" }} />
                              ))}
                            </Stack>
                          )}
                          {a.insight?.consultant_notes && (
                            <Paper variant="outlined" sx={{ p: 1, mt: 1, borderRadius: 2 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={900}>
                                Analyst notes
                              </Typography>
                              <Typography variant="body2">{a.insight.consultant_notes}</Typography>
                            </Paper>
                          )}
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                          {a.url && (
                            <Button
                              size="small"
                              variant="outlined"
                              endIcon={<OpenInNewIcon />}
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </Button>
                          )}
                          <Button size="small" onClick={() => setActive(a)}>
                            Details
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))
        )}

        {/* details dialog */}
        <Dialog open={!!active} onClose={() => setActive(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 0.5 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  {active?.title || "Untitled"}
                </Typography>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  {active?.source && <SourcePill source={active.source} />}
                  <SentimentChip value={active?.insight?.sentiment} />
                  {active?.published_at && (
                    <Typography variant="caption" color="text.secondary">
                      {fmtDateTime(active.published_at)}
                    </Typography>
                  )}
                </Stack>
              </Box>
              <IconButton onClick={() => setActive(null)} aria-label="Close">
                <CloseIcon />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent dividers>
            {active?.url && (
              <Stack direction="row" sx={{ mb: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<OpenInNewIcon />}
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Source
                </Button>
              </Stack>
            )}

            {active?.summary && (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  Summary
                </Typography>
                <Typography sx={{ mb: 2 }}>{active.summary}</Typography>
              </>
            )}

            {(active?.insight?.categories?.length || (active?.tags || []).length) ? (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  Topics
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ mb: 2 }} flexWrap="wrap">
                  {(active?.insight?.categories || []).map((t, i) => (
                    <Chip key={`mc-${i}`} label={t} size="small" color="primary" variant="outlined" />
                  ))}
                  {(active?.tags || []).map((t, i) => (
                    <Chip key={`mt-${i}`} label={t} size="small" sx={{ bgcolor: "rgba(0,0,0,.05)" }} />
                  ))}
                </Stack>
              </>
            ) : null}

            {active?.insight?.consultant_notes && (
              <>
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  Analyst notes
                </Typography>
                <Paper variant="outlined" sx={{ p: 1, mt: 0.5, borderRadius: 2 }}>
                  <Typography>{active.insight.consultant_notes}</Typography>
                </Paper>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActive(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

/* -------------------- mini KPI tile -------------------- */
function KPI({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: ".04em", fontWeight: 900 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ lineHeight: 1.1 }} fontWeight={900}>
        {value}
      </Typography>
    </Stack>
  );
}
