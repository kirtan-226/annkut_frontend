// src/components/receipt-books/EditBookModal.jsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from "@mui/material";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../../api/api";

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

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value.replace(/\D/g, "") }));

  const handleSave = async () => {
    const book_no = Number(book?.book_no); // current ID
    const new_book_no = form.book_no ? Number(form.book_no) : undefined;
    const start_no = form.start_no ? Number(form.start_no) : undefined;
    const end_no = form.end_no ? Number(form.end_no) : undefined;

    if (!book_no || !start_no || !end_no) {
      alert("Book number, start and end are required.");
      return;
    }
    if (start_no > end_no) {
      alert("Start number must be less than or equal to end number.");
      return;
    }

    try {
      setSaving(true);
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/update`, {
        sevak_code: sevakCode,
        book_no,         // identify existing book
        new_book_no,     // optional change of number
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
          Editing book <strong>{book?.book_no}</strong>
        </Typography>
        <TextField
          fullWidth
          margin="dense"
          label="Book Number"
          inputMode="numeric"
          value={form.book_no}
          onChange={update("book_no")}
        />
        <TextField
          fullWidth
          margin="dense"
          label="Start Receipt Number"
          inputMode="numeric"
          value={form.start_no}
          onChange={update("start_no")}
        />
        <TextField
          fullWidth
          margin="dense"
          label="End Receipt Number"
          inputMode="numeric"
          value={form.end_no}
          onChange={update("end_no")}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditBookModal;
