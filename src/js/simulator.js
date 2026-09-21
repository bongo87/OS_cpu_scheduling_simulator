/**
 * Main Controller & UI Renderer
 */
let currentWorkload = [];

const COLOR_PALETTE = [
  "#38bdf8", "#f43f5e", "#34d399", "#fbbf24", "#a78bfa",
  "#f472b6", "#4ade80", "#fb923c", "#818cf8", "#2dd4bf"
];

document.addEventListener("DOMContentLoaded", () => {
  renderAppLayout();
  generateNewWorkload();
});

function renderAppLayout() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <!-- Controls Section -->
    <div class="bg-slate-800/80 backdrop-blur p-5 rounded-2xl border border-slate-700/60 shadow-xl">
      <h2 class="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        Simulation Controls
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Process Count</label>
          <select id="processCount" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none">
            <option value="10">10 Processes</option>
            <option value="20">20 Processes</option>
            <option value="30">30 Processes</option>
            <option value="40">40 Processes</option>
            <option value="50">50 Processes</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time Quantum (RR)</label>
          <input type="number" id="timeQuantum" value="2" min="1" max="10" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none">
        </div>
        <div>
          <button id="btnGenerate" class="w-full bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 font-semibold py-2 px-4 rounded-xl text-sm transition shadow">
            Generate Workload
          </button>
        </div>
        <div>
          <button id="btnRun" class="w-full bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm transition shadow-lg shadow-cyan-500/20">
            Run Simulation
          </button>
        </div>
      </div>
    </div>

    <!-- Workload & Metrics Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Workload Table -->
      <div class="bg-slate-800/80 backdrop-blur p-5 rounded-2xl border border-slate-700/60 shadow-xl flex flex-col">
        <h2 class="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Generated Workload
        </h2>
        <div class="overflow-x-auto overflow-y-auto max-h-56 rounded-xl border border-slate-700/50">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-cyan-400 uppercase text-xs sticky top-0 font-bold border-b border-slate-700">
              <tr>
                <th class="p-2.5">PID</th>
                <th class="p-2.5">Arrival Time</th>
                <th class="p-2.5">Burst Time</th>
                <th class="p-2.5">Priority</th>
              </tr>
            </thead>
            <tbody id="workloadTableBody" class="divide-y divide-slate-700/50 bg-slate-900/40"></tbody>
          </table>
        </div>
      </div>

      <!-- Performance Metrics Table -->
      <div class="bg-slate-800/80 backdrop-blur p-5 rounded-2xl border border-slate-700/60 shadow-xl flex flex-col">
        <h2 class="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          Performance Metrics
        </h2>
        <div class="overflow-x-auto rounded-xl border border-slate-700/50">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-cyan-400 uppercase text-xs font-bold border-b border-slate-700">
              <tr>
                <th class="p-2.5">Algorithm</th>
                <th class="p-2.5">Avg Wait</th>
                <th class="p-2.5">Avg Turnaround</th>
                <th class="p-2.5">CPU Util</th>
                <th class="p-2.5">Throughput</th>
              </tr>
            </thead>
            <tbody id="metricsTableBody" class="divide-y divide-slate-700/50 bg-slate-900/40">
              <tr><td colspan="5" class="p-4 text-center text-slate-500 italic">Run simulation to evaluate metrics.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Gantt Chart Timeline View -->
    <div class="bg-slate-800/80 backdrop-blur p-5 rounded-2xl border border-slate-700/60 shadow-xl">
      <h2 class="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Execution Timelines (Gantt Charts)
      </h2>
      <div id="ganttContainer" class="space-y-4">
        <p class="text-slate-500 italic text-sm">Click "Run Simulation" to render execution timelines.</p>
      </div>
    </div>

    <!-- Chart Visualization -->
    <div class="bg-slate-800/80 backdrop-blur p-5 rounded-2xl border border-slate-700/60 shadow-xl">
      <h2 class="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
        Metric Comparison Graph
      </h2>
      <div class="h-72 w-full">
        <canvas id="comparisonChart"></canvas>
      </div>
    </div>
  `;

  document.getElementById("btnGenerate").addEventListener("click", generateNewWorkload);
  document.getElementById("btnRun").addEventListener("click", runSimulation);
}

function generateNewWorkload() {
  const count = parseInt(document.getElementById("processCount").value, 10);
  currentWorkload = [];
  let currentArrival = 1;

  for (let i = 1; i <= count; i++) {
    currentArrival += Math.floor(Math.random() * 3);
    const burstTime = Math.floor(Math.random() * 10) + 1;
    const priority = Math.floor(Math.random() * 5) + 1;

    currentWorkload.push({
      id: `P${i}`,
      arrivalTime: currentArrival,
      burstTime: burstTime,
      priority: priority,
    });
  }

  renderWorkloadTable();
}

function renderWorkloadTable() {
  const tbody = document.getElementById("workloadTableBody");
  tbody.innerHTML = currentWorkload
    .map(
      (p) => `
    <tr class="hover:bg-slate-800/60 transition-colors">
      <td class="p-2.5 font-bold text-cyan-300">${p.id}</td>
      <td class="p-2.5">${p.arrivalTime}</td>
      <td class="p-2.5">${p.burstTime}</td>
      <td class="p-2.5">
        <span class="px-2 py-0.5 rounded text-xs font-semibold ${
          p.priority === 1 ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-slate-700 text-slate-300'
        }">Priority ${p.priority}</span>
      </td>
    </tr>
  `
    )
    .join("");
}

function runSimulation() {
  if (!currentWorkload || currentWorkload.length === 0) {
    console.warn("Simulation aborted: Workload is empty.");
    return;
  }

  const quantum = parseInt(document.getElementById("timeQuantum").value, 10) || 2;

  // Defensive check: Ensure required algorithm functions exist
  const missingFunctions = [];
  if (typeof runFCFS !== "function") missingFunctions.push("runFCFS");
  if (typeof runSRTF !== "function") missingFunctions.push("runSRTF");
  if (typeof runRoundRobin !== "function") missingFunctions.push("runRoundRobin");

  if (missingFunctions.length > 0) {
    console.error(`Simulation aborted: Missing function(s) -> ${missingFunctions.join(", ")}`);
    alert(`Error: The following algorithm scripts failed to load: ${missingFunctions.join(", ")}`);
    return;
  }

  try {
    const fcfsRes = runFCFS(currentWorkload);
    const srtfRes = runSRTF(currentWorkload);
    const rrRes = runRoundRobin(currentWorkload, quantum);

    const rawResults = [fcfsRes, srtfRes, rrRes];

    // Defensive check: Normalize missing metric properties to prevent downstream failures
    const results = rawResults.map((res) => {
      if (!res) return null;
      return {
        ...res,
        avgWaitingTime: Number(res.avgWaitingTime) || 0,
        avgTurnaroundTime: Number(res.avgTurnaroundTime) || 0,
        avgResponseTime: Number(res.avgResponseTime) || 0,
        cpuUtilization: Number(res.cpuUtilization) || 0,
        throughput: Number(res.throughput) || 0,
      };
    }).filter(Boolean);

    if (results.length === 0) {
      console.error("Simulation failed: Algorithm functions returned invalid data.");
      return;
    }

    renderGanttCharts(results);
    renderMetricsTable(results);

    if (typeof renderComparisonChart === "function") {
      renderComparisonChart("comparisonChart", results);
    } else {
      console.warn("renderComparisonChart function is missing. Skipping chart render.");
    }
  } catch (error) {
    console.error("An error occurred during simulation execution:", error);
    alert(`Simulation Error: ${error.message}`);
  }
}

function renderGanttCharts(results) {
  const container = document.getElementById("ganttContainer");
  container.innerHTML = "";

  results.forEach((res) => {
    const card = document.createElement("div");
    card.className = "bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 shadow-inner";

    let chartHtml = `<h3 class="text-sm font-bold text-slate-200 mb-3 flex items-center justify-between">
      <span>${res.algorithm || "Algorithm"}</span>
      <span class="text-xs font-normal text-slate-400">Total Time: ${res.totalSimulationTime || 0} units</span>
    </h3>`;
    
    chartHtml += `<div class="flex overflow-x-auto pb-2 gap-1 border-b border-slate-800/80 scrollbar-thin">`;

    if (Array.isArray(res.ganttChart)) {
      res.ganttChart.forEach((block) => {
        const duration = block.endTime - block.startTime;
        const minWidth = Math.max(duration * 32, 44);
        const isIdle = block.processId === "IDLE";

        let color = "#334155";
        if (!isIdle) {
          const pIndex = parseInt(block.processId.replace("P", ""), 10) || 0;
          color = COLOR_PALETTE[pIndex % COLOR_PALETTE.length];
        }

        chartHtml += `
          <div style="min-width: ${minWidth}px; background-color: ${color};" 
               class="h-12 flex flex-col justify-between p-1.5 rounded-lg text-slate-950 font-black text-xs shadow-md transition-transform hover:scale-105">
            <span>${block.processId}</span>
            <div class="flex justify-between text-[10px] opacity-90 font-mono">
              <span>${block.startTime}</span>
              <span>${block.endTime}</span>
            </div>
          </div>
        `;
      });
    }

    chartHtml += `</div>`;
    card.innerHTML = chartHtml;
    container.appendChild(card);
  });
}

function renderMetricsTable(results) {
  const tbody = document.getElementById("metricsTableBody");
  tbody.innerHTML = results
    .map(
      (m) => `
    <tr class="hover:bg-slate-800/60 transition-colors">
      <td class="p-2.5 font-bold text-cyan-300">${m.algorithm || "N/A"}</td>
      <td class="p-2.5">${(m.avgWaitingTime || 0).toFixed(2)}</td>
      <td class="p-2.5">${(m.avgTurnaroundTime || 0).toFixed(2)}</td>
      <td class="p-2.5">${(m.cpuUtilization || 0).toFixed(1)}%</td>
      <td class="p-2.5">${(m.throughput || 0).toFixed(3)}</td>
    </tr>
  `
    )
    .join("");
}