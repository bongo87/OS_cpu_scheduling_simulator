/**
 * Main Controller & UI Renderer
 */
let currentWorkload = [];

// Color palette for processes in Gantt Charts
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
    <!-- Control Panel -->
    <div class="bg-slate-800 p-4 rounded-xl mb-6 shadow-lg border border-slate-700">
      <h2 class="text-xl font-bold text-cyan-400 mb-4">Simulation Controls</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">Process Count</label>
          <select id="processCount" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
            <option value="10">10 Processes</option>
            <option value="20">20 Processes</option>
            <option value="30">30 Processes</option>
            <option value="40">40 Processes</option>
            <option value="50">50 Processes</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">Time Quantum (RR)</label>
          <input type="number" id="timeQuantum" value="2" min="1" max="10" class="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white">
        </div>
        <div>
          <button id="btnGenerate" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded transition">
            Generate Workload
          </button>
        </div>
        <div>
          <button id="btnRun" class="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2 px-4 rounded transition">
            Run Simulation
          </button>
        </div>
      </div>
    </div>

    <!-- Process Table -->
    <div class="bg-slate-800 p-4 rounded-xl mb-6 shadow-lg border border-slate-700">
      <h2 class="text-xl font-bold text-cyan-400 mb-4">Generated Workload</h2>
      <div class="overflow-x-auto max-h-48 overflow-y-auto">
        <table class="w-full text-left text-sm text-slate-300">
          <thead class="bg-slate-900 text-cyan-400 uppercase text-xs sticky top-0">
            <tr>
              <th class="p-2">PID</th>
              <th class="p-2">Arrival Time</th>
              <th class="p-2">Burst Time</th>
              <th class="p-2">Priority</th>
            </tr>
          </thead>
          <tbody id="workloadTableBody"></tbody>
        </table>
      </div>
    </div>

    <!-- Gantt Chart Output -->
    <div class="bg-slate-800 p-4 rounded-xl mb-6 shadow-lg border border-slate-700">
      <h2 class="text-xl font-bold text-cyan-400 mb-4">Gantt Charts</h2>
      <div id="ganttContainer" class="space-y-4">
        <p class="text-slate-400 italic">Run simulation to render timelines.</p>
      </div>
    </div>

    <!-- Results & Comparison -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
        <h2 class="text-xl font-bold text-cyan-400 mb-4">Performance Metrics</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-300">
            <thead class="bg-slate-900 text-cyan-400 uppercase text-xs">
              <tr>
                <th class="p-2">Algorithm</th>
                <th class="p-2">Avg Wait</th>
                <th class="p-2">Avg Turnaround</th>
                <th class="p-2">CPU Util (%)</th>
                <th class="p-2">Throughput</th>
              </tr>
            </thead>
            <tbody id="metricsTableBody">
              <tr><td colspan="5" class="p-2 text-slate-400 italic">No execution data.</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
        <h2 class="text-xl font-bold text-cyan-400 mb-4">Metric Comparison Chart</h2>
        <div class="h-64">
          <canvas id="comparisonChart"></canvas>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btnGenerate").addEventListener("click", generateNewWorkload);
  document.getElementById("btnRun").addEventListener("click", runSimulation);
}

/**
 * Generate process workload with Arrival Time starting from t = 1
 */
function generateNewWorkload() {
  const count = parseInt(document.getElementById("processCount").value, 10);
  currentWorkload = [];

  let currentArrival = 1; // Time starts at 1

  for (let i = 1; i <= count; i++) {
    // Arrival times increment sequentially starting from 1
    currentArrival += Math.floor(Math.random() * 3); // step of 0, 1, or 2
    const burstTime = Math.floor(Math.random() * 10) + 1; // Burst time 1..10
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
    <tr class="border-b border-slate-700 hover:bg-slate-700/50">
      <td class="p-2 font-semibold text-cyan-300">${p.id}</td>
      <td class="p-2">${p.arrivalTime}</td>
      <td class="p-2">${p.burstTime}</td>
      <td class="p-2">${p.priority}</td>
    </tr>
  `
    )
    .join("");
}

function runSimulation() {
  if (currentWorkload.length === 0) return;

  const quantum = parseInt(document.getElementById("timeQuantum").value, 10) || 2;

  const results = [
    runFCFS(currentWorkload),
    runSRTF(currentWorkload),
    runRoundRobin(currentWorkload, quantum),
  ];

  renderGanttCharts(results);
  renderMetricsTable(results);
  renderComparisonChart("comparisonChart", results);
}

function renderGanttCharts(results) {
  const container = document.getElementById("ganttContainer");
  container.innerHTML = "";

  results.forEach((res) => {
    const card = document.createElement("div");
    card.className = "bg-slate-900 p-3 rounded-lg border border-slate-700";

    let chartHtml = `<h3 class="text-md font-bold text-slate-200 mb-2">${res.algorithm}</h3>`;
    chartHtml += `<div class="flex overflow-x-auto pb-2 border-b border-slate-800">`;

    res.ganttChart.forEach((block) => {
      const duration = block.endTime - block.startTime;
      const minWidth = Math.max(duration * 28, 40);
      const isIdle = block.processId === "IDLE";

      let color = "#475569";
      if (!isIdle) {
        const pIndex = parseInt(block.processId.replace("P", ""), 10) || 0;
        color = COLOR_PALETTE[pIndex % COLOR_PALETTE.length];
      }

      chartHtml += `
        <div style="min-width: ${minWidth}px; background-color: ${color};" 
             class="h-12 flex flex-col justify-between p-1 rounded text-slate-950 font-bold text-xs m-0.5 shadow">
          <span>${block.processId}</span>
          <div class="flex justify-between text-[10px] opacity-80">
            <span>${block.startTime}</span>
            <span>${block.endTime}</span>
          </div>
        </div>
      `;
    });

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
    <tr class="border-b border-slate-700 hover:bg-slate-700/50">
      <td class="p-2 font-semibold text-cyan-300">${m.algorithm}</td>
      <td class="p-2">${m.avgWaitingTime.toFixed(2)}</td>
      <td class="p-2">${m.avgTurnaroundTime.toFixed(2)}</td>
      <td class="p-2">${m.cpuUtilization.toFixed(1)}%</td>
      <td class="p-2">${m.throughput.toFixed(3)}</td>
    </tr>
  `
    )
    .join("");
}