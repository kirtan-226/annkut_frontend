import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { BACKEND_ENDPOINT } from "../api/api";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
// import FormControlLabel from "@mui/material/FormControlLabel;
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import CircularProgress from "@mui/material/CircularProgress";
import { Button, FormControlLabel } from "@mui/material";

function AddSevaModal({ modal, setModal }) {
  const [loader, setLoader] = useState(false);
  const [formData, setFormData] = useState({
    book_no: "",
    reciept_no: "",
    seva_amount: "500",
    sahyogi_name: "",
    sahyogi_number: "",
    // prasad_detail: "annkut_sevak",
  });
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const toggle = () => setModal(!modal);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "seva_amount" && value !== "other") {
      setCustomAmount(""); // Clear custom amount if not "other"
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCustomAmountChange = (e) => {
    const { value } = e.target;
    setCustomAmount(value);

    // Ensure "other" remains selected when entering custom amount
    setFormData({
      ...formData,
      seva_amount: "other",
    });
  };

  const validateForm = () => {
    let formErrors = {};
    if (!formData.book_no) formErrors.book_no = "Book number is required";
    if (!formData.reciept_no)
      formErrors.reciept_no = "Receipt number is required";
    if (!formData.sahyogi_name)
        formErrors.sahyogi_name = "Sahyogi name is required";
    if (!formData.sahyogi_number)
        formErrors.sahyogi_number = "Sahyogi number is required";
    if (formData.seva_amount === "other") {
      if (!customAmount) formErrors.customAmount = "Custom amount is required";
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
      const sevakDetails = JSON.parse(localStorage.getItem("sevakDetails"));
      const { sevak_id } = sevakDetails;

      const res = await axios.post(`${BACKEND_ENDPOINT}seva/add_seva`, {
        ...formData,
        seva_amount:
          formData.seva_amount === "other"
            ? customAmount
            : formData.seva_amount,
        sevak_id: sevak_id,
      });

      if (res.data.status === "true") {
        toast.success(res.data.message);
        setFormData({
          book_no: "",
          reciept_no: "",
          seva_amount: "500",
          sahyogi_name: "",
          // prasad_detail: "annkut_sevak",
        });
        setCustomAmount("");
        toggle();
      } else {
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
        <ModalHeader toggle={toggle}>Add Annkut Seva</ModalHeader>
        <ModalBody>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="Book Number"
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
              label="Receipt Number"
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
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="Annkut Sahyogi"
              name="sahyogi_name"
              type="text"
              value={formData.sahyogi_name}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.sahyogi_name}
              helperText={errors.sahyogi_name}
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="Annkut Sahyogi Phone Number"
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
            disabled={loader}
          >
            {loader ? <CircularProgress size={24} /> : "Submit"}
          </Button>
          <Button
            color="error"
            style={{ margin: "10px" }}
            variant="contained"
            onClick={toggle}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
      <ToastContainer />
    </div>
  );
}

export default AddSevaModal;
