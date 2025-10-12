// src/pages/ReceiptBooks.jsx
import React from "react";
import axios from "axios";
import {
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import Header from "../components/Header";
import { BACKEND_ENDPOINT } from "../api/api";

// Presentational
import MandalGrid from "../components/receipt-books/MandalGrid";
import BookTable from "../components/receipt-books/BookTable";

// Modals
import AssignBookModal from "../components/receipt-books/AssignBookModal";
import DeassignBookModal from "../components/receipt-books/DeassignBookModal";
import AddBookModal from "../components/receipt-books/AddBookModal";
import EditBookModal from "../components/receipt-books/EditBookModal";

export default function ReceiptBooks() {
  const sevak = JSON.parse(localStorage.getItem("sevakDetails")) || {};
  const role = sevak?.role_code || "";

  // Be tolerant to different storage shapes
  const sevakCode =
    sevak?.sevak_code ||
    sevak?.sevak_id ||
    sevak?.sevakId ||
    "";

  const isAdmin = role === "ADMIN";
  const isSanchalak = role === "SANCHALAK";
  const user_mandal = sevak?.mandal_name || "";
  // console.log(role);
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
  const [deassignInitialLastUsed, setDeassignInitialLastUsed] = React.useState("");
  const [deassignEndNo, setDeassignEndNo] = React.useState(50);
  const [deassignReadOnly, setDeassignReadOnly] = React.useState(false);

  // Deassign modal
  const [deassignOpen, setDeassignOpen] = React.useState(false);
  const [deassignBookNo, setDeassignBookNo] = React.useState(null);

  // Edit modal (Admin)
  const [editOpen, setEditOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState(null);

  // Delete confirm (Admin)
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingBook, setDeletingBook] = React.useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

  // Add Book modal
  const [addOpen, setAddOpen] = React.useState(false);

  // ---------- helpers ----------
  const norm = (s) => String(s || "").trim().toLowerCase();
  const safe = (s) => String(s || "").trim();

  const activeMandal = React.useMemo(
    () => safe(selectedMandal || user_mandal),
    [selectedMandal, user_mandal]
  );

  // ---------- fetchers ----------
  const fetchMandals = React.useCallback(async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_mandal_list`, {
        sevak_id: sevak?.sevak_id, // this endpoint expects sevak_id
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
    async ({ mandal, code } = {}) => {
      setError("");
      setLoading(true);
      try {
        const payload = {
          // permissions are checked against the actor; always use the logged-in user
          sevak_code: code || sevakCode,
        };
        if (mandal) payload.mandal = mandal;

        const res = await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/list`, payload);

        // accept either shape from backend
        const rows =
          (Array.isArray(res?.data?.all_books) && res.data.all_books) ||
          (Array.isArray(res?.data?.books) && res.data.books) ||
          [];

        // Helpful logs (leave them for now)
        console.log("[LIST] payload:", payload);
        console.log("[LIST] response:", res?.data);
        console.log("[LIST] rows:", rows);

        setBooks(rows);
      } catch (e) {
        console.error("Fetch books error:", e);
        const msg = e?.response?.data?.message || "Failed to load books.";
        setError(msg);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    },
    [sevakCode]
  );

  // initial load flows
  React.useEffect(() => {
    if (isAdmin) fetchMandals();
    if (isSanchalak) {
      setMode("books");
      setQBooks(""); // ensure search doesn't hide results
      fetchBooksServer({ code: sevakCode }); // mandal is derived server-side
    }
  }, [isAdmin, isSanchalak, sevakCode, fetchMandals, fetchBooksServer]);

  // whenever we land on "books", (re)fetch for current context
  React.useEffect(() => {
    if (mode !== "books") return;
    if (isAdmin && !selectedMandal) return; // admin needs to pick a mandal first
    setQBooks(""); // clear search so results aren't filtered out
    fetchBooksServer({ mandal: selectedMandal || undefined, code: sevakCode });
  }, [mode, selectedMandal, isAdmin, sevakCode, fetchBooksServer]);

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

  // ---------- page handlers ----------
  const handleCardClick = async (m) => {
    const mandalName = m?.name || m?.mandal_name || "";
    console.log("[Mandal click]", mandalName, m);
    setSelectedMandal(safe(mandalName));
    setSelectedMandalKey(norm(mandalName));
    setQBooks(""); // clear search
    setMode("books"); // books effect above will fetch
  };

  const handleBackToMandals = () => {
    setSelectedMandal("");
    setSelectedMandalKey("");
    setQBooks("");
    setBooks([]);
    setMode("mandals");
  };

  const refresh = () => {
    if (mode === "mandals" && isAdmin) {
      fetchMandals();
    } else if (mode === "books") {
      fetchBooksServer({ mandal: selectedMandal || undefined, code: sevakCode });
    }
  };

  // Admin: open edit/delete
  const openEditModal = (row) => {
    setEditingBook(row);
    setEditOpen(true);
  };
  const closeEditModal = () => {
    setEditOpen(false);
    setEditingBook(null);
  };

  const openDeleteConfirm = (row) => {
    setDeletingBook(row);
    setDeleteOpen(true);
  };
  const closeDeleteConfirm = () => {
    setDeleteOpen(false);
    setDeletingBook(null);
  };

  const doDeleteBook = async () => {
    if (!deletingBook?.book_no) return;
    try {
      setDeleteSubmitting(true);
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/delete`, {
        sevak_code: sevakCode,
        book_no: Number(deletingBook.book_no),
      });
      closeDeleteConfirm();
      await fetchBooksServer({ mandal: activeMandal, code: sevakCode });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to delete book.";
      alert(msg);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // row helpers
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

  const TOTAL_PER_BOOK = 50;

 const deriveInitialLastUsed = (row) => {
  const last = Number(row?.last_used_no || 0);
  const next = Number(row?.next_receipt_no || 0);
  const end  = Number(row?.end_no || 50);

  let guess = 0;
  if (last > 0)       guess = last;     // prefer server's last_used_no
  else if (next > 1)  guess = next - 1; // else derive from next

  if (guess < 1) guess = 0;             // keep empty if unused
  if (guess > end) guess = end;         // clamp to end
  return guess ? String(guess) : "";
};

  const formatRange = React.useCallback((row) => {
    // Treat end_no as "last used receipt number" once a book is deassigned.
    const lastUsed = Number(row?.end_no ?? 0);

    // For Sanchalak view:
    // - Default: 1–25
    // - If a lastUsed exists and it's < 25, show "lastUsed – 25"
    if (isSanchalak) {
      if (lastUsed > 0 && lastUsed < TOTAL_PER_BOOK) {
        return `${lastUsed} – ${TOTAL_PER_BOOK}`;
      }
      return `1 – ${TOTAL_PER_BOOK}`;
    }

    // For Admin or other roles, keep the explicit backend range if present.
    const s = Number(row?.start_no || 1);
    const e = Number(row?.end_no || TOTAL_PER_BOOK);
    return `${s} – ${e}`;
  }, [isSanchalak]);

  // ---------- modals open/close ----------
  const openAssignModal = async (book_no) => {
    if (!activeMandal) {
      alert("No mandal selected/available.");
      return;
    }
    setAssignBookNo(book_no);
    setAssignOpen(true);
  };
  const closeAssignModal = () => {
    setAssignOpen(false);
    setAssignBookNo(null);
  };

  const openDeassignModal = (book_no) => {
    setDeassignBookNo(book_no);

    const row = (books || []).find(b => String(b?.book_no) === String(book_no));
    if (row) {
      const lastUsed = row?.last_used_no !== null ? String(row.last_used_no) : "0";
      setDeassignInitialLastUsed(lastUsed);
      setDeassignEndNo(Number(row?.end_no || 50));
      setDeassignReadOnly(row?.last_used_no !== null); // make readonly if already exists
    } else {
      setDeassignInitialLastUsed("0");
      setDeassignEndNo(50);
      setDeassignReadOnly(false);
    }

    setDeassignOpen(true);
  };
  const closeDeassignModal = () => {
    setDeassignOpen(false);
    setDeassignBookNo(null);
  };

  const openAddModal = () => {
    if (!activeMandal) {
      alert("Select a mandal first.");
      return;
    }
    setAddOpen(true);
  };
  const closeAddModal = () => setAddOpen(false);

  // mark a book as submitted (Sanchalak action)
  const submitMarkSubmitted = React.useCallback(
    async (book_no) => {
      if (!book_no) return;
      if (!window.confirm(`Mark book ${book_no} as submitted?`)) return;

      try {
        setLoading(true);
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
        setLoading(false);
      }
    },
    [sevakCode, activeMandal, fetchBooksServer]
  );

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
              <IconButton onClick={refresh} disabled={loading}>
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

            {/* Make sure MandalGrid calls the SAME prop name: onClickMandal(mandalObj) */}
            <MandalGrid
              mandals={filteredMandals}
              loading={loading}
              onClickMandal={handleCardClick}
            />
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

            <BookTable
              rows={filteredBooks}
              isAdmin={isAdmin}
              isSanchalak={isSanchalak}
              loading={loading}
              ownerChip={ownerChip}
              formatRange={formatRange}
              onAssign={(bookNo) => openAssignModal(bookNo)}
              onDeassign={(bookNo) => openDeassignModal(bookNo)}
              onSubmitBook={(bookNo) => submitMarkSubmitted(bookNo)}
              onEdit={openEditModal}
              onDelete={openDeleteConfirm}
            />
          </>
        )}
      </Box>

      {/* Modals */}
      <AssignBookModal
        open={assignOpen}
        onClose={closeAssignModal}
        activeMandal={activeMandal}
        sevakId={sevak?.sevak_id}        // roster fetch needs sevak_id
        sevakCode={sevakCode}            // assign API needs sevak_code
        bookNo={assignBookNo}
        onAssigned={() => fetchBooksServer({ mandal: activeMandal, code: sevakCode })}
      />

      <DeassignBookModal
        open={deassignOpen}
        onClose={closeDeassignModal}
        bookNo={deassignBookNo}
        sevakCode={sevakCode}
        onDeassigned={() => fetchBooksServer({ mandal: activeMandal, code: sevakCode })}
        initialLastUsedNo={deassignInitialLastUsed}
        endNo={deassignEndNo}
        readOnly={deassignReadOnly}
      />

      <AddBookModal
        open={addOpen}
        onClose={closeAddModal}
        activeMandal={activeMandal}
        sevakCode={sevakCode}
        onAdded={() => fetchBooksServer({ mandal: activeMandal, code: sevakCode })}
      />

      <EditBookModal
        open={editOpen}
        onClose={closeEditModal}
        sevakCode={sevakCode}
        book={editingBook}
        onSaved={() => fetchBooksServer({ mandal: activeMandal, code: sevakCode })}
      />

      {/* Delete Confirm (Admin) */}
      <Dialog open={deleteOpen} onClose={closeDeleteConfirm} fullWidth maxWidth="xs">
        <DialogTitle>Delete Book {deletingBook?.book_no}</DialogTitle>
        <DialogContent>
          This will remove the receipt book record. Are you sure?
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteConfirm} color="inherit">Cancel</Button>
          <Button
            onClick={doDeleteBook}
            color="error"
            variant="contained"
            disabled={deleteSubmitting}
          >
            {deleteSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
