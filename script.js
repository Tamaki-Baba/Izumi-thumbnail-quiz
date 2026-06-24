/* ====== 初期データ ====== */
let shifts = JSON.parse(localStorage.getItem("shifts") || "{}");
let workplaces = JSON.parse(localStorage.getItem("workplaces") || "{}");
let goals = JSON.parse(localStorage.getItem("goals") || JSON.stringify({ monthly: {}, yearly: {} }));
let actuals = JSON.parse(localStorage.getItem("actuals") || JSON.stringify({ monthly: {}, yearly: {} }));

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

/* ====== 共通保存 ====== */
function saveAll() {
  localStorage.setItem("shifts", JSON.stringify(shifts));
  localStorage.setItem("workplaces", JSON.stringify(workplaces));
  localStorage.setItem("goals", JSON.stringify(goals));
  localStorage.setItem("actuals", JSON.stringify(actuals));
}

/* ====== ヘルパー ====== */
function parseDateKeyToDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
function parseTimeToDecimal(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + (m || 0) / 60;
}
function overlapLength(start, end, rangeStart, rangeEnd) {
  const s = Math.max(start, rangeStart);
  const e = Math.min(end, rangeEnd);
  return Math.max(0, e - s);
}

/* ====== 初期化 ====== */
document.addEventListener("DOMContentLoaded", () => {
  /* === タブ切り替え === */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.tab).classList.add("active");

      if (btn.dataset.tab === "salary") {
        updateSalaryMonthLabel();
        updateMonthlyUI();
        updateYearlyUI();
      }
    });
  });

  /* === カレンダー === */
  createCalendar(currentYear, currentMonth);

  document.getElementById("prevMonth").onclick = () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    refreshCalendarAndSalary();
  };
  document.getElementById("nextMonth").onclick = () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    refreshCalendarAndSalary();
  };
  function refreshCalendarAndSalary() {
    createCalendar(currentYear, currentMonth);
    updateShiftList();
    updateSalaryMonthLabel();
    updateSalarySummary();
    updateMonthlyUI();
  }
  /* === 月間給料タブの前月・翌月ボタン === */
document.getElementById("prevSalaryMonth").onclick = () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  updateSalaryMonthLabel();
  updateMonthlyUI();
  updateSalarySummary();
};
document.getElementById("nextSalaryMonth").onclick = () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  updateSalaryMonthLabel();
  updateMonthlyUI();
  updateSalarySummary();
};


  /* === 年間切替 === */
  document.getElementById("prevYearBtn").onclick = () => { currentYear--; updateYearlyUI(); };
  document.getElementById("nextYearBtn").onclick = () => { currentYear++; updateYearlyUI(); };

  /* === モーダル === */
  document.getElementById("closeModal").onclick = () => {
    document.getElementById("shiftModal").style.display = "none";
  };

  /* === シフト登録 === */
  document.getElementById("saveShift").onclick = () => {
    const date = document.getElementById("modalDate").textContent;
    const workplace = document.getElementById("shiftWorkplace").value;
    const time = document.getElementById("shiftTime").value.trim();
    const breakTime = +document.getElementById("breakTime").value || 0;
    const deduction = +document.getElementById("deduction").value || 0;
    const bonus = +document.getElementById("bonus").value || 0;
    if (!workplace || !time.includes("-")) return alert("勤務先と勤務時間を正しく入力してください。");

    shifts[date] = { workplace, time, breakTime, deduction, bonus };
    saveAll();
    document.getElementById("shiftModal").style.display = "none";
    refreshCalendarAndSalary();
  };

  /* === シフト削除 === */
  document.getElementById("deleteShift").onclick = () => {
    const date = document.getElementById("modalDate").textContent;
    if (confirm(`${date} のシフトを削除しますか？`)) {
      delete shifts[date];
      saveAll();
      document.getElementById("shiftModal").style.display = "none";
      refreshCalendarAndSalary();
    }
  };


  /* === サブタブ（月／年） === */
document.querySelectorAll(".sub-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    // 全ボタン・全コンテンツの active をリセット
    document.querySelectorAll(".sub-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".sub-tab-content").forEach(c => {
      c.classList.remove("active");
      c.style.display = "none"; // ← display を強制的に none
    });

    // クリックしたボタン・対応コンテンツを有効化
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.target);
    target.classList.add("active");
    target.style.display = "block"; // ← 表示に切り替え

    // 表示内容を更新
    if (btn.dataset.target === "monthly") updateMonthlyUI();
    else updateYearlyUI();
  });
});

// 初期状態の整合性を取る（ロード時）
document.querySelectorAll(".sub-tab-content").forEach(c => {
  c.style.display = c.classList.contains("active") ? "block" : "none";
});


  /* === 目標保存 === */
  document.getElementById("saveMonthlyGoal").onclick = () => {
  const key = `${currentYear}-${currentMonth + 1}`;
  const newGoal = +document.getElementById("monthlyGoal").value || 0;
  goals.monthly[key] = newGoal;

  // 🔁 自動反映設定：翌月以降が未設定なら同じ値をコピー
  for (let m = currentMonth + 1; m < 12; m++) {
    const futureKey = `${currentYear}-${m + 1}`;
    if (!goals.monthly[futureKey]) {
      goals.monthly[futureKey] = newGoal;
    }
  }

  saveAll();
  updateMonthlyUI();
};
  document.getElementById("saveMonthlyActual").onclick = () => {
    const key = `${currentYear}-${currentMonth + 1}`;
    actuals.monthly[key] = +document.getElementById("monthlyActual").value || 0;
    saveAll();
    updateMonthlyUI();
  };
  document.getElementById("saveYearGoal").onclick = () => {
    goals.yearly[currentYear] = +document.getElementById("yearGoal").value || 0;
    saveAll();
    updateYearlyUI();
  };

  /* === 初期表示 === */
  updateWorkplaceList();
  updateShiftList();
  updateSalaryMonthLabel();
  updateSalarySummary();
  updateMonthlyUI();
  updateYearlyUI();
});

/* ===== カレンダー ===== */
function createCalendar(year, month) {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  document.getElementById("monthLabel").textContent = `${year}年 ${month + 1}月`;

  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));
  for (let d = 1; d <= days; d++) {
    const key = `${year}-${month + 1}-${d}`;
    const cell = document.createElement("div");
    cell.textContent = d;
    if (shifts[key]) cell.classList.add("has-shift");
    cell.onclick = () => openShiftModal(key);
    grid.appendChild(cell);
  }
}

/* ===== モーダル ===== */
function openShiftModal(dateKey) {
  const modal = document.getElementById("shiftModal");
  document.getElementById("modalDate").textContent = dateKey;
  const sel = document.getElementById("shiftWorkplace");
  sel.innerHTML = Object.keys(workplaces).length
    ? Object.keys(workplaces).map(w => `<option value="${w}">${w}</option>`).join("")
    : `<option value="">勤務先を追加してください</option>`;

  const s = shifts[dateKey];
  if (s) {
    document.getElementById("shiftWorkplace").value = s.workplace;
    document.getElementById("shiftTime").value = s.time;
    document.getElementById("breakTime").value = s.breakTime;
    document.getElementById("deduction").value = s.deduction;
    document.getElementById("bonus").value = s.bonus;
    document.getElementById("deleteShift").style.display = "inline-block";
  } else {
    document.querySelectorAll("#shiftModal input").forEach(i => (i.value = ""));
    document.getElementById("breakTime").value = 60;
    document.getElementById("deduction").value = 0;
    document.getElementById("bonus").value = 0;
    document.getElementById("deleteShift").style.display = "none";
  }
  modal.style.display = "block";
}

/* ===== 勤務先一覧 ===== */
/* ===== 勤務先一覧（編集モーダル対応） ===== */
function updateWorkplaceList() {
  const list = document.getElementById("workplaceList");
  list.innerHTML = "";

  Object.entries(workplaces).forEach(([name, data]) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="workplace-info">
        <strong>${name}</strong>：時給${data.hourly}円（残業+${data.overtime}%）交通費${data.transport}円
      </div>
      <div class="workplace-actions">
        <button class="edit-btn">編集</button>
        <button class="delete-btn">削除</button>
      </div>
    `;

    // === 編集ボタン ===
    li.querySelector(".edit-btn").addEventListener("click", () => openEditWorkplaceModal(name));

    // === 削除ボタン ===
    li.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`${name} を削除しますか？`)) {
        delete workplaces[name];
        saveAll();
        updateWorkplaceList();
      }
    });

    list.appendChild(li);
  });
}

/* ===== 編集モーダルの制御 ===== */
function openEditWorkplaceModal(name) {
  const modal = document.getElementById("editWorkplaceModal");
  const data = workplaces[name];

  // フォームに既存の値を反映
  document.getElementById("editWorkplaceName").value = name;
  document.getElementById("editHourlyWage").value = data.hourly;
  document.getElementById("editNightWage").value = data.night;
  document.getElementById("editOvertimeRate").value = data.overtime;
  document.getElementById("editTransportCost").value = data.transport;

  modal.style.display = "flex";

  // 保存ボタン
  document.getElementById("saveEditWorkplace").onclick = () => {
    const newName = document.getElementById("editWorkplaceName").value.trim();
    const newData = {
      hourly: parseInt(document.getElementById("editHourlyWage").value) || 0,
      night: parseInt(document.getElementById("editNightWage").value) || 0,
      overtime: parseInt(document.getElementById("editOvertimeRate").value) || 0,
      transport: parseInt(document.getElementById("editTransportCost").value) || 0,
    };

    // 名前変更に対応
    if (newName !== name) delete workplaces[name];
    workplaces[newName] = newData;

    saveAll();
    updateWorkplaceList();
    modal.style.display = "none";
  };

  // キャンセルボタン
  document.getElementById("cancelEditWorkplace").onclick = () => {
    modal.style.display = "none";
  };
}

/* ===== 勤務先追加モーダル制御 ===== */
document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addWorkplaceModal");

  // 開くボタン
  const openAddBtn = document.getElementById("openAddWorkplace");
  if (openAddBtn) {
    openAddBtn.addEventListener("click", () => {
      // 入力をリセット
      document.getElementById("addWorkplaceName").value = "";
      document.getElementById("addHourlyWage").value = "";
      document.getElementById("addNightWage").value = "";
      document.getElementById("addOvertimeRate").value = "";
      document.getElementById("addTransportCost").value = "";
      addModal.style.display = "flex";
    });
  }

  // 保存
  document.getElementById("saveAddWorkplace").onclick = () => {
    const name = document.getElementById("addWorkplaceName").value.trim();
    const hourly = parseInt(document.getElementById("addHourlyWage").value) || 0;
    const night = parseInt(document.getElementById("addNightWage").value) || hourly;
    const overtime = parseInt(document.getElementById("addOvertimeRate").value) || 0;
    const transport = parseInt(document.getElementById("addTransportCost").value) || 0;

    if (!name) return alert("勤務先名を入力してください。");

    workplaces[name] = { hourly, night, overtime, transport };
    saveAll();
    updateWorkplaceList();
    addModal.style.display = "none";
  };

  // キャンセル
  document.getElementById("cancelAddWorkplace").onclick = () => {
    addModal.style.display = "none";
  };
});


/* ===== シフト一覧 ===== */
function updateShiftList() {
  const list = document.getElementById("shiftList");
  list.innerHTML = "";
  const entries = Object.entries(shifts)
  .filter(([k]) => {
    const d = parseDateKeyToDate(k);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  })
  .sort(([a], [b]) => {
    const da = parseDateKeyToDate(a);
    const db = parseDateKeyToDate(b);
    return da - db;
  });


  if (!entries.length) {
    list.innerHTML = "<li>この月のシフトはまだ登録されていません。</li>";
    return;
  }
  for (const [k, s] of entries) {
    const li = document.createElement("li");
    li.textContent = `${k}：${s.workplace}（${s.time}）`;
    list.appendChild(li);
  }
}

/* ====== 給料関連 ====== */
function updateSalaryMonthLabel() {
  const el = document.getElementById("salaryMonthLabel");
  if (el) el.textContent = `${currentYear}年 ${currentMonth + 1}月`;
}

/* === 翌月振込に対応した給料計算 === */
function calculateMonthlyEstimatedSalary(year, month) {
  // 💡「今月の給料表示」は前月の勤務分を対象にする
  // 例：2025年11月の給料 → 2025年10月勤務分
  const target = new Date(year, month - 1, 1); 
  const targetYear = target.getFullYear();
  const targetMonth = target.getMonth();

  let total = 0;
  for (const [date, s] of Object.entries(shifts)) {
    const [y, m] = date.split("-").map(Number);
    if (y !== targetYear || (m - 1) !== targetMonth) continue;

    const w = workplaces[s.workplace];
    if (!w) continue;

    const [startStr, endStr] = s.time.split("-").map(t => t.trim());
    let start = parseTimeToDecimal(startStr);
    let end = parseTimeToDecimal(endStr);
    if (end <= start) end += 24;

    const breakHours = (s.breakTime || 0) / 60;
    const totalHours = (end - start) - breakHours;
    if (totalHours <= 0) continue;

    const nightHours = overlapLength(start, end, 22, 24) + overlapLength(start, end, 24, 29);
    const dayHours = Math.max(0, totalHours - nightHours);
    const normalOvertimeHours = Math.max(0, totalHours - 8 - nightHours);

    let pay = (dayHours * w.hourly) + (nightHours * (w.night || w.hourly));
    pay += w.hourly * (w.overtime / 100) * normalOvertimeHours;
    pay += w.transport + s.bonus - s.deduction;

    total += Math.ceil(pay);
  }
  return total;
}

/* === 表示用：給料サマリー（月ズレ対応） === */
/* === 表示用：給料サマリー === */
/* 💡 グラフだけ使い、下のテキストは非表示にする */
function updateSalarySummary() {
  const summary = document.getElementById("salarySummary");
  if (summary) summary.textContent = ""; // ← テキストを常に空にする
}


/* === 月間グラフ === */
function updateMonthlyUI() {
  const key = `${currentYear}-${currentMonth + 1}`;
  document.getElementById("monthlyGoal").value = goals.monthly[key] || "";
  document.getElementById("monthlyActual").value = actuals.monthly[key] || "";

  updateSalarySummary();

  const canvas = document.getElementById("monthlyChart");
  if (!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");

  const goal = goals.monthly[key] || 0;
  const actual = actuals.monthly[key] || 0;
  const estimated = calculateMonthlyEstimatedSalary(currentYear, currentMonth);

  const goalValue = goal || estimated || 0;
  const actualValue = actual || 0;
  const estimatedValue = estimated || 0;

  if (window._monthlyChart) window._monthlyChart.destroy();

  window._monthlyChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          // 外側（見込み）
          data: [estimatedValue, Math.max(0, goalValue - estimatedValue)],
          backgroundColor: ["#4caf50", "#e0e0e0"],
          borderWidth: 0,
          cutout: "68%",
        },
        {
          // 内側（実績）
          data: [actualValue, Math.max(0, goalValue - actualValue)],
          backgroundColor: ["#fdd835", "rgba(0,0,0,0)"],
          borderWidth: 0,
          cutout: "67.8%",
          radius: "68.3%",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        title: {
          display: true,
          text: [`見込み：¥${estimatedValue.toLocaleString()}`],
          font: { size: 14, weight: "bold" },
          color: "#333"
        }
      },
      layout: { padding: 10 }
    },
    plugins: [
      {
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;
          const centerX = (chartArea.left + chartArea.right) / 2;
          const centerY = (chartArea.top + chartArea.bottom) / 2;

          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#333";

          // 上のラベル（実績）
          ctx.font = "bold 12px 'Segoe UI', sans-serif";
          ctx.fillText("実績", centerX, centerY - 12);

          // 下の金額（少し小さめ）
          ctx.font = "600 16px 'Segoe UI', sans-serif";
          ctx.fillText(`¥${actualValue.toLocaleString()}`, centerX, centerY + 10);

          ctx.restore();
        }
      }
    ]
  });
}


/* === 年間グラフ === */
// 年間実績を月間データから自動集計
function updateYearlyActualFromMonthly() {
  let total = 0;
  for (const [key, value] of Object.entries(actuals.monthly || {})) {
    const [y, m] = key.split("-").map(Number);
    if (y === currentYear && !isNaN(value)) total += Number(value);
  }
  if (!actuals.yearly) actuals.yearly = {};
  actuals.yearly[currentYear] = total;
  saveAll();
}

function updateYearlyUI() {
  updateYearlyActualFromMonthly();

  // ラベル・入力欄更新
  const yearLabel = document.getElementById("yearLabel");
  if (yearLabel) yearLabel.textContent = `${currentYear}年`;

  const yearGoalInput = document.getElementById("yearGoal");
  if (yearGoalInput) {
    if (!goals.yearly) goals.yearly = {};
    yearGoalInput.value = goals.yearly[currentYear] || "";
  }

  // 翌月振込対応の年間見込み給料計算
  let estimated = 0;
  for (const [date, s] of Object.entries(shifts)) {
    let [y, m] = date.split("-").map(Number);
    if (isNaN(y) || isNaN(m)) continue;
    m += 1; // 翌月振込
    if (m > 12) { m = 1; y += 1; }
    if (y !== currentYear) continue;

    const w = workplaces[s.workplace];
    if (!w) continue;

    const [startStr, endStr] = s.time.split("-").map(t => t.trim());
    let start = parseTimeToDecimal(startStr);
    let end = parseTimeToDecimal(endStr);
    if (end <= start) end += 24;

    const breakHours = (s.breakTime || 0) / 60;
    const totalHours = (end - start) - breakHours;
    if (totalHours <= 0) continue;

    const nightHours = overlapLength(start, end, 22, 24) + overlapLength(start, end, 24, 29);
    const dayHours = Math.max(0, totalHours - nightHours);
    const normalOvertimeHours = Math.max(0, totalHours - 8 - nightHours);

    let pay = (dayHours * w.hourly) + (nightHours * (w.night || w.hourly));
    pay += w.hourly * (w.overtime / 100) * normalOvertimeHours;
    pay += w.transport + s.bonus - s.deduction;
    estimated += Math.ceil(pay);
  }

  // 実績・目標
  const achieved = (actuals.yearly && actuals.yearly[currentYear]) || 0;
  const goal = (goals.yearly && goals.yearly[currentYear]) || 0;
  const estimatedValue = estimated || 0;
  const goalValue = goal || estimatedValue || 0;

  // === グラフ描画 ===
  const canvas = document.getElementById("yearlyChart");
  if (!canvas || typeof Chart === "undefined") return;
  const ctx = canvas.getContext("2d");
  if (window._yearlyChart) window._yearlyChart.destroy();

  window._yearlyChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          // 外側（見込み）
          data: [estimatedValue, Math.max(0, goalValue - estimatedValue)],
          backgroundColor: ["#4caf50", "#e0e0e0"],
          borderWidth: 0,
          cutout: "68%",
        },
        {
          // 内側（実績）
          data: [achieved, Math.max(0, goalValue - achieved)],
          backgroundColor: ["#fdd835", "rgba(0,0,0,0)"],
          borderWidth: 0,
          cutout: "67.8%",
          radius: "68.3%",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        title: {
          display: true,
          text: [`見込み：¥${estimatedValue.toLocaleString()}`],
          font: { size: 14, weight: "bold" },
          color: "#333"
        }
      },
      layout: { padding: 10 }
    },
    plugins: [
      {
        id: "centerText",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;
          const centerX = (chartArea.left + chartArea.right) / 2;
          const centerY = (chartArea.top + chartArea.bottom) / 2;

          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#333";

          // 上のラベル（実績）
          ctx.font = "bold 12px 'Segoe UI', sans-serif";
          ctx.fillText("実績", centerX, centerY - 12);

          // 下の金額（少し小さめ）
          ctx.font = "600 16px 'Segoe UI', sans-serif";
          ctx.fillText(`¥${achieved.toLocaleString()}`, centerX, centerY + 10);

          ctx.restore();
        }
      }
    ]
  });
}
