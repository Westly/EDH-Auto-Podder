import React from "react";
import { useAppState } from "../state/StateProvider";
import { downloadText } from "../utils/download";
import { zAppState } from "../state/schema";
import { toast } from "./Toasts";
import { openPrintView } from "../utils/print";

export function TopBar({ onAutoPod, seatedCount }: { onAutoPod: () => void; seatedCount: number }) {
  const { state, dispatch, canUndo, canRedo } = useAppState();

  const exportJson = () => {
    const file = `fnm_podder_export_${new Date().toISOString().slice(0, 10)}.json`;
    downloadText(file, JSON.stringify(state, null, 2));
    toast("Exported.");
  };

  const importJson = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const obj = JSON.parse(text);
        const parsed = zAppState.safeParse(obj);
        if (!parsed.success) return toast("Import failed (schema).");
        dispatch({ type: "IMPORT_STATE", snapshot: parsed.data });
        toast("Imported.");
      } catch {
        toast("Import failed (JSON).");
      }
    };
    input.click();
  };

  return (
    <div className="sectionHeader" style={{ borderRadius: 14 }}>
      <h3>FNM Podder</h3>
      <div className="btnRow">
        <button className="btn btnPrimary" onClick={onAutoPod}>Auto</button>

        <button className="btn" onClick={() => openPrintView(state)} title="Print seating">
          Print
        </button>

        <button className="btn iconBtn" onClick={() => dispatch({ type: "UNDO" })} disabled={!canUndo} title="Undo">↶</button>
        <button className="btn iconBtn" onClick={() => dispatch({ type: "REDO" })} disabled={!canRedo} title="Redo">↷</button>

        <button className="btn" onClick={exportJson}>Export</button>
        <button className="btn" onClick={importJson}>Import</button>

        <span className="kbdHint">Seated: {seatedCount}</span>
      </div>
    </div>
  );
}
