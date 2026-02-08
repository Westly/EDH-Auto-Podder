import React from "react";

export default function About() {
  return (
    <div className="pageCard">
      <h2>About Auto Podder</h2>
      <p>
        Auto Podder is a lightweight, local-only organizer for in-store Commander pods. It is designed to make
        seating fast, visual, and easy to adjust.
      </p>

      <h3>How it works</h3>
      <ul>
        <li><b>Add players</b> to the pool and select a bracket/category for each player.</li>
        <li><b>Create groups</b> by dragging a player onto another player, or use the Groups box to create an empty group.</li>
        <li><b>Seat players</b> by dragging individuals or groups into table seats.</li>
        <li><b>Auto</b> fills open seats using nearest-peer matching while keeping seated players in place.</li>
        <li><b>Undo/Redo</b> helps you quickly correct a mis-drop or try a different layout.</li>
      </ul>

      <h3>Privacy</h3>
      <p>
        Auto Podder runs entirely in your browser. Your data is stored locally (via localStorage) and is not sent to any server.
        You can export or import a JSON file if you want to save or reuse a setup.
      </p>
    </div>
  );
}
