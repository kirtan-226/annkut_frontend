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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { BACKEND_ENDPOINT } from "../api/api";
import Header from "../components/Header";

export default function ReceiptBooks() {
  const sevak = JSON.parse(localStorage.getItem("sevakDetails")) || {};
  const role = sevak?.role || "";
  const sevakCode = sevak?.sevak_code || ""; // backend expects sevak_code
  const isAdmin = role === "Admin";
  const isSanchalak = role === "Sanchalak";
  const user_mandal = sevak?.mandal_name || "";

  // ---------- state ----------
  const [mandals, setMandals] = React.useState([]);
  const [books, setBooks] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // UI mode
  const [mode, setMode] = React.useState(isAdmin ? "mandals" : "books");

  // selected mandal (for Admin)
  const [selectedMandal, setSelectedMandal] = React.useState("");
  const [selectedMandalKey, setSelectedMandalKey] = React.useState("");

  // search
  const [qBooks, setQBooks] = React.useState("");
  const [qMandal, setQMandal] = React.useState("");

  // Assign modal
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignBookNo, setAssignBookNo] = React.useState(null);

  // Deassign modal (Sanchalak)
  const [deassignOpen, setDeassignOpen] = React.useState(false);
  const [deassignBookNo, setDeassignBookNo] = React.useState(null);
  const [lastUsedNo, setLastUsedNo] = React.useState("");
  const [deassignSubmitting, setDeassignSubmitting] = React.useState(false);
  const [submitSubmitting, setSubmitSubmitting] = React.useState(false);

  // IMPORTANT: we store sevak_code (string) for the target karyakar
  const [selectedKaryakarCode, setSelectedKaryakarCode] = React.useState("");

  const [rosterByMandal, setRosterByMandal] = React.useState({});
  const [rosterLoading, setRosterLoading] = React.useState(false);
  const [rosterError, setRosterError] = React.useState("");

  // Add Book modal (Admin)
  const [addOpen, setAddOpen] = React.useState(false);
  const [newBook, setNewBook] = React.useState({ book_no: "", start_no: "", end_no: "" });
  const [addSubmitting, setAddSubmitting] = React.useState(false);

  // ---------- helpers ----------
  const keyOf = (s) => String(s || "").trim().toLowerCase();
  const norm = (s) => String(s || "").trim().toLowerCase();
  const safe = (s) => String(s || "").trim();

  // single source of truth for the mandal being viewed
  const activeMandal = React.useMemo(
    () => safe(selectedMandal || user_mandal),
    [selectedMandal, user_mandal]
  );

  // ---------- fetchers ----------
  const fetchMandals = React.useCallback(async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_mandal_list`, {
        sevak_id: sevak?.sevak_id, // your backend expects sevak_id here
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

  const fetchBooksServer = React.useCallback(
    async ({ mandal, sanchalak, code }) => {
      setError("");
      setLoading(true);
      try {
        const payload = {
          sevak_code: sanchalak || sevakCode,
        };
        if (mandal) payload.mandal = mandal;

        const res = await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/list`, payload);
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

  const filteredBooks = React.useMemo(() => {
    const needle = qBooks.trim().toLowerCase();
    if (!needle) return books;
    return (books || []).filter((b) =>
      JSON.stringify(b || {}).toLowerCase().includes(needle)
    );
  }, [books, qBooks]);

  // ---------- roster (karyakar) fetch ----------
  const fetchKaryakarRoster = React.useCallback(
    async (mandalName) => {
      const cacheKey = keyOf(mandalName);
      if (!cacheKey) return;

      // cache hit?
      if (Array.isArray(rosterByMandal[cacheKey])) return;

      setRosterLoading(true);
      setRosterError("");
      try {
        const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_sevak_by_mandal`, {
          mandal: mandalName,
          sevak_id: sevak?.sevak_id,
        });

        let rows = res?.data?.sevak || res?.data?.data || [];
        if (!Array.isArray(rows)) rows = [];
        rows.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

        setRosterByMandal((prev) => ({ ...prev, [cacheKey]: rows }));
      } catch (e) {
        console.error("Roster fetch error:", e);
        const msg = e?.response?.data?.message || e?.message || "Failed to load karyakar list.";
        setRosterError(msg);
      } finally {
        setRosterLoading(false);
      }
    },
    [rosterByMandal, sevak?.sevak_id]
  );

  const roster = rosterByMandal[keyOf(activeMandal)] || [];

  // ---------- assign handlers ----------
  const openAssignModal = async (book_no) => {
    if (!activeMandal) {
      alert("No mandal selected/available.");
      return;
    }
    setAssignBookNo(book_no);
    setSelectedKaryakarCode("");
    setAssignOpen(true);
    await fetchKaryakarRoster(activeMandal);
  };

  const closeAssignModal = () => {
    setAssignOpen(false);
    setAssignBookNo(null);
    setSelectedKaryakarCode("");
  };

  const submitAssignToSevak = async () => {
    if (!selectedKaryakarCode) {
      alert("Please select a karyakar.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      // backend expects to_user_id = sevak_code string
      const body = {
        sevak_code: sevakCode, // who assigns
        book_no: Number(assignBookNo),
        to_user_id: String(selectedKaryakarCode),
      };

      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/assign`, body);

      await fetchBooksServer({ mandal: activeMandal, code: sevakCode });
      closeAssignModal();
    } catch (e) {
      console.error("Assign error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to assign book. Check permissions and payload.";
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Deassign + Submit (Sanchalak) ----------
  const openDeassignModal = (book_no) => {
    setDeassignBookNo(book_no);
    setLastUsedNo("");
    setDeassignOpen(true);
  };

  const closeDeassignModal = () => {
    setDeassignOpen(false);
    setDeassignBookNo(null);
    setLastUsedNo("");
  };

  const submitDeassign = async () => {
    try {
      setDeassignSubmitting(true);
      setError("");

      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/deassign`, {
        sevak_code: sevakCode,
        book_no: Number(deassignBookNo),
        last_used_no: lastUsedNo ? Number(lastUsedNo) : undefined,
      });

      closeDeassignModal();
      await fetchBooksServer({ mandal: activeMandal, code: sevakCode });
    } catch (e) {
      console.error("Deassign error:", e);
      const msg = e?.response?.data?.message || e?.message || "Failed to deassign book.";
      setError(msg);
      alert(msg);
    } finally {
      setDeassignSubmitting(false);
    }
  };

  const submitMarkSubmitted = async (book_no) => {
    if (!window.confirm(`Mark book ${book_no} as submitted?`)) return;
    try {
      setSubmitSubmitting(true);
      setError("");

      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/submit`, {
        sevak_code: sevakCode,
        book_no: Number(book_no),
      });

      await fetchBooksServer({ mandal: activeMandal, code: sevakCode });
    } catch (e) {
      console.error("Submit error:", e);
      const msg = e?.response?.data?.message || e?.message || "Failed to submit book.";
      setError(msg);
      alert(msg);
    } finally {
      setSubmitSubmitting(false);
    }
  };

  // ---------- Add Book (Admin) ----------
  const openAddModal = () => {
    if (!activeMandal) {
      alert("Select a mandal first.");
      return;
    }
    setNewBook({ book_no: "", start_no: "", end_no: "" });
    setAddOpen(true);
  };
  const closeAddModal = () => setAddOpen(false);

  const submitAddBook = async () => {
    const book_no = Number(newBook.book_no);
    const start_no = Number(newBook.start_no);
    const end_no = Number(newBook.end_no);

    if (!book_no || !start_no || !end_no) {
      alert("Please enter all fields.");
      return;
    }
    if (start_no > end_no) {
      alert("Start number must be less than or equal to end number.");
      return;
    }
    if (!activeMandal) {
      alert("Select a mandal first.");
      return;
    }

    try {
      setAddSubmitting(true);
      setError("");

      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/assign`, {
        sevak_code: sevakCode,
        book_no,
        start_no,
        end_no,
        to_mandal_name: activeMandal,
      });

      closeAddModal();
      await fetchBooksServer({ mandal: activeMandal, code: sevakCode });
    } catch (e) {
      console.error("Add book error:", e);
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Failed to add book. Check permissions and payload.";
      setError(msg);
      alert(msg);
    } finally {
      setAddSubmitting(false);
    }
  };

  // ---------- handlers ----------
  const mandalNameSafe = (s) => String(s || "").trim();

  const handleCardClick = async (m) => {
    const mandalName = m?.name || m?.mandal_name || "";
    const sanchalakCode = m?.sanchalak || "";
    setSelectedMandal(mandalNameSafe(mandalName));
    setSelectedMandalKey(norm(mandalName));
    setMode("books");
    await fetchBooksServer({
      mandal: mandalName,
      sanchalak: sanchalakCode,
      code: sevakCode,
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
    const isSubmitted =
      (typeof row?.status === "string" && row.status.toLowerCase() === "submitted") ||
      !!row?.submitted_at;

    if (isSubmitted) {
      return <Chip size="small" label="Submitted" variant="outlined" />;
    }

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
  };

  // ---------- render ----------
  return (
    <>
      <Header />

      <Box p={2}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5">Receipt Books</Typography>

          <Box display="flex" alignItems="center" gap={1}>
            {/* Admin-only add book when inside a mandal */}
            {isAdmin && mode === "books" && activeMandal && (
              <Button variant="contained" onClick={openAddModal}>
                Add Book
              </Button>
            )}

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

        {/* ADMIN: mandal cards */}
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

        {/* BOOKS: table */}
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
                {activeMandal && <Chip variant="outlined" label={`Mandal: ${activeMandal}`} />}
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
                    {(isAdmin || isSanchalak) && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(filteredBooks || []).map((row, idx) => {
                    const isSubmitted =
                      (typeof row?.status === "string" && row.status.toLowerCase() === "submitted") ||
                      !!row?.submitted_at;

                    return (
                      <TableRow key={row?.id || row?.book_no || idx} hover>
                        <TableCell>{row?.book_no ?? "-"}</TableCell>
                        <TableCell>{formatRange(row)}</TableCell>
                        <TableCell>
                          {row?.issued_on ? new Date(row.issued_on).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>{ownerChip(row)}</TableCell>

                        {(isAdmin || isSanchalak) && (
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => openAssignModal(row?.book_no)}
                              disabled={loading || !row?.book_no || isSubmitted}
                              sx={{ mr: 1 }}
                            >
                              Assign
                            </Button>

                            {/* Sanchalak extra actions when a sevak holds the book */}
                            {isSanchalak && (row?.issued_to_user_id || row?.issued_to_name) && !isSubmitted && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => openDeassignModal(row?.book_no)}
                                  disabled={loading || submitSubmitting}
                                  sx={{ mr: 1 }}
                                >
                                  Deassign
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => submitMarkSubmitted(row?.book_no)}
                                  disabled={loading || deassignSubmitting}
                                >
                                  Submit
                                </Button>
                              </>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}

                  {filteredBooks?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
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

      {/* Assign Modal */}
      <Dialog open={assignOpen} onClose={closeAssignModal} fullWidth maxWidth="sm">
        <DialogTitle>Assign Book {assignBookNo} to Karyakar</DialogTitle>
        <DialogContent>
          <Box mt={1} mb={2}>
            <Typography variant="body2" color="text.secondary">
              Mandal: <strong>{activeMandal || "-"}</strong>
            </Typography>
          </Box>

          {rosterLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={18} /> loading karyakar…
            </Box>
          ) : rosterError ? (
            <Box color="error.main">{rosterError}</Box>
          ) : (
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="karyakar-select-label">Select Karyakar</InputLabel>
              <Select
                labelId="karyakar-select-label"
                label="Select Karyakar"
                value={selectedKaryakarCode}
                onChange={(e) => setSelectedKaryakarCode(e.target.value)}
              >
                {roster.map((u) => (
                  <MenuItem key={u?.sevak_code || u?.id} value={u?.sevak_code}>
                    {u?.name || "(no name)"} {u?.sevak_code ? `— ${u.sevak_code}` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAssignModal} color="error" variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={submitAssignToSevak}
            variant="contained"
            disabled={!selectedKaryakarCode || rosterLoading || loading}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deassign Modal */}
      <Dialog open={deassignOpen} onClose={closeDeassignModal} fullWidth maxWidth="sm">
        <DialogTitle>Deassign Book {deassignBookNo}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mandal: <strong>{activeMandal || "-"}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Last Used Receipt No. (optional)"
            inputMode="numeric"
            margin="dense"
            value={lastUsedNo}
            onChange={(e) => setLastUsedNo(e.target.value.replace(/\D/g, ""))}
            helperText="If provided, we'll record the last receipt used."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeassignModal} color="inherit">Cancel</Button>
          <Button
            onClick={submitDeassign}
            variant="contained"
            color="warning"
            disabled={deassignSubmitting}
          >
            {deassignSubmitting ? "Deassigning..." : "Deassign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Book Modal (Admin only) */}
      <Dialog open={addOpen} onClose={closeAddModal} fullWidth maxWidth="sm">
        <DialogTitle>Add Book to Mandal</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mandal: <strong>{activeMandal || "-"}</strong>
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Book Number"
            inputMode="numeric"
            value={newBook.book_no}
            onChange={(e) => setNewBook((p) => ({ ...p, book_no: e.target.value.replace(/\D/g, "") }))}
          />
          <TextField
            fullWidth
            margin="dense"
            label="Start Receipt Number"
            inputMode="numeric"
            value={newBook.start_no}
            onChange={(e) => setNewBook((p) => ({ ...p, start_no: e.target.value.replace(/\D/g, "") }))}
          />
          <TextField
            fullWidth
            margin="dense"
            label="End Receipt Number"
            inputMode="numeric"
            value={newBook.end_no}
            onChange={(e) => setNewBook((p) => ({ ...p, end_no: e.target.value.replace(/\D/g, "") }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddModal} color="error" variant="outlined">
            Cancel
          </Button>
          <Button onClick={submitAddBook} variant="contained" disabled={addSubmitting}>
            {addSubmitting ? "Saving..." : "Add Book"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
