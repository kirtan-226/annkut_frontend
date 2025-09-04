import React, { useEffect, useState } from "react";
import axios from "axios";
import Header from "../components/Header";
import { Table } from "reactstrap";
import { BACKEND_ENDPOINT } from "../api/api";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
} from "@mui/material";
import ProgressBar from "react-bootstrap/ProgressBar";
// Removed unused AddAnnkutSevakModal import
import EditSevakModal from "../components/EditSevakModal";

const MandalSevakList = () => {
  const sevak = JSON.parse(localStorage.getItem("sevakDetails"));
  const sevak_id = sevak?.sevak_id;

  const [filledForms, setFilledForms] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedSevak, setSelectedSevak] = useState(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null); // will store sevak_id string

  const [sahyogiPrasad, setSahyogiPrasad] = useState(0);
  const [sevakPrasad, setSevakPrasad] = useState(0);

  const location = useLocation();
  const { mandalDetails } = location.state || {};
  const navigate = useNavigate();

  const fetchSevakList = async () => {
    try {
      if (!mandalDetails?.sanchalak) return;
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_sevak`, {
        sevak_id: mandalDetails.sanchalak,
      });
      setFilledForms(res.data.sevak || []);
      setSahyogiPrasad(res.data.sahyogi_prasad || 0);
      setSevakPrasad(res.data.sevak_prasad || 0);
    } catch (error) {
      console.error("Error fetching sevak list:", error);
    }
  };

  const fetchFilledForms = async () => {
    try {
      await fetchSevakList();
    } catch (error) {
      console.error("Error fetching filled forms:", error);
    }
  };

  const handleDelete = (item) => {
    // store the sevak_id only; open dialog
    setItemToDelete(item?.sevak_id || null);
    setOpenConfirmDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await axios.post(`${BACKEND_ENDPOINT}sevak/delete_sevak`, {
        sevak_id: itemToDelete,
      });
      await fetchFilledForms(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting sevak:", error);
    } finally {
      setOpenConfirmDialog(false);
      setItemToDelete(null);
    }
  };

  const handleEdit = (item) => {
    setSelectedSevak(item);
    setEditModal(true);
  };

  const progress =
    mandalDetails?.mandal_target > 0
      ? ((Number(mandalDetails?.mandal_filled_form ?? 0) /
          Number(mandalDetails?.mandal_target ?? 0)) *
          100) || 0
      : 0;

  useEffect(() => {
    fetchSevakList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mandalDetails?.sanchalak]);

  return (
    <>
      <div>
        <Header />

        <div
          style={{
            display: "flex",
            textAlign: "left",
            fontFamily: "system-ui",
            justifyContent: "space-around",
          }}
        >
          <div style={{ width: "100%", padding: "10px", fontWeight: 600 }}>
            <h7 style={{ fontWeight: 600 }}>Archived Target</h7>
            <ProgressBar
              className="custom-progress-bar"
              now={Math.max(0, Math.min(100, Math.round(progress)))}
              label={`${Math.round(progress)}%`}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            textAlign: "left",
            fontFamily: "system-ui",
            margin: "0 12px",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h6>Target : {mandalDetails?.mandal_target ?? 0}</h6>
            <h6>Filled : {mandalDetails?.mandal_filled_form ?? 0}</h6>
          </div>

          <div
            style={{
              textAlign: "end",
              marginRight: "10px",
              marginLeft: "40px",
              fontSize: "xx-large",
              cursor: "pointer",
            }}
            onClick={() => navigate(-1)}
            title="Back"
          >
            <i className="bi bi-arrow-left-square"></i>
          </div>
        </div>

        <div>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Sevak Id</th>
                <th>Name</th>
                {/* <th>Mandal</th> */}
                <th>Form Filled</th>
                <th>Target</th>
                {(sevak?.role === "Sanchalak" || sevak?.role === "Admin") && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(filledForms) ? filledForms : []).map(
                (item, index) => (
                  <tr key={`${item?.sevak_id || "row"}-${index}`}>
                    <th scope="row">{item?.sevak_id}</th>
                    <td>{item?.name}</td>
                    {/* <td>{item?.mandal}</td> */}
                    <td>{item?.filled_form ?? 0}</td>
                    <td>{item?.sevak_target ?? 0}</td>
                    {(sevak?.role === "Sanchalak" || sevak?.role === "Admin") && (
                      <td>
                        <IconButton
                          color="warning"
                          onClick={() => handleEdit(item)}
                          style={{ marginRight: "10px" }}
                          size="small"
                        >
                          <i className="bi fs-6 bi-pencil"></i>
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(item)}
                          size="small"
                        >
                          <i className="bi fs-6 bi-trash"></i>
                        </IconButton>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <p>Are you sure you want to delete this item?</p>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => setOpenConfirmDialog(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDeleteConfirm} color="secondary">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {editModal && (
        <EditSevakModal
          modal={editModal}
          setModal={setEditModal}
          sevakData={selectedSevak}
          refreshData={fetchFilledForms}
        />
      )}
    </>
  );
};

export default MandalSevakList;
