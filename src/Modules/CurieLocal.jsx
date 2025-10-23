// src/Modules/CurieLocal.jsx
import * as React from "react";
import { useState } from "react";
import { Paper, Stack, Typography, Button, TextField, Divider, Chip, Box } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SummarizeIcon from "@mui/icons-material/Summarize";
import CompareIcon from "@mui/icons-material/Compare";
import SearchIcon from "@mui/icons-material/Search";

const API_BASE =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_BASE) ||
  process.env.REACT_APP_API_BASE ||
  "http://localhost:5000";

export default function CurieLocal({ user }) {
  const [brief, setBrief] = useState([]);
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState("");
  const [dossier, setDossier] = useState(null);
  const [askQ, setAskQ] = useState("");
  const [askA, setAskA] = useState([]);
  const [cmp, setCmp] = useState({ a: "Infosys", b: "Accenture", theme: "GenAI" });
  const [cmpOut, setCmpOut] = useState(null);
  const email = user?.email || "user@zinnov.com";

  const run = async (fn) => { setLoading(true); try { await fn(); } finally { setLoading(false); } };

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 4, display: "grid", gap: 16 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <AutoAwesomeIcon color="primary" />
        <Typography variant="h6" fontWeight={900}>Curie — Local (Ollama)</Typography>
        <Chip size="small" label="Free / On-device" sx={{ ml: 1 }} />
      </Stack>

      <Stack spacing={1}>
        <Typography fontWeight={800}>Morning Brief</Typography>
        <Button
          variant="contained"
          disabled={loading}
          onClick={() => run(async () => {
            const r = await fetch(`${API_BASE}/api/ai/morning-brief`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email })
            });
            const j = await r.json(); setBrief(j.bullets || []);
          })}
        >Generate</Button>
        {!!brief.length && <Box sx={{ pl: 1 }}>{brief.map((b,i)=><Typography key={i}>• {b}</Typography>)}</Box>}
      </Stack>

      <Divider />

      <Stack spacing={1.25}>
        <Typography fontWeight={800}>Company Dossier</Typography>
        <Stack direction="row" spacing={1}>
          <TextField size="small" placeholder="Company (e.g., Infosys)" value={company} onChange={e=>setCompany(e.target.value)} />
          <Button variant="outlined" startIcon={<SummarizeIcon/>}
            disabled={loading || !company.trim()}
            onClick={() => run(async () => {
              const r = await fetch(`${API_BASE}/api/ai/dossier?company=${encodeURIComponent(company)}`);
              setDossier(await r.json());
            })}
          >Build</Button>
        </Stack>
        {dossier && (
          <Box sx={{ pl: 1 }}>
            <Typography fontWeight={800} sx={{ mb: .5 }}>{dossier.company}</Typography>
            {(dossier.quick_take||[]).map((b,i)=><Typography key={i}>• {b}</Typography>)}
            {!!(dossier.themes||[]).length && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap:"wrap" }}>
                {dossier.themes.map((t,i)=><Chip key={i} label={t} />)}
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
            size="small" fullWidth placeholder='e.g., "AI + BFSI in APAC, last 14d — key signals?"'
            value={askQ} onChange={e=>setAskQ(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
          />
          <Button disabled={loading || !askQ.trim()} onClick={() => run(async () => {
            const r = await fetch(`${API_BASE}/api/ai/ask`, {
              method:"POST", headers:{ "Content-Type":"application/json" },
              body: JSON.stringify({ q: askQ })
            });
            const j = await r.json(); setAskA(j.answer || []);
          })}>Ask</Button>
        </Stack>
        {!!askA.length && <Box sx={{ pl: 1 }}>{askA.map((b,i)=><Typography key={i}>• {b}</Typography>)}</Box>}
      </Stack>

      <Divider />

      <Stack spacing={1.25}>
        <Typography fontWeight={800}>Compare & Contrast</Typography>
        <Stack direction={{ xs:"column", sm:"row" }} spacing={1}>
          <TextField size="small" label="A" value={cmp.a} onChange={e=>setCmp(v=>({...v, a:e.target.value}))}/>
          <TextField size="small" label="B" value={cmp.b} onChange={e=>setCmp(v=>({...v, b:e.target.value}))}/>
          <TextField size="small" label="Theme" value={cmp.theme} onChange={e=>setCmp(v=>({...v, theme:e.target.value}))}/>
          <Button variant="outlined" startIcon={<CompareIcon/>}
            disabled={loading}
            onClick={() => run(async () => {
              const r = await fetch(`${API_BASE}/api/ai/compare?a=${encodeURIComponent(cmp.a)}&b=${encodeURIComponent(cmp.b)}&theme=${encodeURIComponent(cmp.theme)}`);
              setCmpOut(await r.json());
            })}>Compare</Button>
        </Stack>
        {cmpOut && (
          <Box sx={{ pl: 1 }}>
            <Typography variant="body2" color="text.secondary">Parity</Typography>
            {(cmpOut.parity||[]).map((p,i)=><Typography key={i}>• {p}</Typography>)}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Differences</Typography>
            {(cmpOut.difference||[]).map((d,i)=><Typography key={i}>• {d.point} ({d.side})</Typography>)}
            {cmpOut.summary && <Typography sx={{ mt: 1 }}>{cmpOut.summary}</Typography>}
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
