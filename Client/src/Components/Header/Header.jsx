import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Appstate } from "../../Pages/Appstate";

import "./Header.css";

const Header = () => {
  const { user, setUser } = useContext(Appstate);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("userid");
    setUser({});
    navigate("/login");
  };

  return (
    <header className="header static_position">
      <div className="header-left">
      
        <Link to="/home">
          <div className="logo">
            <img src="/logo.png" alt="Evangadi Logo" />
           
          </div>
        </Link>
      </div>

      <nav className="nav">
        <Link to="/home">Home</Link>
        <Link to="/how-it-works">How it works</Link>{" "}
       
        {!user?.username ? (
          <button className="signin-btn" onClick={() => navigate("/login")}>
            Signin
          </button>
        ) : (
          <button className="signin-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;

