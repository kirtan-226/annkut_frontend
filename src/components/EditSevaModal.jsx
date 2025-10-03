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
import { Button, FormControlLabel, InputLabel, MenuItem, Select } from "@mui/material";

function getBackendMessage(err) {
  // Only show message coming from backend JSON
  const data = err?.response?.data;
  if (data && typeof data === "object" && typeof data.message === "string") {
    return data.message;
  }
  return null; // no fallback text
}

function EditSevaModal({ modal, setModal, sevakData, refreshData }) {
  const sevaId = useMemo(
    () => sevakData?.seva_id ?? sevakData?.id,
    [sevakData]
  );

  // logged-in user (used to fetch their books)
  const me = JSON.parse(localStorage.getItem("sevakDetails")) || {};
  const mySevakCode = me?.sevak_code || me?.sevak_id || "";
  // console.log(mySevakCode,'mySevakCode');
  const [loader, setLoader] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [formData, setFormData] = useState({
    book_no: "",
    receipt_no: "",
    seva_amount: "500",
    sahyogi_first_name: "",
    sahyogi_middle_name: "",
    sahyogi_last_name: "",
    sahyogi_number: "",
  });
  const [customAmount, setCustomAmount] = useState("");
  const [errors, setErrors] = useState({});

  // books assigned to me (for dropdown)
  const [myBooks, setMyBooks] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [booksError, setBooksError] = useState("");

  const toggle = () => setModal(!modal);

  // Load books assigned to this user when modal opens
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
        // console.log(rows,'sdsdcsdcsdcsdcsdcsdcsdcsdcsdcsdc')
        if (!ignore) setMyBooks(Array.isArray(rows) ? rows : []);
      } catch (e) {
        console.error("Fetch my books error:", e);
        if (!ignore) {
          setMyBooks([]);
          setBooksError("Unable to load your books.");
        }
      } finally {
        if (!ignore) setBooksLoading(false);
      }
    })();

    return () => { ignore = true; };
  }, [modal, mySevakCode]);

  // Fetch seva details to prefill
  useEffect(() => {
    if (!modal || !sevaId) return;

    let ignore = false;
    (async () => {
      try {
        setFetching(true);
        const res = await axios.post(`${BACKEND_ENDPOINT}seva/get_seva_by_id`, {
          seva_id: sevaId,
        });

        const raw = res?.data;
        const s = Array.isArray(raw) ? (raw[0] || {}) : (raw || {});

        const bookNo =
          s.book_no ??
          s.book_number ??
          sevakData?.book_no ??
          sevakData?.book_number ??
          "";

        const receipt =
          s.receipt_no ??
          s.receipt_no ??
          sevakData?.receipt_no ??
          sevakData?.receipt_no ??
          "";

        const first = s.sahyogi_first_name ?? sevakData?.sahyogi_first_name ?? "";
        const middle = s.sahyogi_middle_name ?? sevakData?.sahyogi_middle_name ?? "";
        const last = s.sahyogi_last_name ?? sevakData?.sahyogi_last_name ?? "";
        const phone = s.sahyogi_number ?? sevakData?.sahyogi_number ?? "";

        const amtRaw = String(s.seva_amount ?? sevakData?.seva_amount ?? "").trim();
        const isPreset = amtRaw === "500" || amtRaw === "1000";
        const nextSevaAmount = isPreset ? amtRaw : "other";
        const nextCustom = isPreset ? "" : (amtRaw || "");

        if (!ignore) {
          setFormData({
            book_no: String(bookNo),
            receipt_no: String(receipt),
            sahyogi_first_name: String(first),
            sahyogi_middle_name: String(middle),
            sahyogi_last_name: String(last),
            sahyogi_number: String(phone),
            seva_amount: nextSevaAmount,
          });
          setCustomAmount(nextCustom);
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
  }, [modal, sevaId, sevakData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If switching away from "other", clear the custom amount
    if (name === "seva_amount" && value !== "other") {
      setCustomAmount("");
    }

    // Basic digit-only enforcement for number-ish fields
    let nextValue = value;
    if (["receipt_no", "sahyogi_number"].includes(name)) {
      nextValue = value.replace(/[^\d]/g, "");
    }
    // NOTE: book_no comes from a dropdown now (string), don’t strip digits there.

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleCustomAmountChange = (e) => {
    const v = e.target.value.replace(/[^\d]/g, "");
    setCustomAmount(v);
    setFormData((prev) => ({ ...prev, seva_amount: "other" }));
  };

  const validateForm = () => {
    const formErrors = {};

    if (!formData.book_no) formErrors.book_no = "બુક નંબર પસંદ કરો";
    if (!formData.receipt_no) formErrors.receipt_no = "રસીદ નંબર લાખો";
    if (!formData.sahyogi_first_name) formErrors.sahyogi_first_name = "સહયોગી નું નામ લાખો";
    if (!formData.sahyogi_last_name) formErrors.sahyogi_last_name = "સહયોગી ની અટક લાખો";
    if (!formData.sahyogi_middle_name) formErrors.sahyogi_middle_name = "સહયોગી ના પિતા નું નામ લાખો";
    if (!formData.sahyogi_number) formErrors.sahyogi_number = "સહયોગી નો નંબર લાખો";

    if (formData.seva_amount === "other") {
      if (!customAmount) {
        formErrors.customAmount = "Custom amount is required";
      } else if (parseInt(customAmount, 10) <= 1000) {
        formErrors.customAmount = "રોકમ 1000 કરતા વધારે હોઈ તોજ લાખો";
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
      const res = await axios.put(`${BACKEND_ENDPOINT}seva/edit_seva`, {
        id: sevaId,
        sevak_id: mySevakCode,
        book_no: formData.book_no,
        receipt_no: formData.receipt_no,
        sahyogi_first_name: formData.sahyogi_first_name,
        sahyogi_middle_name: formData.sahyogi_middle_name,
        sahyogi_last_name: formData.sahyogi_last_name,
        sahyogi_number: formData.sahyogi_number || null,
        seva_amount: formData.seva_amount === "other" ? customAmount : formData.seva_amount,
      });

      // Show exactly what backend sent if available
      const okMsg = (res?.data && typeof res.data.message === "string")
        ? res.data.message
        : "Seva updated successfully";
      toast.success(okMsg);

      toggle();
      if (typeof refreshData === "function") refreshData();
    } catch (error) {
      console.error("Error editing seva:", error);

      const data = error?.response?.data;

      // Inline field errors, if backend provided them
      if (data?.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
        setErrors((prev) => ({ ...prev, ...data.errors }));
      }

      // Only show backend-provided message (no HTTP prefixes or fallbacks)
      const msg = getBackendMessage(error);
      if (msg) {
        toast.error(msg);
      }
      // else: do nothing (or keep a generic if you *really* want one)
      // else { toast.error("Failed to update seva."); }
    } finally {
      setLoader(false);
    }
  };

  // helper label like "12 (1–50)"
  const bookLabel = (b) => {
    const s = b?.start_no ?? "";
    const e = b?.end_no ?? "";
    const range = s || e ? ` (${s}–${e || "-"})` : "";
    return `${b?.book_no ?? ""}${range}`;
  };

  return (
    <div>
      <Modal isOpen={modal} toggle={toggle}>
        <ModalHeader toggle={toggle}>Edit Annkut Seva</ModalHeader>
        <ModalBody>
          {/* Book selector (dropdown) */}
          <FormControl fullWidth variant="outlined" margin="normal" size="small">
            <InputLabel id="book-no-select-label">બુક નંબર</InputLabel>
            <Select
              labelId="book-no-select-label"
              label="બુક નંબર"
              name="book_no"
              value={formData.book_no}
              onChange={handleChange}
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
              {/* Fallback: if existing seva has a book that isn’t in my current list (e.g. historical),
                  ensure it is still selectable */}
              {formData.book_no &&
                !myBooks.some((b) => String(b.book_no) === String(formData.book_no)) && (
                  <MenuItem value={String(formData.book_no)}>
                    {String(formData.book_no)} (current)
                  </MenuItem>
                )}
            </Select>
            {errors.book_no && (
              <div style={{ color: "#d32f2f", fontSize: 12, marginTop: 4 }}>{errors.book_no}</div>
            )}
          </FormControl>

          <FormControl fullWidth variant="outlined" margin="normal">
            <TextField
              label="રસીદ નંબર"
              name="receipt_no"
              type="text"
              value={formData.receipt_no}
              onChange={handleChange}
              variant="outlined"
              color="secondary"
              error={!!errors.receipt_no}
              helperText={errors.receipt_no}
              required
              fullWidth
              inputProps={{ inputMode: "numeric" }}
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
              inputProps={{ inputMode: "numeric", pattern: "[0-9]{10}", maxLength: 10 ,minLength:10 }}
            />
          </FormControl>

          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">Amount</FormLabel>
            <RadioGroup
              name="seva_amount"
              value={formData.seva_amount}
              onChange={handleChange}
            >
              <FormControlLabel value="500" control={<Radio color="secondary" />} label="500" />
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

      <ToastContainer position="top-center" autoClose={5000} pauseOnHover theme="colored" />
    </div>
  );
}

export default EditSevaModal;
