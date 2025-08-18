import React from "react"; 
import {Bar} from "react-chartjs-2";
import { useNavigate, useLocation } from "react-router-dom"; 

function SummaryPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { monthlyData, currency} = location.state || {}; 

    const months = Object.keys(monthlyData || {}).sort();
  const monthA = months[months.length - 2];
  const monthB = months[months.length - 1];

  if (!monthA || !monthB) {
    return (
      <div className="summary-page">
        <h2>📊 Monthly Summary</h2>
        <p>Not enough months calculated yet. Please go back and calculate at least 2 months.</p>
        <button onClick={() => navigate("/")}>⬅ Back to Planner</button>
      </div>
    );
  }

  const labels = Array.from(new Set([
    ...Object.keys(monthlyData[monthA]?.categories || {}),
    ...Object.keys(monthlyData[monthB]?.categories || {})
  ]));

  const barData = {
    labels,
    datasets: [
      {
        label: monthA,
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        data: labels.map(cat => monthlyData[monthA]?.categories[cat] || 0),
      },
      {
        label: monthB,
        backgroundColor: "rgba(234, 88, 12, 0.7)",
        data: labels.map(cat => monthlyData[monthB]?.categories[cat] || 0),
      },
    ]
  };

  return (
    <div className="summary-page" style={{ padding: "2rem" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: "1.5rem" }}>⬅ Back to Planner</button>
      <h2>📊 Monthly Summary</h2>

      <div style={{ maxWidth: "100%", marginTop: "2rem" }}>
        <Bar data={barData} />
      </div>

      <h3 style={{ marginTop: "2rem" }}>🧾 Category-wise Spending ({monthB})</h3>
      <ul>
        {Object.entries(monthlyData[monthB]?.categories || {}).map(([cat, amt]) => (
          <li key={cat}>
            <strong>{cat}:</strong> {currency}{amt}
          </li>
        ))}
      </ul>
    </div>
  );

}

export default SummaryPage; 