// src/components/EditSevakModal.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import TextField from "@mui/material/TextField";
import { BACKEND_ENDPOINT } from "../api/api";

const asStr = (v) => (v === undefined || v === null ? "" : String(v));
const FIELDS_TO_VALIDATE = ["name", "sevak_target", "phone_number"];

export default function EditSevakModal({ modal, setModal, sevakData = {}, refreshData }) {
  const [formData, setFormData] = useState({
    name: asStr(sevakData.name),
    sevak_target: asStr(sevakData.sevak_target),
    phone_number: asStr(sevakData.phone_number),
  });

  const [errors, setErrors] = useState({
    name: false,
    sevak_target: false,
    phone_number: false,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      name: asStr(sevakData.name),
      sevak_target: asStr(sevakData.sevak_target),
      phone_number: asStr(sevakData.phone_number),
    });

    // Re-validate when incoming data changes
    setErrors({
      name: validateField("name", asStr(sevakData.name)),
      sevak_target: validateField("sevak_target", asStr(sevakData.sevak_target)),
      phone_number: validateField("phone_number", asStr(sevakData.phone_number)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sevakData]);

  const toggle = () => setModal(!modal);

  const validateField = (name, value) => {
    const v = asStr(value);

    switch (name) {
      case "name":
        return v.trim() === "";
      case "sevak_target": {
        // required & non-negative integer (adjust if you need > 0)
        if (v.trim() === "") return true;
        if (!/^\d+$/.test(v)) return true;
        return false;
      }
      case "phone_number":
        // exactly 10 digits (adjust to your format as needed)
        return !/^\d{10}$/.test(v);
      default:
        return false;
    }
  };

  const validateForm = () =>
    !FIELDS_TO_VALIDATE.some((key) => validateField(key, formData[key]));

  const handleChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // sanitize inputs
    if (name === "phone_number") {
      value = asStr(value).replace(/\D/g, "").slice(0, 10); // keep up to 10 digits
    }
    if (name === "sevak_target") {
      value = asStr(value).replace(/\D/g, ""); // digits only
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await axios.post(`${BACKEND_ENDPOINT}sevak/edit_sevak`, {
        // send clean payload (cast numeric where appropriate)
        name: asStr(formData.name).trim(),
        sevak_target: Number(formData.sevak_target || 0),
        phone_number: asStr(formData.phone_number),
        sevak_id: sevakData.sevak_id, // required by your backend
      });

      toggle();
      if (typeof refreshData === "function") {
        await refreshData();
      }
    } catch (error) {
      console.error("Error editing sevak:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={modal} onClose={toggle} fullWidth maxWidth="sm">
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
          label="Target for 2025"
          name="sevak_target"
          type="text" // use text to keep full control of sanitization
          inputMode="numeric"
          value={formData.sevak_target}
          onChange={handleChange}
          error={errors.sevak_target}
          helperText={errors.sevak_target ? "Enter a valid target (digits only)." : ""}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Phone Number"
          name="phone_number"
          type="text"
          inputMode="numeric"
          value={formData.phone_number}
          onChange={handleChange}
          error={errors.phone_number}
          helperText={
            errors.phone_number ? "Phone number must be exactly 10 digits." : ""
          }
        />
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleSubmit}
          disabled={!validateForm() || submitting}
        >
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="contained" color="error" onClick={toggle} disabled={submitting}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
