// src/pages/ReceiptBooks.jsx
import React from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from "@mui/material";
import { BACKEND_ENDPOINT } from "../api/api";
import Header from "../components/Header";

export default function ReceiptBooks() {
  const sevak = JSON.parse(localStorage.getItem("sevakDetails")) || {};
  const role = sevak?.role || "";
  const sevakCode = sevak?.sevak_code || "";
  const isAdmin = role === "Admin";
  const isSanchalak = role === "Sanchalak";
  
  // ---------- state ----------
  const [mandals, setMandals] = React.useState([]);
  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // UI mode: "mandals" (grid) or "books" (table)
  const [mode, setMode] = React.useState(isAdmin ? "mandals" : "books");

  // selected mandal (for Admin)
  const [selectedMandal, setSelectedMandal] = React.useState("");
  const [selectedMandalKey, setSelectedMandalKey] = React.useState("");

  // search
  const [qBooks, setQBooks] = React.useState("");
  const [qMandal, setQMandal] = React.useState("");

  const norm = (s) => String(s || "").trim().toLowerCase();

  // ---------- fetchers ----------
  const fetchMandals = React.useCallback(async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_mandal_list`, {
        sevak_id: sevak?.sevak_id,
      });
      const arr =
        res?.data?.mandal_array ||
        res?.data?.mandals ||
        res?.data?.data ||
        [];
      setMandals(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error("Fetch mandals error:", e);
      setMandals([]);
    }
  }, [sevak?.sevak_id]);
//   console.log(fetchMandals);

  // IMPORTANT: uses your response shape { all_books: [...] }
  const fetchBooksServer = React.useCallback(
    async ({ mandal, sanchalak, code }) => {
      setError("");
      setLoading(true);
      try {
        const payload = {
          sevak_code: sanchalak || sevakCode,
        };
        if (mandal) payload.mandal = mandal;
        // if (sanchalak) payload.sanchalak = sanchalak;

        const res = await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/list`, payload);

        // Your API returns { all_books: [...] }
        const rows = res?.data?.all_books || [];
        setBooks(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("Fetch books error:", e);
        setBooks([]);
        setError("Failed to load books.");
      } finally {
        setLoading(false);
      }
    },
    [sevakCode]
  );

  React.useEffect(() => {
    if (isAdmin) fetchMandals();
    if (isSanchalak) {
      setMode("books");
      fetchBooksServer({ code: sevakCode });
    }
  }, [isAdmin, isSanchalak, sevakCode, fetchMandals, fetchBooksServer]);

  // ---------- derived ----------
  const filteredMandals = React.useMemo(() => {
    const needle = qMandal.trim().toLowerCase();
    if (!needle) return mandals;
    return (mandals || []).filter((m) =>
      JSON.stringify(m || {}).toLowerCase().includes(needle)
    );
  }, [mandals, qMandal]);
  console.log(filteredMandals);

  const filteredBooks = React.useMemo(() => {
    const needle = qBooks.trim().toLowerCase();
    if (!needle) return books;
    return (books || []).filter((b) =>
      JSON.stringify(b || {}).toLowerCase().includes(needle)
    );
  }, [books, qBooks]);

  // ---------- handlers ----------
  const handleCardClick = async (m) => {
    const mandalName = m?.name || m?.mandal_name || "";
    const sanchalakCode = m?.sanchalak || "";
    setSelectedMandal(mandalName);
    setSelectedMandalKey(norm(mandalName));
    setMode("books");
    await fetchBooksServer({
      mandal: mandalName,
      sanchalak: sanchalakCode,
      code: sevakCode, // admin's code as per your spec
    });
  };

  const handleBackToMandals = () => {
    setSelectedMandal("");
    setSelectedMandalKey("");
    setQBooks("");
    setBooks([]);
    setMode("mandals");
  };

  const ownerChip = (row) => {
    const userName = row?.issued_to_name;
    const mandalName = row?.mandal_name;
    if (userName) return <Chip size="small" label={`Sevak: ${userName}`} color="primary" />;
    if (mandalName) return <Chip size="small" label={`Mandal: ${mandalName}`} color="success" />;
    return <Chip size="small" label="Unassigned" variant="outlined" />;
  };

  const formatRange = (row) => {
    const s = Number(row?.start_no || 0);
    const e = Number(row?.end_no || 0);
    if (!s && !e) return "-";
    return `${row.start_no} – ${row.end_no || "-"}`;
    // if you intend 1..50 etc., just print as given strings
  };

  // ---------- render ----------
  return (
    <>
      <Header />

      <Box p={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5">
            {mode === "mandals" ? "Mandals" : "Receipt Books"}
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={() => {
                  if (mode === "mandals" && isAdmin) {
                    fetchMandals();
                  } else {
                    if (isSanchalak) {
                      fetchBooksServer({ code: sevakCode });
                    } else if (isAdmin && selectedMandal) {
                      const m = (mandals || []).find(
                        (x) => norm(x?.name || x?.mandal_name) === selectedMandalKey
                      );
                      if (m) handleCardClick(m);
                    }
                  }
                }}
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise"></i>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* ADMIN: full-page mandal cards */}
        {isAdmin && mode === "mandals" && (
          <>
            <Box display="flex" gap={1} mb={2}>
              <TextField
                size="small"
                placeholder="Search mandals…"
                value={qMandal}
                onChange={(e) => setQMandal(e.target.value)}
                sx={{ width: 360 }}
              />
            </Box>

            <Grid container spacing={2}>
              {(filteredMandals || []).map((m, i) => {
                const name = m?.name || m?.mandal_name || "Mandal";
                const xetra = m?.mandal_xetra || "";
                const sanchalak = m?.sanchalak_name || "";

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={`${name}-${i}`}>
                    <Card
                      variant="outlined"
                      onClick={() => handleCardClick(m)}
                      sx={{
                        cursor: "pointer",
                        borderColor: "divider",
                        transition: "box-shadow 120ms ease",
                        "&:hover": { boxShadow: 3 },
                      }}
                    >
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {xetra || "—"}
                        </Typography>
                        {sanchalak && (
                          <Box mt={1}>
                            <Chip size="small" label={`Sanchalak: ${sanchalak}`} />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}

              {filteredMandals?.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                    {loading ? "Loading mandals…" : "No mandals found"}
                  </Paper>
                </Grid>
              )}
            </Grid>
          </>
        )}

        {/* BOOKS: full-page table */}
        {mode === "books" && (
          <>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                {isAdmin && (
                  <Button
                    variant="outlined"
                    onClick={handleBackToMandals}
                    startIcon={<i className="bi bi-arrow-left"></i>}
                  >
                    Back to mandals
                  </Button>
                )}
                {selectedMandal && (
                  <Chip variant="outlined" label={`Mandal: ${selectedMandal}`} />
                )}
              </Box>

              <TextField
                size="small"
                placeholder="Search books by number, sevak…"
                value={qBooks}
                onChange={(e) => setQBooks(e.target.value)}
                sx={{ width: 360 }}
              />
            </Box>

            {error && (
              <Box mb={1} color="error.main">
                {error}
              </Box>
            )}

            <TableContainer component={Paper} sx={{ maxHeight: 650 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Book No</TableCell>
                    <TableCell>Range</TableCell>
                    <TableCell>Issued On</TableCell>
                    <TableCell>Current Holder</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(filteredBooks || []).map((row, idx) => (
                    <TableRow key={row?.id || row?.book_no || idx} hover>
                      <TableCell>{row?.book_no ?? "-"}</TableCell>
                      <TableCell>{formatRange(row)}</TableCell>
                      <TableCell>
                        {row?.issued_on ? new Date(row.issued_on).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell>{ownerChip(row)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredBooks?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        {loading ? "Loading books…" : "No books found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </>
  );
}
