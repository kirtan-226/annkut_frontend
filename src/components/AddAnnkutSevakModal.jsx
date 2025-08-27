import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { BACKEND_ENDPOINT } from "../api/api";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

function AddAnnkutSevakModal({ modal, setModal }) {
  const [loader, setLoader] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    sevak_target: "0",
  });
  const navigate = useNavigate();

  const toggle = () => setModal(!modal);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone_number") {
      if (/^\d{0,10}$/.test(value)) {
        setFormData({
          ...formData,
          [name]: value,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation to prevent empty string submissions
    if (
      formData.name.trim() === "" ||
      formData.phone_number.trim() === "" ||
      formData.sevak_target.trim() === "" ||
      formData.phone_number.length !== 10
    ) {
      toast.error("All fields are required and must be valid.");
      return;
    }

    setLoader(true);
    try {
      const sevakDetails = JSON.parse(localStorage.getItem("sevakDetails"));
      const { sevak_id } = sevakDetails;

      const res = await axios.post(`${BACKEND_ENDPOINT}sevak/add_sevak`, {
        ...formData,
        id: sevak_id,
      });

      if (res.data.status === true) {
        toast.success(res.data.message);
        setFormData({
          name: "",
          phone_number: "",
          sevak_target: "0",
        });
        toggle();
      } else {
        console.log(res);
        toast.error("Failed to add Seva: " + res.data.message);
      }
    } catch (error) {
      toast.error("An error occurred: " + error.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Add Annkut Sevak </ModalHeader>
        <ModalBody>
          <div>
            <TextField
              label="Annkut Sevak Name"
              name="name"
              placeholder="Enter name of Annkut sevak"
              value={formData.name}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              margin="normal"
              required
              color="secondary"
            />
          </div>
          <div>
            <TextField
              label="Phone Number"
              name="phone_number"
              placeholder="Enter Phone number"
              value={formData.phone_number}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              margin="normal"
              required
              color="secondary"
              inputProps={{ maxLength: 10 }}
            />
          </div>
          <div>
            <TextField
              label="Target"
              name="sevak_target"
              placeholder="Enter Target for sevak"
              value={formData.sevak_target}
              onChange={handleChange}
              variant="outlined"
              fullWidth
              margin="normal"
              required
              color="secondary"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            disabled={loader}
          >
            {loader ? "Submitting..." : "Submit"}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={toggle}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <ToastContainer />
    </div>
  );
}

export default AddAnnkutSevakModal;
