import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button } from "@mui/material";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../../api/api";

const DeassignBookModal = ({
  open,
  onClose,
  bookNo,
  sevakCode,
  onDeassigned,
}) => {
  const [lastUsedNo, setLastUsedNo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setLastUsedNo("");
  }, [open]);

  const submit = async () => {
    try {
      setSubmitting(true);
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/deassign`, {
        sevak_code: sevakCode,
        book_no: Number(bookNo),
        last_used_no: lastUsedNo ? Number(lastUsedNo) : undefined,
      });
      onClose?.();
      onDeassigned?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to deassign book.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Deassign Book {bookNo}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Optionally record the last used receipt number.
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
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={submit} variant="contained" color="warning" disabled={submitting}>
          {submitting ? "Deassigning..." : "Deassign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeassignBookModal;
