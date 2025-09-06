// src/components/receipt-books/AddBookModal.jsx
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button } from "@mui/material";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../../api/api";

const AddBookModal = ({
  open,
  onClose,
  activeMandal,
  sevakCode,
  onAdded,
}) => {
  const [form, setForm] = React.useState({ book_no: "", start_no: "" });
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setForm({ book_no: "", start_no: "" }); // no end_no field here
  }, [open]);

  const update = (k) => (e) =>
    setForm((p) => ({ ...p, [k]: e.target.value.replace(/\D/g, "") }));

  const submit = async () => {
    const book_no = Number(form.book_no);
    const start_no = Number(form.start_no);

    if (!book_no || !start_no) {
      alert("Please enter Book Number and Start Receipt Number.");
      return;
    }
    if (!activeMandal) {
      alert("Select a mandal first.");
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/assign`, {
        sevak_code: sevakCode,
        book_no,
        start_no,
        end_no: null, // always null at creation
        to_mandal_name: activeMandal,
      });
      onClose?.();
      onAdded?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to add book.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={submitting}>
          {submitting ? "Saving..." : "Add Book"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBookModal;
