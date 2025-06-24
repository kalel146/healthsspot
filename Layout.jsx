import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { HiMenu } from "react-icons/hi";

export default function Layout({ isOpen, setIsOpen }) {
  const location = useLocation();
  const isLanding = location.pathname === "/" || location.pathname === "/sign-in" || location.pathname === "/sign-up";

  // Auto-collapse logic on screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize(); // initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  return (
    <div className="flex min-h-screen w-full">
      {!isLanding && (
        <>
          {/* Overlay for mobile */}
          {isOpen && (
            <div
              className="fixed inset-0 z-30 bg-black bg-opacity-50 backdrop-blur-sm md:hidden"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Sidebar with dynamic width */}
          <div
            className={`${isOpen ? "w-64" : "w-0 md:w-64"} transition-all duration-300 overflow-hidden fixed md:static z-40 h-full`}
          >
            <Navbar isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </div>

          {/* Toggle Button always visible */}
          <button
            className="fixed top-4 left-4 z-50 p-2 bg-yellow-500 rounded md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            <HiMenu className="text-black text-xl" />
          </button>
        </>
      )}

      {/* Main content area with padding if sidebar is visible on desktop */}
      <div className={`flex-1 ${!isLanding ? "md:ml-64" : ""} transition-all duration-300`}>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
