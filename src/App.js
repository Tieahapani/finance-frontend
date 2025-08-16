// App.js
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./App.css";

const BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5001";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [categories, setCategories] = useState({ });
  const [newCategory, setNewCategory] = useState("");
  const [categoryTotals, setCategoryTotals] = useState({});
  const [monthlyTotal, setMonthlyTotal] = useState(null);
  const [error, setError] = useState(null);
  const inputRefs = useRef({});
  const [lastAdded, setLastAdded] = useState({ category: null, index: null });

  const exportToExcel = () => {
    if (!monthlyTotal) return;

    const rows = Object.entries(categoryTotals).map(([category, amount]) => ({
      Category: category,
      Amount: `$${amount.toFixed(2)}`,
    }));

    rows.push({ Category: "Total", Amount: `$${monthlyTotal.toFixed(2)}` });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Budget");

    const monthStr = selectedDate
      .toLocaleString("default", { month: "long", year: "numeric" })
      .replace(" ", "-");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `Budget-${monthStr}.xlsx`);
  };

  useEffect(() => {
    const totals = {};
    for (const [cat, items] of Object.entries(categories)) {
      totals[cat] = items.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    }
    setCategoryTotals(totals);
  }, [categories]);

  useEffect(() => {
    const { category, index } = lastAdded;
    if (category !== null) {
      const el = inputRefs.current[category]?.[index];
      if (el) el.focus();
      setLastAdded({ category: null, index: null });
    }
  }, [lastAdded, categories]);

  const handleItemChange = (category, idx, val) => {
    setCategories(prev => {
      const copy = [...prev[category]];
      copy[idx] = val;
      return { ...prev, [category]: copy };
    });
  };

  const addItemToCategory = category => {
    setCategories(prev => {
      const copy = [...prev[category], ""];
      return { ...prev, [category]: copy };
    });
    setLastAdded({ category, index: categories[category].length });
  };

  const removeItemFromCategory = (category, idx) => {
    setCategories(prev => {
      const copy = [...prev[category]];
      copy.splice(idx, 1);
      return { ...prev, [category]: copy.length ? copy : [""] };
    });
  };

  const addCategory = () => {
    if (newCategory && !categories[newCategory]) {
      setCategories(prev => ({ ...prev, [newCategory]: [""] }));
      setNewCategory("");
    }
  };

  const removeCategory = category => {
    setCategories(prev => {
      const copy = { ...prev };
      delete copy[category];
      return Object.keys(copy).length ? copy : { Personal: [""] };
    });
  };

  const calculateMonthlyTotal = async () => {
    try {
      const totals = {};
      for (const [cat, items] of Object.entries(categories)) {
        totals[cat] = items.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
      }
      const monthString = `${selectedDate.getFullYear()}-${String(
        selectedDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const res = await fetch(`${BASE}/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthString, categories: totals }),
      });
      const data = await res.json();
      if (res.ok) {
        setMonthlyTotal(data.total);
        setError(null);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Cannot connect to the backend");
    }
  };

  const fmtMonth = date =>
    date.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="container">
      <aside className="sidebar">
        <h2>📅 Select Month</h2>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          view="month"
          showNavigation
          className="calendar-widget"
          onActiveStartDateChange={({ activeStartDate, view }) => {
            if (view === "month") {
              setSelectedDate(activeStartDate);
            }
          }}
        />
      </aside>

      <main className="main">
        <header className="main-header">
          <h1>📊 Monthly Budget Planner</h1>
          <p className="subtitle">Plan expenses for every month</p>
        </header>

        <div className="new-category">
          <input
            type="text"
            placeholder="Add new category"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
          />
          <button onClick={addCategory}>➕</button>
        </div>

        <div className="category-list">
          {Object.entries(categories).map(([cat, items]) => (
            <div key={cat} className="category-card">
              <h3>
                {cat}
                <button onClick={() => removeCategory(cat)}>🗑️</button>
              </h3>
              {items.map((val, idx) => (
                <div className="input-with-dollar" key={idx}>
                  <input
                    type="number"
                    placeholder={`Item ${idx + 1}`}
                    value={val}
                    onChange={e => handleItemChange(cat, idx, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && idx === items.length - 1) {
                        e.preventDefault();
                        addItemToCategory(cat);
                      }
                    }}
                    onKeyUp={e => {
                      if (
                        e.key === "Backspace" &&
                        e.target.value === "" &&
                        items.length > 1
                      ) {
                        removeItemFromCategory(cat, idx);
                      }
                    }}
                    ref={el => {
                      if (!inputRefs.current[cat]) inputRefs.current[cat] = [];
                      inputRefs.current[cat][idx] = el;
                    }}
                  />
                </div>
              ))}
              <div className="category-total">
                <span>Total:</span>
                <input readOnly value={categoryTotals[cat] || 0} />
              </div>
            </div>
          ))}
        </div>

        <div className="calculate-row">
          <button onClick={calculateMonthlyTotal}>
            📅 Calculate for {fmtMonth(selectedDate)}
          </button>

          {monthlyTotal !== null && (
            <div className="result">
              ✅ {fmtMonth(selectedDate)} Total: ${monthlyTotal}
            </div>
          )}

          {monthlyTotal !== null && (
            <button onClick={exportToExcel} style={{ marginTop: "1rem" }}>
              📥 Export to Excel
            </button>
          )}

          {error && <div className="error">❌ {error}</div>}
        </div>
      </main>
    </div>
  );
}

export default App;
