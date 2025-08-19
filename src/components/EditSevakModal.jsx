import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../api/api";

const EditSevakModal = ({ modal, setModal, sevakData, refreshData }) => {
  const [formData, setFormData] = useState({
    name: sevakData.name || "",
    mandal: sevakData.mandal || "",
    previous_target: sevakData.previous_target || "",
    sevak_target: sevakData.sevak_target || "",
    phone_number: sevakData.phone_number || "",
  });

  const [errors, setErrors] = useState({
    name: false,
    mandal: false,
    previous_target: false,
    sevak_target: false,
    phone_number: false,
  });

  useEffect(() => {
    setFormData({
      name: sevakData.name || "",
      mandal: sevakData.mandal || "",
      previous_target: sevakData.previous_target || "",
      sevak_target: sevakData.sevak_target || "",
      phone_number: sevakData.phone_number || "",
    });
  }, [sevakData]);

  const toggle = () => setModal(!modal);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate on change
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: validateField(name, value),
    }));
  };

  const validateField = (name, value) => {
    switch (name) {
      case "name":
      case "mandal":
      case "sevak_target":
        return !value.trim();
      case "phone_number":
        return !/^\d{10}$/.test(value);
      default:
        return false;
    }
  };

  const validateForm = () => {
    return !Object.keys(formData).some((key) =>
      validateField(key, formData[key])
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await axios.post(
        `${BACKEND_ENDPOINT}sevak/edit_sevak`,
        {
          ...formData,
          sevak_id: sevakData.sevak_id,
        }
      );
      toggle();
      refreshData(); // Refresh the list after editing
    } catch (error) {
      console.error("Error editing sevak:", error);
    }
  };

  return (
    <Dialog open={modal} onClose={toggle}>
      <DialogTitle>Edit Sevak Details</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          helperText={errors.name ? "Name is required." : ""}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Mandal"
          name="mandal"
          value={formData.mandal}
          onChange={handleChange}
          error={errors.mandal}
          helperText={errors.mandal ? "Mandal is required." : ""}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Target in 2024"
          name="previous_target"
          value={formData.previous_target}
          disabled
        />
        <TextField
          fullWidth
          margin="normal"
          label="Target for 2025"
          name="sevak_target"
          type="number"
          value={formData.sevak_target}
          onChange={handleChange}
          error={errors.sevak_target}
          helperText={errors.sevak_target ? "Target is required." : ""}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Phone Number"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          error={errors.phone_number}
          helperText={
            errors.phone_number ? "Phone number must be 10 digits long." : ""
          }
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmit}
          disabled={!validateForm()}
        >
          Save Changes
        </Button>
        <Button variant="contained" color="error" onClick={toggle}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditSevakModal;
