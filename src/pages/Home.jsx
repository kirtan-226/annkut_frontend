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
  // Safe read from localStorage
  const sevakDetails = (() => {
    try {
      return JSON.parse(localStorage.getItem("sevakDetails")) || {};
    } catch {
      return {};
    }
  })();
  console.log(sevakDetails);
  const sevak_id = sevakDetails?.sevak_id || "";
  const sevak_target_raw = sevakDetails?.sevak_target ?? 0;
  const filled_form_raw = sevakDetails?.filled_form ?? 0;
  const achieved_target_raw = sevakDetails?.achieved_target ?? 0;

  const [showAddSeva, setShowAddSeva] = useState(false);
  const [filledForms, setFilledForms] = useState([]);
  const [formTarget, setFormTarget] = useState(Number(filled_form_raw) || 0); // UI "Filled form" count
  const [achievedTarget, setAchievedTarget] = useState(Number(achieved_target_raw) || 0);

  const sevak_target = Number(sevak_target_raw) || 0;

  const handleAddSeva = () => setShowAddSeva(true);

  const fetchFilledForms = async () => {
    if (!sevak_id) return;
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}seva/get_seva`, {
        sevak_id,
      });
      const list = Array.isArray(res?.data?.seva) ? res.data.seva : [];
      setFilledForms(list);
      setFormTarget(list.length); // how many rows listed
      setAchievedTarget(Number(res?.data?.achieved_target ?? 0));
    } catch (error) {
      console.error("Error fetching filled forms:", error);
    }
  };

  const progress = sevak_target > 0 ? (achievedTarget / sevak_target) * 100 : 0;
  const progressClamped = Math.max(0, Math.min(100, Math.round(progress)));

  const handleDelete = async (id) => {
    try {
      const res = await axios.post(`${BACKEND_ENDPOINT}seva/delete_seva`, {
        seva_id: id,
      });
      toast.success(res.data?.message || "Deleted");
      fetchFilledForms();
    } catch (error) {
      console.error("Unable to delete", error);
      toast.error("Unable to delete");
    }
  };

  // On mount + whenever modal closes/opens, refresh list
  useEffect(() => {
    if (!sevak_target || sevak_target <= 0) {
      alert("કૃપા કરીને તમારા અન્નકુટ ફોર્મ લક્ષ્યને અપડેટ કરો.");
    }
    fetchFilledForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAddSeva, sevak_id]);

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
          <h7 style={{ fontWeight: 600 }}>Achieved Target</h7>
          <ProgressBar
            now={progressClamped}
            label={`${progressClamped}%`}
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
        {sevak_target > 0 && (
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
        )}
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
