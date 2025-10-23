import * as React from "react";
import { Box, Container, Paper, Typography, Stack, Link } from "@mui/material";

export default function Help() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={800} gutterBottom>Help Center</Typography>
        <Stack spacing={1.5}>
          <Typography>• Upload Excel files in .xlsx/.xls. Header row is auto-detected.</Typography>
          <Typography>• Use “Databases” to browse files by sub-practice and edit Excel sheets inline.</Typography>
          <Typography>• For big sheets, pagination uses a fast keyset cursor — it’s smooth even with 100k+ rows.</Typography>
          <Typography>• All data stays local (SQLite), no external paid services.</Typography>
          <Typography>Need more? Contact <Link href="mailto:platform@zinnov.com">platform@zinnov.com</Link>.</Typography>
        </Stack>
      </Paper>
    </Container>
  );
}
