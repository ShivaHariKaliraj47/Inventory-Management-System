import { useEffect, useRef, useState } from "react";
import { Delete, X } from "lucide-react";

const initial = { display: "0", stored: null, operator: null, fresh: false };

function calculate(left, right, operator) {
  switch (operator) {
    case "+": return left + right;
    case "−": return left - right;
    case "×": return left * right;
    case "÷": return right === 0 ? NaN : left / right;
    default: return right;
  }
}

function result(value) {
  return Number.isFinite(value) ? String(Number(value.toPrecision(12))) : "Error";
}

export default function Calculator({ onClose }) {
  const [calc, setCalc] = useState(initial);
  const panelRef = useRef(null);

  useEffect(() => { panelRef.current?.focus(); }, []);

  const press = key => {
    setCalc(prev => {
      if (key === "AC") return initial;
      if (key === "⌫") return { ...prev, display: prev.fresh || prev.display.length <= 1 || prev.display === "Error" ? "0" : prev.display.slice(0, -1), fresh: false };
      if (key === "±") return { ...prev, display: prev.display === "0" || prev.display === "Error" ? prev.display : prev.display.startsWith("-") ? prev.display.slice(1) : `-${prev.display}` };
      if (key === "%") return { ...prev, display: result(Number(prev.display) / 100) };
      if (/^[0-9.]$/.test(key)) {
        const base = prev.fresh || prev.display === "Error" ? "0" : prev.display;
        if (key === "." && base.includes(".")) return prev;
        return { ...prev, ...(prev.display === "Error" ? { stored: null, operator: null } : {}), display: key === "." ? `${base}.` : base === "0" ? key : base === "-0" ? `-${key}` : `${base}${key}`, fresh: false };
      }
      if (["+", "−", "×", "÷"].includes(key)) {
        if (prev.display === "Error") return prev;
        const value = prev.operator && !prev.fresh ? calculate(prev.stored, Number(prev.display), prev.operator) : Number(prev.display);
        return Number.isFinite(value) ? { display: result(value), stored: value, operator: key, fresh: true } : { display: "Error", stored: null, operator: null, fresh: true };
      }
      if (key === "=" && prev.operator && !prev.fresh) {
        return { display: result(calculate(prev.stored, Number(prev.display), prev.operator)), stored: null, operator: null, fresh: true };
      }
      return prev;
    });
  };

  const handleKeyDown = e => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "Enter" && e.target instanceof HTMLButtonElement) return;
    const key = { Enter: "=", Backspace: "⌫", "*": "×", "/": "÷", "-": "−", c: "AC" }[e.key] || e.key;
    if (/^[0-9.]$/.test(key) || ["+", "−", "×", "÷", "=", "⌫", "AC", "%"].includes(key)) {
      e.preventDefault();
      press(key);
    }
  };

  const keys = ["AC", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "⌫", "0", ".", "="];

  return (
    <div ref={panelRef} tabIndex={-1} onKeyDown={handleKeyDown} role="dialog" aria-label="Calculator" style={{ padding: 14, outline: "none", background: "var(--card)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--foreground)" }}>Ledger Calculator</span>
        <button type="button" aria-label="Close calculator" onClick={onClose} style={{ border: 0, background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", padding: 2 }}><X size={15} /></button>
      </div>
      <div aria-live="polite" style={{ background: "var(--surface-subtle)", border: "1px solid var(--border)", borderRadius: 4, padding: "8px 12px", textAlign: "right", marginBottom: 10, overflow: "hidden" }}>
        <div style={{ height: 14, fontSize: "10.5px", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{calc.operator && `${calc.stored} ${calc.operator}`}</div>
        <div className="mono" style={{ fontSize: "1.45rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "auto", color: "var(--foreground)" }}>{calc.display}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {keys.map(key => {
          const operator = ["÷", "×", "−", "+", "="].includes(key);
          const isEquals = key === "=";
          return <button key={key} type="button" onClick={() => press(key)} aria-label={key === "⌫" ? "Backspace" : key}
            style={{
              height: 36,
              borderRadius: 4,
              border: "1px solid var(--border)",
              background: isEquals ? "var(--primary)" : operator ? "var(--surface-subtle)" : "var(--card)",
              color: isEquals ? "#fff" : operator ? "var(--primary)" : "var(--foreground)",
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: operator ? 600 : 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 80ms ease"
            }}>
            {key === "⌫" ? <Delete size={15} /> : key}
          </button>;
        })}
      </div>
    </div>
  );
}
