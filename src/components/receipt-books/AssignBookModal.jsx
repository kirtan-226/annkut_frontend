import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, FormControl, InputLabel, Select, MenuItem, Button, CircularProgress
} from "@mui/material";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../../api/api";

const AssignBookModal = ({
  open,
  onClose,
  activeMandal,
  sevakId,     // for roster fetch
  sevakCode,   // for assign API
  bookNo,
  onAssigned,
}) => {
  const [roster, setRoster] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [selectedKaryakarCode, setSelectedKaryakarCode] = React.useState("");

  const loadRoster = React.useCallback(async () => {
    if (!open || !activeMandal) return;
    setLoading(true);
    setErr("");
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_sevak_by_mandal`, {
        mandal: activeMandal,
        sevak_id: sevakId,
      });
      let rows = res?.data?.sevak || res?.data?.data || [];
      if (!Array.isArray(rows)) rows = [];
      rows.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
      setRoster(rows);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to load karyakar list.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [open, activeMandal, sevakId]);

  React.useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  const submit = async () => {
    if (!selectedKaryakarCode) {
      alert("Please select a karyakar.");
      return;
    }
    try {
      setLoading(true);
      setErr("");
      await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/assign`, {
        sevak_code: sevakCode,
        book_no: Number(bookNo),
        to_user_id: String(selectedKaryakarCode), // target sevak's sevak_code
      });
      onClose?.();
      onAssigned?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to assign book.";
      setErr(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Book {bookNo} to Karyakar</DialogTitle>
      <DialogContent>
        <Box mt={1} mb={2}>
          <Typography variant="body2" color="text.secondary">
            Mandal: <strong>{activeMandal || "-"}</strong>
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={18} /> loading karyakar…
          </Box>
        ) : err ? (
          <Box color="error.main">{err}</Box>
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
        <Button onClick={onClose} color="error" variant="outlined">
          Cancel
        </Button>
        <Button onClick={submit} variant="contained" disabled={loading || !selectedKaryakarCode}>
          Assign
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignBookModal;
