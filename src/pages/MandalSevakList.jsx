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
import AddAnnkutSevakModal from "../components/AddAnnkutSevakModal";
import EditSevakModal from "../components/EditSevakModal";

const MandalSevakList = () => {
  const sevak = JSON.parse(localStorage.getItem("sevakDetails"));
  const sevak_id = sevak?.sevak_id;
  const [filledForms, setFilledForms] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [selectedSevak, setSelectedSevak] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sahyogiPrasad, setSahyogiPrasad] = useState(0);
  const [sevakPrasad, setSevakPrasad] = useState(0);

  const location = useLocation();
  const { mandalDetails } = location.state || {};
  console.log(filledForms, "----filledForms");
  const handleDelete = async (sevakId) => {
    try {
      setItemToDelete(sevakId);
      setOpenConfirmDialog(true);
      if (openConfirmDialog) {
        await axios.post(`${BACKEND_ENDPOINT}sevak/delete_sevak`, {
          sevak_id: sevakId,
        });
      }
      fetchFilledForms(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting sevak:", error);
    }
  };
  const navigate = useNavigate();

  const fetchFilledForms = async () => {
    try {
      fetchSevakList();
    } catch (error) {
      console.error("Error fetching filled forms:", error);
    }
  };
  const handleDeleteConfirm = async (sevakId) => {
    try {
      await axios.post(`${BACKEND_ENDPOINT}sevak/delete_sevak`, {
        sevak_id: sevakId,
      });
      fetchFilledForms(); // Refresh the list after deletion
    } catch (error) {
      console.error("Error deleting sevak:", error);
    }
  };

  const fetchSevakList = async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_sevak`, {
        sevak_id: mandalDetails.sanchalak,
      });
      setFilledForms(res.data.sevak || []); // Ensure `seva` is in the response
      setSahyogiPrasad(res.data.sahyogi_prasad || 0);
      setSevakPrasad(res.data.sevak_prasad || 0);
    } catch (error) {
      console.error("Error fetching filled forms:", error);
    }
  };
  const handleEdit = (item) => {
    setSelectedSevak(item);
    setEditModal(true);
  };
  const progress = mandalDetails?.mandal_filled_form
    ? (mandalDetails.mandal_filled_form / mandalDetails.mandal_target) * 100
    : 0;
  useEffect(() => {
    fetchSevakList();
  }, []);
  useEffect(() => {
    fetchSevakList();
  }, []);
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
              now={progress}
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
            <h6>Target : {mandalDetails?.mandal_target}</h6>
            <h6>Filled : {mandalDetails?.mandal_filled_form}</h6>
          </div>
          <div>
            <h6>Sahyogi : {sahyogiPrasad}</h6>
            <h6>Sevak : {sevakPrasad}</h6>
          </div>
          <div
            style={{
              textAlign: "end",
              marginRight: "10px",
              marginLeft: "40px",

              fontSize: "xx-large",
            }}
            onClick={() => navigate(-1)}
          >
            <i class="bi bi-arrow-left-square"></i>
          </div>
        </div>

        {/* Back Button */}

        <div>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Sevak Id</th>
                <th>Name</th>
                <th>Mandal</th>
                <th>Form Filled</th>
                <th>Target</th>
                {(sevak.role === "Sanchalak" || sevak.role === "Admin") && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(filledForms) ? filledForms : []).map(
                (item, index) => (
                  <tr key={item.id}>
                    <th scope="row">{item.sevak_id}</th>
                    <td>{item.name}</td>
                    <td>{item.mandal}</td>
                    <td>{item.filled_form}</td>
                    <td>{item.sevak_target}</td>
                    {(sevak.role === "Sanchalak" || sevak.role === "Admin") && (
                      <td>
                        <IconButton
                          color="warning"
                          onClick={() => handleEdit(item)}
                          style={{ marginRight: "10px" }}
                        >
                          <i class="bi fs-6 bi-pencil"></i>
                        </IconButton>
                        {/* <IconButton
            color="error"
            onClick={() => handleDelete(item)}
          >
            <i class="bi fs-6 bi-trash"></i>
          </IconButton> */}
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </Table>
        </div>
      </div>
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
          <Button
            variant="contained"
            onClick={() => {
              if (itemToDelete) {
                // Call the delete function with the selected item
                handleDeleteConfirm(itemToDelete.sevak_id);
              }
              setOpenConfirmDialog(false);
            }}
            color="secondary"
          >
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
