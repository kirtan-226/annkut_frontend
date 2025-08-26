// src/components/EditSevaModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { BACKEND_ENDPOINT } from "../api/api";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import CircularProgress from "@mui/material/CircularProgress";
import { Button, FormControlLabel } from "@mui/material";

function EditSevaModal({ modal, setModal, sevakData, refreshData }) {
  // sevakData is actually the selected SEVA row from ListingTable
  const sevaId = useMemo(
    () => sevakData?.seva_id ?? sevakData?.id,
    [sevakData]
  );

  const [loader, setLoader] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    book_no: "",
    reciept_no: "",
    seva_amount: "500",
    sahyogi_name: "",
    sahyogi_number: "",
  });
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState({});

  const toggle = () => setModal(!modal);

  // Helper to normalize API fields
  const pickReceipt = (obj) => obj?.reciept_no ?? obj?.reciept_no ?? "";

  // Fetch latest seva by id when modal opens
  useEffect(() => {
  if (!modal || !sevaId) return;

  let ignore = false;
  (async () => {
    try {
      setFetching(true);
      const res = await axios.post(`${BACKEND_ENDPOINT}seva/get_seva_by_id`, {
        seva_id: sevaId,
      });

      // handle object OR array payloads
      const raw = res?.data?.seva;
      const s = Array.isArray(raw) ? raw[0] : raw || {};

      // fallback to values from the row we clicked if API misses something
      const bookNo = s.book_no ?? sevakData?.book_no ?? "";
      const receipt = s.reciept_no ?? s.reciept_no ?? sevakData?.reciept_no ?? sevakData?.reciept_no ?? "";
      const name = s.sahyogi_name ?? sevakData?.sahyogi_name ?? "";
      const phone = s.sahyogi_number ?? sevakData?.sahyogi_number ?? "";
      const amtRaw = s.seva_amount ?? sevakData?.seva_amount ?? "";

      // cast amount to string so radios match ("500"/"1000"/"other")
      const amt = String(amtRaw).trim();
      const isPreset = amt === "500" || amt === "1000";
      const nextSevaAmount = isPreset ? amt : "other";
      const nextCustom = isPreset ? "" : (amt || "");

      if (!ignore) {
        setFormData({
          book_no: String(bookNo),
          reciept_no: String(receipt),
          sahyogi_name: String(name),
          sahyogi_number: String(phone),
          seva_amount: nextSevaAmount, // "500" | "1000" | "other"
        });
        setCustomAmount(nextCustom);   // only filled when "other"
        setErrors({});
      }
    } catch (e) {
      console.error("Error fetching seva by id:", e);
      toast.error("Unable to fetch seva details.");
    } finally {
      if (!ignore) setFetching(false);
    }
  })();

  return () => { ignore = true; };
}, [modal, sevaId, BACKEND_ENDPOINT]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If switching away from "other", clear the custom amount
    if (name === "seva_amount" && value !== "other") {
      setCustomAmount("");
    }

    // Basic digit-only enforcement for number-ish fields
    let nextValue = value;
    if (["book_no", "reciept_no", "sahyogi_number"].includes(name)) {
      nextValue = value.replace(/[^\d]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleCustomAmountChange = (e) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    setCustomAmount(v);

    // Keep "other" selected
    setFormData((prev) => ({ ...prev, seva_amount: "other" }));
  };

  const validateForm = () => {
    let formErrors = {};

    if (!formData.book_no) formErrors.book_no = "બુક નંબર લાખો";
    if (!formData.reciept_no) formErrors.reciept_no = "રસીદ નંબર લાખો";
    if (!formData.sahyogi_first_name) formErrors.sahyogi_first_name = "સહયોગી નું નામ લાખો";
    if (!formData.sahyogi_last_name) formErrors.sahyogi_last_name = "સહયોગી ની અટક લાખો";
    if (!formData.sahyogi_middle_name) formErrors.sahyogi_middle_name = "સહયોગી ના પિતા નું નામ લાખો";
    if (!formData.sahyogi_number) formErrors.sahyogi_number = "સહયોગી નો નંબર લાખો";

    if (formData.seva_amount === "other") {
      if (!customAmount) {
        formErrors.customAmount = "Custom amount is required";
      } else if (parseInt(customAmount, 10) <= 1000) {
        formErrors.customAmount = "Amount must be greater than 1000";
      }
    }

    return formErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoader(true);

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setLoader(false);
      return;
    }

    try {
      await axios.put(`${BACKEND_ENDPOINT}seva/edit_seva`, {
        id: sevaId,
        book_no: formData.book_no,
        reciept_no: formData.reciept_no, // correct spelling
        sahyogi_name: formData.sahyogi_name,
        sahyogi_number: formData.sahyogi_number || null,
        seva_amount: formData.seva_amount === "other" ? customAmount : formData.seva_amount,
    });

      toast.success("Seva updated successfully");
      toggle();
      refreshData && refreshData();
    } catch (error) {
      console.error("Error editing seva:", error);
      toast.error("Failed to update seva.");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Edit Annkut Seva</ModalHeader>
        <ModalBody>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="સહયોગી ની અટક"
              name="sahyogi_last_name"
              type="text"
              value={formData.sahyogi_last_name}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.sahyogi_last_name}
              helperText={errors.sahyogi_last_name}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="સહયોગી ના પિતા/પતિ નું નામ"
              name="sahyogi_middle_name"
              type="text"
              value={formData.sahyogi_middle_name}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.sahyogi_middle_name}
              helperText={errors.sahyogi_middle_name}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="સહયોગી નુ નામ"
              name="sahyogi_first_name"
              type="text"
              value={formData.sahyogi_first_name}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.sahyogi_first_name}
              helperText={errors.sahyogi_first_name}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="સહયોગી નો ફોન નંબર"
              name="sahyogi_number"
              type="tel"
              value={formData.sahyogi_number || ""}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={Boolean(errors.sahyogi_number)}
              helperText={errors.sahyogi_number}
              fullWidth
              inputProps={{ inputMode: "numeric", pattern: "[0-9]{10}", maxLength: 10 }}
            />
          </FormControl>
          {/*<FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">Prashad Vitran</FormLabel>
            <RadioGroup
              name="prasad_detail"
              value={formData.prasad_detail}
              onChange={handleChange}
            >
              <FormControlLabel
                value="annkut_sevak"
                control={<Radio color="secondary" />}
                label="Annkut Sevak"
              />
              <FormControlLabel
                value="sahyogi_pote"
                control={<Radio color="secondary" />}
                label="Sahyogi Pote"
              />
            </RadioGroup>
          </FormControl>*/}
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="બુક નંબર"
              name="book_no"
              type="number"
              value={formData.book_no}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.book_no}
              helperText={errors.book_no}
              required
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="રસીદ નંબર"
              name="reciept_no"
              type="number"
              value={formData.reciept_no}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.reciept_no}
              helperText={errors.reciept_no}
              required
              fullWidth
            />
          </FormControl>
          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">Amount</FormLabel>
            <RadioGroup
              name="seva_amount"
              value={formData.seva_amount}
              onChange={handleChange}
            >
              <FormControlLabel
                value="500"
                control={<Radio color="secondary" />}
                label="500"
              />
              <FormControlLabel
                value="1000"
                control={<Radio color="secondary" />}
                label="1000"
              />
              <FormControlLabel
                value="other"
                control={<Radio color="secondary" />}
                label="Other"
              />
            </RadioGroup>
          </FormControl>
          {formData.seva_amount === "other" && (
            <>
              <FormControl fullWidth variant="outlined" margin="normal">
                <TextField
                  label="Enter Custom Amount"
                  name="customAmount"
                  type="number"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  variant="outlined"
                  color="secondary"
                  error={!!errors.customAmount}
                  helperText={errors.customAmount}
                  fullWidth
                  inputProps={{ min: 1001 }} // extra safeguard on UI
                />
              </FormControl>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            disabled={loader || fetching}
          >
            {loader ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
          <Button
            color="error"
            style={{ margin: "10px" }}
            variant="contained"
            onClick={toggle}
            disabled={loader || fetching}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* keep ToastContainer if you don't already have a global one */}
      <ToastContainer position="top-center" autoClose={5000} pauseOnHover theme="colored" />
    </div>
  );
}

export default EditSevaModal;
