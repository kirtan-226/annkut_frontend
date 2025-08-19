import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import ListingTable from "../components/ListingTable";
import AddSevaModal from "../components/AddSevaModal";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../api/api";
import { Button } from "reactstrap";
import { toast, ToastContainer } from "react-toastify";
import { ProgressBar } from "react-bootstrap";

const Home = () => {
  const [showAddSeva, setShowAddSeva] = useState(false);
  const [filledForms, setFilledForms] = useState([]);
  const { sevak_target, filled_form } = JSON.parse(
    localStorage.getItem("sevakDetails")
  );
  const [formTarget, setFormTarget] = useState(filled_form);

  const handleAddSeva = () => {
    setShowAddSeva(true);
  };

  const sevak = JSON.parse(localStorage.getItem("sevakDetails"));
  const sevak_id = sevak?.sevak_id; // Ensure this matches with the server response
  const fetchFilledForms = async () => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}seva/get_seva`, {
        sevak_id: sevak_id,
      });
      setFilledForms(res.data.seva || []); // Ensure `seva` is in the response
      setFormTarget(res.data.seva.length);
    } catch (error) {
      console.error("Error fetching filled forms:", error);
    }
  };
  const progress = formTarget ? (formTarget / sevak_target) * 100 : 0;
  const handleDelete = async (id) => {
    try {
      const res = await axios.put(`${BACKEND_ENDPOINT}seva/delete_seva`, {
        seva_id: id,
      });
      toast.success(res.data.message);
      fetchFilledForms();
    } catch (error) {
      console.error("Unable to delete", error);
    }
  };

  useEffect(() => {
    fetchFilledForms();
  }, [showAddSeva]);

  return (
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
            // variant="error"
            now={progress}
            label={`${Math.round(progress)}%`}
            className="custom-progress-bar"
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
          <h6>Target : {sevak_target}</h6>
          <h6>Filled form : {formTarget}</h6>
        </div>
      </div>
      <div>
        <Button color="primary" outline onClick={handleAddSeva}>
          Add Seva
        </Button>
        <ListingTable
          data={filledForms}
          handleDelete={handleDelete}
          refreshData={fetchFilledForms}
        />
      </div>

      {showAddSeva && (
        <AddSevaModal modal={showAddSeva} setModal={setShowAddSeva} />
      )}
      <ToastContainer
        position="top-center"
        autoClose={5000}
        closeOnClick
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default Home;
