import React from "react";

export default function About() {
  return (
    <div className="pageCard">
      <h2>About</h2>
      <p>
        FNM Podder is a local-only Commander pod organizer. It stores all data in your browser
        (localStorage) and never calls a backend.
      </p>
      <ul>
        <li>Drag players & groups into seats</li>
        <li>Connect Mode to create groups from two players</li>
        <li>Auto Pod fills open seats deterministically without moving seated players</li>
        <li>Undo/Redo + Export/Import</li>
      </ul>
    </div>
  );
}
