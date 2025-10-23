// src/Modules/CurieLocal.jsx
import * as React from "react";
import { useState } from "react";
import { Paper, Stack, Typography, Button, TextField, Divider, Chip, Box, Alert } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CompareIcon from "@mui/icons-material/Compare";
import SearchIcon from "@mui/icons-material/Search";
import { jsonFetch } from "../api"; // <-- use shared API helper

export default function CurieLocal({ user }) {
  const [brief, setBrief] = useState([]);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [dossier, setDossier] = useState(null);
  const [askQ, setAskQ] = useState("");
  const [askA, setAskA] = useState([]);
  const [cmp, setCmp] = useState({ a: "Infosys", b: "Accenture", theme: "GenAI" });
  const [cmpOut, setCmpOut] = useState(null);
  const [err, setErr] = useState("");
  const email = user?.email || "user@zinnov.com";

  const run = async (fn) => {
    setErr("");
    setLoading(true);
    try {
      await fn();
    } catch (e) {
      setErr(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, display: "grid", gap: 16 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" fontWeight={900}>Curie — Local (Ollama)</Typography>
        <Chip size="small" label="Free / On-device" sx={{ ml: 1 }} />
      </Stack>

      {err && <Alert severity="error">{err}</Alert>}

      <Stack spacing={1}>
        <Typography fontWeight={800}>Morning Brief</Typography>
        <Button
          variant="contained"
          disabled={loading}
          onClick={() =>
            run(async () => {
              const r = await jsonFetch(`/api/ai/morning-brief`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              const j = await r.json();
              setBrief(j.bullets || []);
            })
          }
        >
          {loading ? "Generating…" : "Generate"}
        </Button>
        {!!brief.length && (
          <Box sx={{ pl: 1 }}>
            {brief.map((b, i) => (
              <Typography key={i}>• {b}</Typography>
            ))}
          </Box>
        )}
      </Stack>

      <Divider />

      <Stack spacing={1.25}>
        <Typography fontWeight={800}>Company Dossier</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Company (e.g., Infosys)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={<SummarizeIcon />}
            disabled={loading || !company.trim()}
            onClick={() =>
              run(async () => {
                const r = await jsonFetch(`/api/ai/dossier?company=${encodeURIComponent(company)}`);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                setDossier(await r.json());
              })
            }
          >
            {loading ? "Building…" : "Build"}
          </Button>
        </Stack>
        {dossier && (
          <Box sx={{ pl: 1 }}>
            <Typography fontWeight={800} sx={{ mb: 0.5 }}>
              {dossier.company}
            </Typography>
            {(dossier.quick_take || []).map((b, i) => (
              <Typography key={i}>• {b}</Typography>
            ))}
            {!!(dossier.themes || []).length && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {dossier.themes.map((t, i) => (
                  <Chip key={i} label={t} />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Stack>

      <Divider />

      <Stack spacing={1.25}>
        <Typography fontWeight={800}>Ask (Grounded)</Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            fullWidth
            placeholder='e.g., "AI + BFSI in APAC, last 14d — key signals?"'
            value={askQ}
            onChange={(e) => setAskQ(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
          />
          <Button
            disabled={loading || !askQ.trim()}
            onClick={() =>
              run(async () => {
                const r = await jsonFetch(`/api/ai/ask`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ q: askQ }),
                });
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                const j = await r.json();
                setAskA(j.answer || []);
              })
            }
          >
            {loading ? "Asking…" : "Ask"}
          </Button>
        </Stack>
        {!!askA.length && (
          <Box sx={{ pl: 1 }}>
            {askA.map((b, i) => (
              <Typography key={i}>• {b}</Typography>
            ))}
          </Box>
        )}
      </Stack>

      <Divider />

      <Stack spacing={1.25}>
        <Typography fontWeight={800}>Compare & Contrast</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField
            size="small"
            label="A"
            value={cmp.a}
            onChange={(e) => setCmp((v) => ({ ...v, a: e.target.value }))}
          />
          <TextField
            size="small"
            label="B"
            value={cmp.b}
            onChange={(e) => setCmp((v) => ({ ...v, b: e.target.value }))}
          />
          <TextField
            size="small"
            label="Theme"
            value={cmp.theme}
            onChange={(e) => setCmp((v) => ({ ...v, theme: e.target.value }))}
          />
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            disabled={loading}
            onClick={() =>
              run(async () => {
                const url = `/api/ai/compare?a=${encodeURIComponent(cmp.a)}&b=${encodeURIComponent(
                  cmp.b
                )}&theme=${encodeURIComponent(cmp.theme)}`;
                const r = await jsonFetch(url);
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                setCmpOut(await r.json());
              })
            }
          >
            {loading ? "Comparing…" : "Compare"}
          </Button>
        </Stack>
        {cmpOut && (
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Parity
            </Typography>
            {(cmpOut.parity || []).map((p, i) => (
              <Typography key={i}>• {p}</Typography>
            ))}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Differences
            </Typography>
            {(cmpOut.difference || []).map((d, i) => (
              <Typography key={i}>• {d.point} ({d.side})</Typography>
            ))}
            {cmpOut.summary && <Typography sx={{ mt: 1 }}>{cmpOut.summary}</Typography>}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
