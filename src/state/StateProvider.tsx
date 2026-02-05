import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { AppState } from "./model";
import { appReducer, Action } from "./reducer";
import { clearState, loadState, saveState } from "./storage";
import { uuid } from "../utils/ids";

type HistoryState = {
  present: AppState;
  past: AppState[];
  future: AppState[];
};

type Ctx = {
  state: AppState;
  dispatch: (action: Action | { type: "UNDO" } | { type: "REDO" } | { type: "RESET_APP" }) => void;
  canUndo: boolean;
  canRedo: boolean;
};

const StateContext = createContext<Ctx | null>(null);

function defaultState(): AppState {
  const baseIndex = 1;
  const cats = [
    { categoryId: uuid(), name: "Beginner", color: "#60a5fa", rank: 1, createdIndex: baseIndex + 1 },
    { categoryId: uuid(), name: "Casual", color: "#34d399", rank: 2, createdIndex: baseIndex + 2 },
    { categoryId: uuid(), name: "Advanced", color: "#fbbf24", rank: 3, createdIndex: baseIndex + 3 },
    { categoryId: uuid(), name: "High Power", color: "#fb7185", rank: 4, createdIndex: baseIndex + 4 }
  ];
  return {
    version: 1,
    categories: cats,
    players: [],
    groups: [],
    tables: [],
    connectMode: { enabled: false, selectedPlayerIds: [] },
    counters: { createdIndex: baseIndex + 10 },
    lastAutoPodSummary: undefined
  };
}

function historyReducer(
  state: HistoryState,
  action: Action | { type: "UNDO" } | { type: "REDO" } | { type: "RESET_APP" }
): HistoryState {
  if (action.type === "UNDO") {
    if (state.past.length === 0) return state;
    const prev = state.past[state.past.length - 1];
    const past = state.past.slice(0, -1);
    return { present: prev, past, future: [state.present, ...state.future].slice(0, 20) };
  }
  if (action.type === "REDO") {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const future = state.future.slice(1);
    return { present: next, past: [...state.past, state.present].slice(-20), future };
  }

  if (action.type === "RESET_APP") {
    // Full reset: clear all tables/players/groups and start fresh.
    return { present: defaultState(), past: [], future: [] };
  }

  const newPresent = appReducer(state.present, action);
  if (newPresent === state.present) return state;

  return {
    present: newPresent,
    past: [...state.past, state.present].slice(-20),
    future: []
  };
}

export function StateProvider({ children }: { children: React.ReactNode }) {
  const initial = loadState() ?? defaultState();
  const [hist, dispatch0] = useReducer(historyReducer, { present: initial, past: [], future: [] });

  // Wrap dispatch so RESET_APP also clears persisted storage.
  const dispatch = (action: Action | { type: "UNDO" } | { type: "REDO" } | { type: "RESET_APP" }) => {
    if (action.type === "RESET_APP") {
      clearState();
    }
    dispatch0(action as any);
  };

  const persistRef = useRef<number | null>(null);
  useEffect(() => {
    if (persistRef.current) window.clearTimeout(persistRef.current);
    persistRef.current = window.setTimeout(() => {
      saveState(hist.present);
    }, 50);
  }, [hist.present]);

  const ctx = useMemo<Ctx>(() => {
    return {
      state: hist.present,
      dispatch,
      canUndo: hist.past.length > 0,
      canRedo: hist.future.length > 0
    };
  }, [hist, dispatch]);

  return <StateContext.Provider value={ctx}>{children}</StateContext.Provider>;
}

export function useAppState() {
  const v = useContext(StateContext);
  if (!v) throw new Error("useAppState must be used within StateProvider");
  return v;
}
