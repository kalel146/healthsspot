import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        backgroundColor: "#111",
        color: "white",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "2px solid #333",
        position: "sticky",
        top: 0,
        zIndex: 999,
      }}
    >
      <div style={{ fontWeight: "bold", fontSize: "1.5rem", color: "#f97316" }}>
        Health's Spot
      </div>

      <div style={{ display: "flex", gap: "2rem" }}>
        <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
        <Link to="/training" style={linkStyle}>Strength</Link>
        <Link to="/cardio" style={linkStyle}>Cardio</Link>
        <Link to="/nutrition" style={linkStyle}>Nutrition</Link>
        <Link to="/recovery" style={linkStyle}>Recovery</Link>
        <Link to="/export" style={linkStyle}>Export</Link>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  fontWeight: "bold",
  fontSize: "1rem",
};
