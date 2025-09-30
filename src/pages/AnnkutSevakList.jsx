// src/pages/AnnkutSevakList.jsx
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { BACKEND_ENDPOINT } from "../api/api";
import Header from "../components/Header";
import AddAnnkutSevakModal from "../components/AddAnnkutSevakModal";
import EditSevakModal from "../components/EditSevakModal";

import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableContainer,
  TableRow,
  TableCell,
  IconButton,
  TextField,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tooltip,
  Typography,
} from "@mui/material";

export default function AnnkutSevakList() {
  // ---------- identity / role ----------
  const sevak = JSON.parse(localStorage.getItem("sevakDetails")) || {};
  const role = sevak?.role_code || "";
  const sevakId = sevak?.sevak_id;

  const leadershipRoles = [
    "Nirikshak",
    "Nirdeshak",
    "Sanyojak",
    "Sant Nirdeshak",
    "Admin",
  ];

  const isAdmin = role === "ADMIN";
  const isSanchalak = role === "SANCHALAK";
  const isLeader =
    isAdmin || leadershipRoles.some((r) => role?.toLowerCase().includes(r.toLowerCase()));

  // ---------- state ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // stats
  const [formTarget, setFormTarget] = useState(null);

  // mandals (grid view)
  const [mandals, setMandals] = useState([]);
  const [qMandal, setQMandal] = useState("");

  // sevaks (table view)
  const [sevaks, setSevaks] = useState([]);
  const [qSevak, setQSevak] = useState("");

  // mode: "mandals" | "sevaks"
  const initialMode = isLeader ? "mandals" : "sevaks";
  const [mode, setMode] = useState(initialMode);

  // selected mandal context
  const [selectedMandal, setSelectedMandal] = useState("");
  const norm = (s) => String(s || "").trim().toLowerCase();

  // modals
  const [showAddAnnkutSevak, setShowAddAnnkutSevak] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedSevakRow, setSelectedSevakRow] = useState(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ---------- fetchers (plain functions; no deps, no re-creations) ----------
  async function fetchTargetDetailsOnce() {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}seva/get_seva_count`, {
        sevak_id: sevakId,
      });
      setFormTarget(res.data || {});
    } catch (err) {
      console.error("Error fetching target count", err);
    }
  }

  async function fetchMandalsOnce() {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_mandal_list`, {
        sevak_id: sevakId,
      });
      const arr =
        res?.data?.mandal_array ||
        res?.data?.mandals ||
        res?.data?.data ||
        [];
      setMandals(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.error("Failed to fetch mandals:", e);
      setMandals([]);
    }
  }

  async function fetchSevaksForScope({ mandalName } = {}) {
    setError("");
    setLoading(true);
    try {
      let payload = {};

      if (isSanchalak) {
        payload.sevak_id = sevakId;
      } else if (isLeader && mandalName) {
        payload.mandal = mandalName || '';
        payload.sevak_id = sevakId; // tolerate either key
      } else {
        payload.sevak_id = sevakId;
      }

      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_sevak`, payload);

      // 1) pull the sevaks array (your response uses `sevak`)
      let rows = res?.data?.sevak || res?.data?.sevaks || res?.data?.data || [];

      // 2) keep the sanchalak label from the wrapper if you want to show it
      const sanchalakLabel = res?.data?.["Sanchalak Name"];
      // if (sanchalakLabel && !selectedMandal) {
      //   // optional: show who you fetched under
      //   setSelectedMandal(sanchalakLabel);
      // }

      // 3) Only client-filter by mandal if rows actually carry mandal_name
      if (
        isLeader &&
        mandalName &&
        Array.isArray(rows) &&
        rows.length > 0 &&
        Object.prototype.hasOwnProperty.call(rows[0], "mandal_name")
      ) {
        const needle = norm(mandalName);
        rows = rows.filter(
          (r) => norm(r?.mandal_name) === needle
        );
      }

      setSevaks(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error("Error fetching sevaks:", e);
      setSevaks([]);
      setError("Failed to load sevaks.");
    } finally {
      setLoading(false);
    }
  }

  // ---------- run ONCE on mount ----------
  useEffect(() => {
    (async () => {
      await fetchTargetDetailsOnce();
      if (isLeader) {
        await fetchMandalsOnce(); // leaders see mandals grid
      } else {
        await fetchSevaksForScope(); // sanchalak sees own sevaks
      }
    })();
    // EMPTY deps => runs exactly once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- derived ----------
  const filteredMandals = useMemo(() => {
    const needle = qMandal.trim().toLowerCase();
    if (!needle) return mandals;
    return (mandals || []).filter((m) =>
      JSON.stringify(m || {}).toLowerCase().includes(needle)
    );
  }, [mandals, qMandal]);

  const filteredSevaks = useMemo(() => {
    const needle = qSevak.trim().toLowerCase();
    if (!needle) return sevaks;
    return (sevaks || []).filter((s) =>
      JSON.stringify(s || {}).toLowerCase().includes(needle)
    );
  }, [sevaks, qSevak]);

  const sum = (rows, field) =>
    rows.reduce((acc, r) => acc + (parseInt(r?.[field] ?? 0, 10) || 0), 0);

  const groupedByXetra = useMemo(() => {
    const arr = Array.isArray(filteredMandals) ? filteredMandals : [];
    const map = new Map();
    for (const item of arr) {
      const key = String(item?.mandal_xetra ?? "").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    for (const [, rows] of map) {
      rows.sort((a, b) =>
        (a?.mandal_name || a?.name || "").localeCompare(b?.mandal_name || b?.name || "")
      );
    }
    return Array.from(map.entries()).sort((a, b) =>
      (a[0] || "").localeCompare(b[0] || "", undefined, { numeric: true, sensitivity: "base" })
    );
  }, [filteredMandals]);

  // ---------- handlers (explicit user actions only) ----------
  async function handleRefresh() {
    if (mode === "mandals" && isLeader) {
      await fetchMandalsOnce();
    } else if (mode === "sevaks") {
      if (isLeader && selectedMandal) {
        await fetchSevaksForScope({ mandalName: selectedMandal });
      } else {
        await fetchSevaksForScope();
      }
    }
  }

  async function handleMandalCardClick(m) {
    const mandalName = m?.name || m?.mandal_name || "";
    setSelectedMandal(mandalName);
    setMode("sevaks");
    await fetchSevaksForScope({ mandalName });
  }

  function handleBackToMandals() {
    setSelectedMandal("");
    setQSevak("");
    setSevaks([]);
    setMode("mandals");
    // do NOT refetch automatically — only on Refresh or when user expects it
  }

  function handleEdit(row) {
    setSelectedSevakRow(row);
    setEditModal(true);
  }

  // optional delete flow (kept)
  function handleDeletePrompt(id) {
    setItemToDelete(id);
    setOpenConfirmDialog(true);
  }
  async function handleConfirmDelete() {
    try {
      // await axios.post(`${BACKEND_ENDPOINT}sevak/delete_sevak`, { sevak_id: itemToDelete });
      if (isLeader && selectedMandal) await fetchSevaksForScope({ mandalName: selectedMandal });
      else await fetchSevaksForScope();
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setOpenConfirmDialog(false);
      setItemToDelete(null);
    }
  }

  // ---------- render ----------
  return (
    <>
      <Header />

      <Box p={2}>
        {/* Top bar */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5">
            {mode === "mandals" ? "Mandals" : "Annkut Sevaks"}
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            {(isSanchalak || isAdmin) && (
              <Button
                variant="outlined"
                onClick={() => setShowAddAnnkutSevak(true)}
                startIcon={<i className="bi bi-person-plus"></i>}
              >
                Add Annkut Sevak
              </Button>
            )}

            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={loading}>
                <i className="bi bi-arrow-clockwise"></i>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Stats boxes */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Target
              </Typography>
              <Typography variant="h6">
                {formTarget?.total_target ?? 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Row with 4 cards */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Filled Forms
              </Typography>
              <Typography variant="h6">
                {formTarget?.total_filled_form ?? 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                ₹500 Seva
              </Typography>
              <Typography variant="h6">
                {formTarget?.seva_five_hundered ?? 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                ₹1000
              </Typography>
              <Typography variant="h6">
                {formTarget?.seva_thousand ?? 0}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Other
              </Typography>
              <Typography variant="h6">
                {formTarget?.seva_other ?? 0}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Leader/Admin: Mandals grid */}
        {isLeader && mode === "mandals" && (
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

            {groupedByXetra.length === 0 && (
              <Paper sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
                {loading ? "Loading mandals…" : "No mandals found"}
              </Paper>
            )}

            {groupedByXetra.map(([xetra, rows]) => (
              <Box key={xetra || "no-xetra"} mb={3}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}
                >
                  {xetra || "(No Xetra)"}
                </Typography>

                <Grid container spacing={2}>
                  {rows.map((m, i) => {
                    const name = m?.name || m?.mandal_name || "Mandal";
                    const sanchalak = m?.sanchalak_name || "";
                    const target = m?.mandal_target || 0;
                    const filled_form = m?.mandal_filled_form || 0;
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={`${name}-${i}`}>
                        <Card
                          variant="outlined"
                          onClick={() => handleMandalCardClick(m)}
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
                            {target && (
                              <Box mt={1}>
                                <Chip size="small" label={`Target: ${target}`} />
                              </Box>
                            )}
                            {filled_form && (
                              <Box mt={1}>
                                <Chip size="small" label={`Filled Form: ${filled_form}`} />
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>

                <Box mt={1}>
                  <Paper sx={{ p: 1.5, display: "flex", gap: 3, justifyContent: "center" }}>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      Subtotal Filled: {sum(rows, "mandal_filled_form")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                      Subtotal Target: {sum(rows, "mandal_target")}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            ))}
          </>
        )}

        {/* Sevaks table */}
        {mode === "sevaks" && (
          <>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                {isLeader && (
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
                placeholder="Search sevaks by name, id, phone…"
                value={qSevak}
                onChange={(e) => setQSevak(e.target.value)}
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
                    <TableCell>Sevak Id</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Mandal</TableCell>
                    <TableCell>Form Filled</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Previous Target</TableCell>
                    <TableCell>Phone</TableCell>
                    {(isSanchalak || isAdmin) && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(filteredSevaks || []).map((row, idx) => (
                    <TableRow key={row?.id || row?.sevak_id || idx} hover>
                      <TableCell>{row?.sevak_id ?? "-"}</TableCell>
                      <TableCell>{row?.name ?? "-"}</TableCell>
                      <TableCell>{row?.mandal_name ?? "-"}</TableCell>
                      <TableCell>{row?.filled_form ?? 0}</TableCell>
                      <TableCell>{row?.sevak_target ?? 0}</TableCell>
                      <TableCell>{row?.previous_target ?? 0}</TableCell>
                      <TableCell>{row?.phone_number ?? "-"}</TableCell>
                      {(isSanchalak || isAdmin) && (
                        <TableCell>
                          <IconButton color="warning" onClick={() => handleEdit(row)} sx={{ mr: 1 }}>
                            <i className="bi fs-6 bi-pencil"></i>
                          </IconButton>
                          {/* Optional:
                          <IconButton color="error" onClick={() => handleDeletePrompt(row?.sevak_id)}>
                            <i className="bi fs-6 bi-trash"></i>
                          </IconButton>
                          */}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}

                  {filteredSevaks?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        {loading ? "Loading sevaks…" : "No sevaks found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>

      {/* Delete confirmation (optional) */}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete this item?</p>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setOpenConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleConfirmDelete} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modals */}
      {showAddAnnkutSevak && (
        <AddAnnkutSevakModal modal={showAddAnnkutSevak} setModal={setShowAddAnnkutSevak} />
      )}

      {editModal && (
        <EditSevakModal
          modal={editModal}
          setModal={setEditModal}
          sevakData={selectedSevakRow}
          sevak_id={sevakId}
          refreshData={() =>
            isLeader && selectedMandal
              ? fetchSevaksForScope({ mandalName: selectedMandal })
              : fetchSevaksForScope()
          }
        />
      )}
    </>
  );
}
