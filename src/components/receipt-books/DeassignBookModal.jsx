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
  initialLastUsedNo = "0",
  endNo = 50,
  readOnly = false, // new prop
}) => {
  const [lastUsedNo, setLastUsedNo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setError("");
      setLastUsedNo(initialLastUsedNo || "0");
    }
  }, [open, initialLastUsedNo]);

  const validate = (val) => {
    if (!val) return "";
    const n = Number(val);
    if (!Number.isInteger(n) || n < 0 || n > Number(endNo || 50)) {
      return `Enter a number between 0 and ${Number(endNo || 50)}.`;
    }
    return "";
  };

  const submit = async () => {
    if (!readOnly) {
      const vErr = validate(lastUsedNo);
      if (vErr) {
        setError(vErr);
        return;
      }
    }

    try {
      setSubmitting(true);
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/deassign`, {
        sevak_code: sevakCode,
        book_no: Number(bookNo),
        last_used_no: Number(lastUsedNo),
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
          {readOnly ? (
            <>
              This book already has <strong>Last Used Receipt No. {lastUsedNo}</strong>.  
              You can’t modify it.
            </>
          ) : (
            <>
              Optionally record the <strong>last used receipt number</strong> (1–{endNo}).  
              Leave as <strong>0</strong> if none used.
            </>
          )}
        </Typography>

        <TextField
          fullWidth
          label="Last Used Receipt No."
          inputMode="numeric"
          margin="dense"
          value={lastUsedNo}
          onChange={(e) => {
            if (!readOnly) {
              const v = e.target.value.replace(/\D/g, "");
              setLastUsedNo(v);
              setError(validate(v));
            }
          }}
          helperText={error || (readOnly ? "Already finalized" : "Enter between 0–50")}
          error={Boolean(error)}
          inputProps={{ maxLength: 2, readOnly: readOnly }}
          disabled={readOnly}
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