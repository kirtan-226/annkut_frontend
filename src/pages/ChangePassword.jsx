import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { BACKEND_ENDPOINT } from "../api/api";

const ChangePassword = () => {
  const [loader, setLoader] = useState(false);
  const [passwordData, setPasswordData] = useState({
    sevak_id: "",
    phone_number: "",
    password: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    setLoader(true);
    e.preventDefault();
    try {
      const res = await axios.post(
        `${BACKEND_ENDPOINT}login/forgot_password`,
        passwordData
      );

      if (res.data.status === true) {
        toast.success(res.data.message);
        navigate("/");
      } else {
        toast.error("Change Password Failed: " + res.data.message);
      }
    } catch (error) {
      toast.error("An error occurred: " + error.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <>
      <div className="password-container">
        <div className="password-card">
          <form onSubmit={handleSubmit}>
            <h1>Change Password</h1>
            <label>Sevak Id:</label>
            <input
              type="text"
              name="sevak_id"
              onChange={handleChange}
              value={passwordData.sevak_id}
              required
            />
            <label>Phone Number:</label>
            <input
              type="number"
              name="phone_number"
              onChange={handleChange}
              value={passwordData.phone_number}
              required
            />
            <label>New Password:</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              value={passwordData.password}
              required
            />
            <button
              type="submit"
              disabled={loader}
              className="password-btn"
            >
              {loader ? "Loading..." : "Change Password"}
            </button>

            <p className="back-to-login-link">
              <Link to="/" className="link">
                Back to Login
              </Link>
            </p>
            <ToastContainer
              position="top-center"
              autoClose={5000}
              closeOnClick
              pauseOnHover
              theme="colored"
            />
          </form>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;
