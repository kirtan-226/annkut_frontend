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
import {
  Button,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

function AddSevaModal({ modal, setModal }) {
  const me = JSON.parse(localStorage.getItem("sevakDetails")) || {};
  const mySevakCode = me?.sevak_code || me?.sevak_id || "";

  const [loader, setLoader] = useState(false);

  // books assigned to this sevak (dropdown)
  const [myBooks, setMyBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");

  // form
  const [formData, setFormData] = useState({
    book_no: "",                 // selected from dropdown
    receipt_no: "",              // NOTE: backend expects "receipt_no"
    seva_amount: "500",          // "500" | "1000" | "other"
    sahyogi_first_name: "",
    sahyogi_middle_name: "",
    sahyogi_last_name: "",
    sahyogi_number: "",
  });
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState({});

  const toggle = () => setModal(!modal);

  // Label helper: "12 (1–50)"
  const bookLabel = (b) => {
    // const s = b?.start_no ?? "";
    // const e = b?.end_no ?? "";
    // const range = s || e ? ` (${s}–${e || "-"})` : "";
    // return `${b?.book_no ?? ""}${range}`;
    return `${b?.book_no ?? ""}`;
  };

  // Currently selected book meta (for range validation)
  const selectedBook = useMemo(
    () => myBooks.find((b) => String(b.book_no) === String(formData.book_no)),
    [myBooks, formData.book_no]
  );

  // Fetch books assigned to this user when the modal opens
  useEffect(() => {
    if (!modal || !mySevakCode) return;

    let ignore = false;
    (async () => {
      try {
        setBooksLoading(true);
        setBooksError("");
        const res = await axios.post(`${BACKEND_ENDPOINT}ReceiptBooks/my_books`, {
          sevak_code: mySevakCode,
        });
        const rows = res?.data?.books || [];
        console.log('qwerty',rows);
        if (!ignore) setMyBooks(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("my_books error:", e);
        if (!ignore) {
          setBooksError("Unable to load your books.");
          setMyBooks([]);
        }
      } finally {
        if (!ignore) setBooksLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [modal, mySevakCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // switching away from "other" clears custom
    if (name === "seva_amount" && value !== "other") {
      setCustomAmount("");
    }

    // digit-only for receipt & phone
    let v = value;
    if (name === "receipt_no" || name === "sahyogi_number") {
      v = value.replace(/[^\d]/g, "");
    }

    setFormData((p) => ({ ...p, [name]: v }));
  };

  const handleBookChange = (e) => {
    const value = e.target.value;
    const b = myBooks.find((x) => String(x.book_no) === String(value));
    const next = b?.next_receipt_no ? String(b.next_receipt_no) : "";
    setFormData((p) => ({ ...p, book_no: value, receipt_no: next }));
  };

  const handleCustomAmountChange = (e) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    setCustomAmount(v);
    setFormData((p) => ({ ...p, seva_amount: "other" }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.book_no) errs.book_no = "બુક નંબર પસંદ કરો";
    if (!formData.receipt_no) errs.receipt_no = "રસીદ નંબર લાખો";

    if (!formData.sahyogi_last_name)   errs.sahyogi_last_name   = "સહયોગી ની અટક લાખો";
    if (!formData.sahyogi_middle_name) errs.sahyogi_middle_name = "સહયોગી ના પિતા નું નામ લાખો";
    if (!formData.sahyogi_first_name)  errs.sahyogi_first_name  = "સહયોગી નું નામ લાખો";
    if (!formData.sahyogi_number)      errs.sahyogi_number      = "સહયોગી નો નંબર લાખો";

    if (formData.seva_amount === "other") {
      if (!customAmount) {
        errs.customAmount = "Custom amount is required";
      } else if (parseInt(customAmount, 10) <= 1000) {
        errs.customAmount = "રોકમ 1000 કરતા વધારે હોઈ તોજ લાખો";
      }
    }

    // optional: receipt in range validation (when we know range)
    if (selectedBook) {
      const r = Number(formData.receipt_no);
      const s = Number(selectedBook.start_no ?? 0);
      const e = Number(selectedBook.end_no ?? 0);
      if (s && e && (r < s || r > e)) {
        errs.receipt_no = `રસીદ ${s} થી ${e} વચ્ચે લાખો`;
      }
    }

    return errs;
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
      const payload = {
        // your backend expects these exact fields
        book_no: formData.book_no,
        receipt_no: formData.receipt_no, // NOTE spelling
        sahyogi_first_name:  formData.sahyogi_first_name,
        sahyogi_middle_name: formData.sahyogi_middle_name,
        sahyogi_last_name:   formData.sahyogi_last_name,
        sahyogi_number:      formData.sahyogi_number || null,
        seva_amount: formData.seva_amount === "other" ? customAmount : formData.seva_amount,
        sevak_id: mySevakCode, // controller builds sahyogi_name & uses sevak_id
        // prasad_detail: "annkut_sevak", // uncomment if you reinstate this on backend
      };

      const res = await axios.post(`${BACKEND_ENDPOINT}seva/add_seva`, payload);

      if (res?.data?.status) {
        toast.success(res?.data?.message || "Seva Added Successfully");
        // reset
        setFormData({
          book_no: "",
          receipt_no: "",
          seva_amount: "500",
          sahyogi_first_name: "",
          sahyogi_middle_name: "",
          sahyogi_last_name: "",
          sahyogi_number: "",
        });
        setCustomAmount("");
        setErrors({});
        toggle();
      } else {
        toast.error(res?.data?.message || "Failed to add Seva");
      }
    } catch (error) {
      console.error("add_seva error:", error);
      toast.error(error?.response?.data?.message || error.message || "An error occurred");
    } finally {
      setLoader(false);
    }
  };
  // console.log(myBooks,'sdsdcsdcsdcsdcsdc');
  return (
    <div>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Add Annkut Seva</ModalHeader>
        <ModalBody>
          {/* Book selector */}
          <FormControl fullWidth variant="outlined" margin="normal" size="small">
            <InputLabel id="book-select-label">બુક નંબર</InputLabel>
            <Select
              labelId="book-select-label"
              label="બુક નંબર"
              value={formData.book_no}
              onChange={handleBookChange}
              error={!!errors.book_no}
            >
              {booksLoading && <MenuItem disabled>Loading…</MenuItem>}
              {booksError && <MenuItem disabled>{booksError}</MenuItem>}
              {!booksLoading && !booksError && myBooks.length === 0 && (
                <MenuItem disabled>No assigned books</MenuItem>
              )}
              {myBooks.map((b) => (
                <MenuItem key={b.book_no} value={String(b.book_no)}>
                  {bookLabel(b)}
                </MenuItem>
              ))}
            </Select>
            {errors.book_no && (
              <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.book_no}</div>
            )}
          </FormControl>

          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="રસીદ નંબર (auto)"
              name="receipt_no"
              value={formData.receipt_no}
              variant="outlined"
              color="secondary"
              error={!!errors.receipt_no}
              helperText={
                errors.receipt_no ||
                (selectedBook ? `Next: ${selectedBook.next_receipt_no}` : "પહેલા બુક પસંદ કરો")
              }
              required
              fullWidth
              InputProps={{ readOnly: true }}
              disabled
            />
          </FormControl>

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

          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">Amount</FormLabel>
            <RadioGroup
              name="seva_amount"
              value={formData.seva_amount}
              onChange={handleChange}
            >
              <FormControlLabel value="500"  control={<Radio color="secondary" />} label="500" />
              <FormControlLabel value="1000" control={<Radio color="secondary" />} label="1000" />
              <FormControlLabel value="other" control={<Radio color="secondary" />} label="Other" />
            </RadioGroup>
          </FormControl>

          {formData.seva_amount === "other" && (
            <FormControl fullWidth variant="outlined" margin="normal">
              <TextField
                label="Enter Custom Amount"
                name="customAmount"
                type="text"
                value={customAmount}
                onChange={handleCustomAmountChange}
                variant="outlined"
                color="secondary"
                error={!!errors.customAmount}
                helperText={errors.customAmount}
                fullWidth
                inputProps={{ inputMode: "numeric" }}
              />
            </FormControl>
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
            disabled={loader}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* keep if you don’t already have a global container */}
      <ToastContainer position="top-center" autoClose={5000} pauseOnHover theme="colored" />
    </div>
  );
}

export default AddSevaModal;
