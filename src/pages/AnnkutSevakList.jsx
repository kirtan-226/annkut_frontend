import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { Table } from "reactstrap";
import { BACKEND_ENDPOINT } from "../api/api";
import Header from "../components/Header";
import AddAnnkutSevakModal from "../components/AddAnnkutSevakModal";
import EditSevakModal from "../components/EditSevakModal"; // Import the new modal
import { useNavigate } from "react-router-dom";
import { BarChart } from "@mui/x-charts/BarChart"; // Add this line

// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";

import {
  TableHead,
  TableBody,
  TableContainer,
  Paper,
  TableRow,
  TableCell,
  IconButton,
  Button,
} from "@mui/material";

const AnnkutSevakList = () => {
  const sevak = JSON.parse(localStorage.getItem("sevakDetails"));
  const sevak_id = sevak?.sevak_id;
  const [filledForms, setFilledForms] = useState([]);
  const [formTarget, setFormTarget] = useState();
  const [mandalList, setMandalList] = useState([]);
  const [showAddAnnkutSevak, setShowAddAnnkutSevak] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedSevak, setSelectedSevak] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data is loaded

  const navigate = useNavigate();

  const fetchFilledForms = async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_sevak`, {
        sevak_id: sevak_id,
      });
      setFilledForms(res.data.sevak || []);
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

  const handleAddAnnkutSevak = () => {
    setShowAddAnnkutSevak(true);
  };

  const fetchTargetDetails = async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}seva/get_seva_count`, {
        sevak_id: sevak_id,
      });
      setFormTarget(res.data);
    } catch (error) {
      console.error("Error fetching target count", error);
    }
  };

  const getMandalList = async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/get_mandal_list`, {
        sevak_id: sevak_id,
      });
      setMandalList(res.data.mandal_array);
      setDataLoaded(true); // Set dataLoaded to true after fetching

      setFormTarget(res.data.target);
    } catch (error) {
      console.error("Failed to fetch mandal list:", error);
    }
  };

  const handleMandalClick = (mandalDetails) => {
    navigate("/mandal-sevak-list", {
      state: {
        mandalDetails: mandalDetails,
      },
    });
  };

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

  const handleEdit = (item) => {
    setSelectedSevak(item);
    setEditModal(true);
  };

  const roles = [
    "Nirikshak",
    "Nirdeshak",
    "Sanyojak",
    "Sant_Nirdeshak",
    "Admin",
  ];
  const hasRole = roles.some((role) => sevak.role.includes(role));

  useEffect(() => {
    const interval = setInterval(() => {
      fetchFilledForms();
      fetchTargetDetails();
      getMandalList();
    }, 30000);

    fetchFilledForms();
    fetchTargetDetails();
    getMandalList();

    return () => clearInterval(interval);
  }, [sevak_id, showAddAnnkutSevak]);
  console.log("----------------------------", mandalList);
  const abbreviateLabel = (label) => {
    // Example: Return first 3 characters for abbreviation
    return label.length > 3 ? label.substring(0, 3) : label;
  };

const groupedByXetra = useMemo(() => {
  const arr = Array.isArray(mandalList) ? mandalList : [];
  const map = new Map();

  for (const item of arr) {
    const key = (item.mandal_xetra || "Unknown").toString().trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }

  // sort each group by mandal name (optional)
  for (const [k, rows] of map) {
    rows.sort((a, b) => a.mandal_name.localeCompare(b.mandal_name));
  }

  // sort groups naturally (so "Bharuch -1" < "Bharuch -2")
  return Array.from(map.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" })
  );
}, [mandalList]);

// helper for totals (optional)
const sum = (rows, field) =>
  rows.reduce((acc, r) => acc + (parseInt(r[field] ?? 0, 10) || 0), 0);

  const mandalData = mandalList.map((item) => ({
    name: abbreviateLabel(item.mandal_name),
    filledForms: item.mandal_filled_form,
    target: item.mandal_target,
  }));

  const xAxisData = mandalData.map((data) => data.name);
  const filledFormsData = mandalData.map((data) => data.filledForms);
  const targetData = mandalData.map((data) => data.target);
  console.log(xAxisData, "---xAxisData");
  return (
    <>
      <Header />

      {/* <div className="scrollable-container">
        <div style={{ position: "relative", width: "1200px" }}>
          {dataLoaded && (
            <div className="chart-scroll">
              <BarChart
                width={1200}
                height={350}
                series={[
                  {
                    data: filledFormsData, // Data for Filled Forms
                    label: `Filled Forms (${formTarget?.total_filled_form})`,
                    color: "rgb(255, 127, 14)", // Custom color for Filled Forms bars (e.g., blue)
                    labelAccessor: (point) => `${point.y}`, // Display the value on top of the bar
                  },
                  {
                    data: targetData, // Data for Targets
                    label: `Target (${formTarget?.total_target})`,
                    color: "#88009c", // Custom color for Filled Forms bars (e.g., blue)
                    labelAccessor: (point) => `${point.y}`, // Display the value on top of the bar
                  },
                ]}
                xAxis={[
                  {
                    data: xAxisData,
                    scaleType: "band",
                    // label: "Mandal", // Label for the X-axis
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div> */}
      {/* <div>
        <h6>Target: {formTarget?.total_target}</h6>
        <h6>Filled forms: {formTarget?.total_filled_form}</h6>
      </div> */}

      <div className="mt-4">
        {(sevak.role === "Sanchalak" || sevak.role === "Admin") && (
          <Button
            variant="contained"
            color="primary"
            outline
            onClick={handleAddAnnkutSevak}
          >
            Add Annkut Sevak
          </Button>
        )}
      </div>

      <div className="border m-4">
        <h5>Target:- {formTarget?.total_target}</h5>
        <h5>Filled Forms:- {formTarget?.total_filled_form}</h5>
      </div>

      <div className="seva-boxes border m-4">
        <h2>
          <u>Seva Boxes</u>
        </h2>

        <h5>500/- : {formTarget?.seva_five_hundered}</h5>
        <h5>1000/- : {formTarget?.seva_thousand}</h5>
        <h5>Above 1000/- : {formTarget?.seva_other}</h5>
      </div>
      {/* <div className="border m-4">
        <h2>
          <u>Prasad</u>
        </h2>
        <h5>Annkut Sevak : {formTarget?.sevak_prasad}</h5>
        <h5>Sahyogi : {formTarget?.sahyogi_prasad}</h5>
      </div> */}
      {hasRole ? (
        <TableContainer
          component={Paper}
          style={{ maxHeight: 500, marginTop: "15px", overflowY: "scroll" }} // Enable scrolling
        >
          <Table striped bordered stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Mandal</TableCell>
                <TableCell>Filled form</TableCell>
                <TableCell>Target</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupedByXetra.map(([xetra, rows]) => (
                <React.Fragment key={xetra}>
                  {/* group header row */}
                  <TableRow>
                    <TableCell colSpan={3} style={{ fontWeight: 700, textAlign:"center", background: "#f7f7f7" }}>
                      {xetra}
                    </TableCell>
                  </TableRow>

                  {/* actual mandals under this xetra */}
                  {rows.map((item, idx) => (
                    <TableRow
                      key={`${xetra}-${item.mandal_name}-${idx}`}
                      className="mandal-name"
                      onClick={() => handleMandalClick(item)}
                      hover
                    >
                      <TableCell>{item.mandal_name}</TableCell>
                      <TableCell>{item.mandal_filled_form}</TableCell>
                      <TableCell>{item.mandal_target}</TableCell>
                    </TableRow>
                  ))}

                  {/* optional summary row per xetra */}
                  <TableRow>
                    <TableCell style={{ fontStyle: "italic" }}>Subtotal</TableCell>
                    <TableCell style={{ fontStyle: "italic" }}>{sum(rows, "mandal_filled_form")}</TableCell>
                    <TableCell style={{ fontStyle: "italic" }}>{sum(rows, "mandal_target")}</TableCell>
                  </TableRow>

                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer
          component={Paper}
          style={{ maxHeight: 600, marginTop: "15px" }}
        >
          <Table striped bordered stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>Sevak Id</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Mandal</TableCell>
                <TableCell>Form Filled</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Phone Number</TableCell>
                {(sevak.role === "Sanchalak" || sevak.role === "Admin") && (
                  <TableCell>Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filledForms?.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sevak_id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.mandal}</TableCell>
                  <TableCell>{item.filled_form}</TableCell>
                  <TableCell>{item.sevak_target}</TableCell>
                  <TableCell>{item.phone_number}</TableCell>
                  {(sevak.role === "Sanchalak" || sevak.role === "Admin") && (
                    <TableCell>
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
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
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
      {showAddAnnkutSevak && (
        <AddAnnkutSevakModal
          modal={showAddAnnkutSevak}
          setModal={setShowAddAnnkutSevak}
        />
      )}
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

export default AnnkutSevakList;
