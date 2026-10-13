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
    <div ref={panelRef} tabIndex={-1} onKeyDown={handleKeyDown} role="dialog" aria-label="Calculator" style={{ padding: 16, outline: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: "DM Sans", fontSize: "0.9rem", fontWeight: 700 }}>Calculator</span>
        <button type="button" aria-label="Close calculator" onClick={onClose} style={{ border: 0, background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", display: "flex", padding: 3 }}><X size={17} /></button>
      </div>
      <div aria-live="polite" style={{ background: "var(--muted)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px 13px", textAlign: "right", marginBottom: 12, overflow: "hidden" }}>
        <div style={{ height: 16, fontSize: "0.68rem", color: "var(--muted-foreground)" }}>{calc.operator && `${calc.stored} ${calc.operator}`}</div>
        <div className="mono" style={{ fontSize: "1.6rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "auto" }}>{calc.display}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 7 }}>
        {keys.map(key => {
          const operator = ["÷", "×", "−", "+", "="].includes(key);
          return <button key={key} type="button" onClick={() => press(key)} aria-label={key === "⌫" ? "Backspace" : key}
            style={{ height: 43, borderRadius: 7, border: "1px solid var(--border)", background: key === "=" ? "var(--primary)" : operator ? "#e6f5f2" : "var(--muted)", color: key === "=" ? "#fff" : operator ? "var(--primary-dark)" : "var(--foreground)", fontFamily: "Inter", fontSize: "0.95rem", fontWeight: operator ? 700 : 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {key === "⌫" ? <Delete size={17} /> : key}
          </button>;
        })}
      </div>
    </div>
  );
}
