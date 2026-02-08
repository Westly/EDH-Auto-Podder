import React from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./routes/Home";
import About from "./routes/About";
import { ToastHost } from "./components/Toasts";
import { useAppState } from "./state/StateProvider";
import { toast } from "./components/Toasts";

export default function App() {
  const { dispatch } = useAppState();

  const onReset = () => {
    const ok = window.confirm(
      "Reset the app? This clears all tables, seated players, groups, and the player pool (like the cache was cleared)."
    );
    if (!ok) return;
    dispatch({ type: "RESET_APP" });
    toast("App reset.");
  };

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="brand">
          <div className="brandMark">EDH</div>
          <div className="brandText">
            <div className="brandTitle">EDH Auto Podder</div>
            <div className="brandSub">Commander pod organizer</div>
          </div>
        </div>

        <div className="headerRight">
          <nav className="nav">
            <NavLink className="navLink" to="/">
              Home
            </NavLink>
            <NavLink className="navLink" to="/about">
              About
            </NavLink>
          </nav>
          <button className="btn btnDanger" onClick={onReset} title="Reset app">
            Reset
          </button>
        </div>
      </header>

      <main className="appMain">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      <ToastHost />
    </div>
  );
}
