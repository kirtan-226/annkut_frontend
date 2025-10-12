import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from "@mui/material";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../../api/api";

const CAP = 50;

const EditBookModal = ({ open, onClose, sevakCode, book, onSaved }) => {
  const [form, setForm] = React.useState({ book_no: "", start_no: "", end_no: "" });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open && book) {
      setForm({
        book_no: String(book?.book_no ?? ""),
        start_no: String(book?.start_no ?? ""),
        end_no: String(book?.end_no ?? ""),
      });
    }
  }, [open, book]);

  const onlyDigits = (v) => v.replace(/[^\d]/g, "");
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: onlyDigits(e.target.value) }));

  const handleSave = async () => {
    const current_book_no = Number(book?.book_no);
    const new_book_no = form.book_no ? Number(form.book_no) : undefined;

    let start_no = form.start_no ? Number(form.start_no) : undefined;
    let end_no   = form.end_no ? Number(form.end_no) : undefined;

    if (!current_book_no) return alert("Existing book number missing.");
    if (!start_no || !end_no) return alert("Start and End are required.");

    start_no = clamp(start_no, 1, CAP);
    end_no   = clamp(end_no, 1, CAP);
    if (start_no > end_no) return alert("Start number must be ≤ end number (1..50).");

    try {
      setSaving(true);
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/update`, {
        sevak_code: sevakCode,
        book_no: current_book_no,
        new_book_no,
        start_no,
        end_no,
      });
      onClose?.();
      onSaved?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to update book.";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Book</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Editing book <strong>{book?.book_no}</strong> (Receipts 1–50)
        </Typography>
        <TextField fullWidth margin="dense" label="Book Number" inputMode="numeric" value={form.book_no} onChange={update("book_no")} />
        <TextField fullWidth margin="dense" label="Start Receipt Number (1–50)" inputMode="numeric" value={form.start_no} onChange={update("start_no")} />
        <TextField fullWidth margin="dense" label="End Receipt Number (1–50)" inputMode="numeric" value={form.end_no} onChange={update("end_no")} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBookModal;
