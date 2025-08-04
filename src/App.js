import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import AnnkutSevakList from "./pages/AnnkutSevakList";
import MandalSevakList from "./pages/MandalSevakList";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
        <Routes>
          <Route path="/home" element={<Home />} />
        </Routes>
        <Routes>
          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
        <Routes>
          <Route path="/annkut-sevak-list" element={<AnnkutSevakList />} />
        </Routes>
        <Routes>
          <Route path="/mandal-sevak-list" element={<MandalSevakList />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
