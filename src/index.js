import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import SummaryPage from "./summarypage"; // ✅ fixed path

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/summary" element={<SummaryPage />} />
    </Routes>
  </BrowserRouter>
);
