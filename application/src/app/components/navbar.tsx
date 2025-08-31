"use client";

import React from "react";
import { signOut } from "next-auth/react";
const Navbar = () => {
  // Navbar container style
  const navbarStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    background: "linear-gradient(135deg, #fbc2eb, #a6c1ee)",
    borderRadius: "16px",
    margin: "16px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  };

  // Logo style
  const logoStyle = {
    fontWeight: "bold",
    fontSize: "1.8rem",
    color: "#fff",
    letterSpacing: "1px",
  };

  // Navigation links container
  const navLinksStyle = {
    listStyle: "none",
    display: "flex",
    gap: "20px",
    margin: 0,
    padding: 0,
  };

  // Link button style
  const linkStyle = {
    textDecoration: "none",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "12px",
    fontWeight: "500",
    transition: "all 0.3s ease",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  };

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.currentTarget as HTMLAnchorElement;
  target.style.background = "rgba(255, 255, 255, 0.2)";
  target.style.transform = "translateY(-2px) scale(1.05)";
  target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.2)";
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
     const target = e.currentTarget as HTMLAnchorElement; 
  target.style.background = "rgba(255, 255, 255, 0.2)";
  target.style.transform = "translateY(-2px) scale(1.05)";
  target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.2)";
  };
  
 const handleLogout = async () => {
    // Sign out the user and redirect to homepage
    await signOut({ callbackUrl: "/" });
  };
return (
  <nav style={navbarStyle}>
    <div style={logoStyle}>🌸 MyApp</div>
    <ul style={navLinksStyle}>
      {[
        { item: "Flag", location: "/dashboard/flags" },
        { item: "Audit logs", location: "/dashboard/auditlog" }
      ].map((navItem) => (
        <li key={navItem.item}>
          <a
            href={navItem.location}
            style={linkStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {navItem.item}
          </a>
        </li>
      ))}
      <li>
         <a
            href={"/"}
            style={linkStyle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={()=>{handleLogout()}}
          >
            {"logut"}
          </a>
      </li>
    </ul>
  </nav>

);
}
export default Navbar;
