import React, { useEffect, useState } from "react";

type ToastMsg = { id: string; text: string };

let listeners: Array<(msg: ToastMsg) => void> = [];
let toastCounter = 0;

export function toast(text: string) {
  toastCounter += 1;
  const msg: ToastMsg = { id: String(Date.now()) + ":" + String(toastCounter), text };
  for (const l of listeners) l(msg);
}

export function ToastHost() {
  const [items, setItems] = useState<ToastMsg[]>([]);
  useEffect(() => {
    const on = (msg: ToastMsg) => {
      setItems(prev => [msg, ...prev].slice(0, 5));
      window.setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== msg.id));
      }, 2200);
    };
    listeners.push(on);
    return () => {
      listeners = listeners.filter(l => l !== on);
    };
  }, []);

  return (
    <div className="toastHost" aria-live="polite" aria-relevant="additions removals">
      {items.map(t => (
        <div className="toast" key={t.id}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
