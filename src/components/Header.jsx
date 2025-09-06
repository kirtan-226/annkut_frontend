import React, { useState } from "react";
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  NavbarText,
  Button,
} from "reactstrap";
import { useNavigate } from "react-router-dom";

function Header(props) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggle = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    localStorage.removeItem("sevakDetails");
    navigate("/");
  };
  const handleSevakView = () => {
    navigate("/annkut-sevak-list");
    // props.setSevakView(!props.sevakView);
  };
  const handleReceiptbook = () => {
    navigate("/receipt-books");
  };

  const handleView = () => {
    navigate("/home");
    // props.setSevakView(!props.sevakView);
  };

  const sevakDetails = JSON.parse(localStorage.getItem("sevakDetails"));
  const role = sevakDetails.role;
  console.log(role,'role');
  return (
    <div>
      <Navbar
        style={{ background: "#ED3237", marginBottom: "7px", zIndex: 1000 }}
      >
        <NavbarBrand style={{ color: "#ffffffff" }} href="/">
          Annkut 2025
        </NavbarBrand>
        
          <NavbarToggler style={{ background: "#ffffff" }} onClick={toggle} />
          <Collapse isOpen={isOpen} navbar>
            <Nav className="me-auto" navbar>
              {role !== "Sevak" && (
              <>
                {role !== "Sant Nirdeshak" && (
                  <>
                    <NavItem style={{ margin: "5px" }}>
                      <Button color="warning" onClick={handleView}>
                        Annkut Seva
                      </Button>
                    </NavItem>
                    {/* {(role !== "Admin" ) && ( */}
                    <NavItem style={{ margin: "5px" }}>
                      <Button color="primary" onClick={handleSevakView}>
                        Annkut Sevak list
                      </Button>
                    </NavItem>
                    {/* // )} */}
                    {(role === "Admin" || role === "Sanchalak") && (
                      <NavItem style={{ margin: "5px" }}>
                        <Button color="secondary" onClick={handleReceiptbook}>
                          Manage Receipt Books
                        </Button>
                      </NavItem>
                    )}
                  </>
                )}
              </>
            )}
              <NavItem style={{ margin: "5px" }}>
                <Button
                  style={{
                    background: "#ffffff",
                    color: "black",
                    fontWeight: "bold",
                  }}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </NavItem>
            </Nav>
          </Collapse>
      </Navbar>
    </div>
  );
}

export default Header;
