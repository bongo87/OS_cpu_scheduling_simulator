/**
 * src/js/simulator.js
 */

// Keep track of active Chart.js instances to allow clean re-rendering
let barChartInstance = null;
let pieChartInstance = null;
let trendChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  let currentProcesses = [];
  let studyResults = null; // cached for the metric-selector re-render

  // 1. Inject Dashboard UI into <main id="app">
  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  appContainer.innerHTML = `
    <!-- Top Controls & Generated Workload Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Controls Card -->
      <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg space-y-4">
        <h2 class="text-lg font-bold text-[#211B2D]">
          Simulation Controls (Audio-Video System)
        </h2>
        <div class="text-xs text-[#6D28D9] bg-cyan-900/20 p-2 rounded border border-cyan-700/50">
          <strong>Note:</strong> Higher priority number = Higher priority (5 > 4 > 3 > 2 > 1). When arrival times are equal, higher priority processes run first.
        </div>
        
        <div>
          <label class="block text-xs text-[#756D80] mb-1">PROCESS COUNT</label>
          <select id="processCountSelect" class="w-full bg-[#F8F7FC] border border-[#E4DDF2] rounded-lg px-3 py-2 text-sm text-[#40384A] focus:outline-none focus:border-[#6D28D9]">
            <option value="10" selected>10 Processes</option>
            <option value="20">20 Processes</option>
            <option value="30">30 Processes</option>
            <option value="40">40 Processes</option>
            <option value="50">50 Processes</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-[#756D80] mb-1">TIME QUANTUM (RR - System-Wide)</label>
          <div id="quantumDisplay" class="w-full bg-[#F8F7FC] border border-[#E4DDF2] rounded-lg px-3 py-2 text-sm text-[#40384A]">
            Auto-generated (random)
          </div>
        </div>

        <div class="flex flex-wrap gap-2 pt-2">
          <button id="btnGenerate" class="flex-1 min-w-[110px] bg-[#F3EEFF] hover:bg-slate-200 text-[#211B2D] font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-[#E4DDF2]">
            Generate
          </button>
          <button id="btnRun" class="flex-1 min-w-[110px] bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm py-2 px-3 rounded-lg transition-colors shadow">
            Run
          </button>
          <button id="btnClear" class="flex-1 min-w-[80px] bg-white hover:bg-red-50 text-red-600 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-red-200">
            Clear
          </button>
        </div>
      </div>

      <!-- Generated Workload Table (Interactive Inputs Enabled) -->
      <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg">
        <h2 class="text-lg font-bold text-[#211B2D] mb-3">
          Workload Configuration (Audio-Video Processes)
        </h2>
        <div class="overflow-y-auto max-h-52 pr-1">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F7FC]/60 text-[#756D80]">
              <tr>
                <th class="p-2 rounded-l">PID</th>
                <th class="p-2">ARRIVAL TIME</th>
                <th class="p-2">BURST TIME</th>
                <th class="p-2 rounded-r">PRIORITY</th>
              </tr>
            </thead>
            <tbody id="workloadTableBody" class="divide-y divide-slate-200 text-[#756D80]">
              <tr>
                <td colspan="4" class="p-4 text-center text-slate-400 italic">
                  No processes loaded — click "Generate" to begin.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Performance Metrics Summary Table -->
      <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg">
        <h2 class="text-lg font-bold text-[#211B2D] mb-3">
          Performance Metrics
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-[#F8F7FC]/60 text-[#756D80]">
              <tr>
                <th class="p-2 rounded-l">ALGORITHM</th>
                <th class="p-2">AVG WAIT</th>
                <th class="p-2">AVG TAT</th>
                <th class="p-2">AVG RESP</th>
                <th class="p-2">CPU UTIL</th>
                <th class="p-2 rounded-r">THROUGHPUT</th>
              </tr>
            </thead>
            <tbody id="metricsTableBody" class="divide-y divide-slate-200 text-[#756D80] font-mono">
              <tr><td colspan="6" class="p-3 text-center text-slate-500">Run simulation to view metrics</td></tr>
            </tbody>
          </table>
        </div>
        <p class="text-[10px] text-[#756D80] mt-2 italic">
          Green cells indicate the best algorithm for that metric (lower is better for wait, TAT, and response; higher is better for CPU util and throughput).
        </p>
      </div>

    </div>

    <!-- Execution Timelines (Gantt Charts Matrix) -->
    <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg space-y-6">
      <h2 class="text-lg font-bold text-[#211B2D]">
        Execution Timelines (Gantt Charts)
      </h2>

      <div>
        <h3 class="text-sm font-semibold text-[#756D80] mb-2">Preemptive FCFS (Priority)</h3>
        <div id="fcfsGanttContainer"></div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-[#756D80] mb-2">SRTF (Priority)</h3>
        <div id="srtfGanttContainer"></div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-[#756D80] mb-2">Round Robin (Priority)</h3>
        <div id="rrGanttContainer"></div>
      </div>
    </div>

    <!-- Metric Comparison Visualizations Grid (Bar & Pie Charts) -->
    <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg space-y-4">
      <h2 class="text-lg font-bold text-[#211B2D]">
        Metric Comparison Visualizations
      </h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-[#F8F7FC] p-4 rounded-lg border border-[#E4DDF2] flex flex-col items-center">
          <h3 class="text-xs font-bold text-[#756D80] uppercase tracking-wider mb-2">Average Times Comparison</h3>
          <div class="relative h-64 w-full">
            <canvas id="comparisonBarChart"></canvas>
          </div>
        </div>

        <div class="bg-[#F8F7FC] p-4 rounded-lg border border-[#E4DDF2] flex flex-col items-center">
          <h3 class="text-xs font-bold text-[#756D80] uppercase tracking-wider mb-2">Total Waiting Time Distribution</h3>
          <div class="relative h-64 w-full">
            <canvas id="comparisonPieChart"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Process Count Study (answers the "as the number of processes increases" investigative questions) -->
    <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-[#211B2D]">Process Count Study</h2>
          <p class="text-xs text-[#756D80] mt-1 max-w-2xl">
            Runs all three algorithms across <strong>10, 20, 30, 40, and 50 processes</strong>, averaged over <strong>5 random trials</strong> each. Use this chart to answer the assignment's investigative questions.
          </p>
        </div>
        <button id="btnStudy" class="bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors shadow">
          Run Study (10 → 50)
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="text-xs text-[#756D80] font-medium">METRIC:</label>
        <select id="studyMetricSelect" class="bg-[#F8F7FC] border border-[#E4DDF2] rounded-lg px-3 py-1.5 text-sm text-[#40384A] focus:outline-none focus:border-[#6D28D9]">
          <option value="avgWaitingTime" selected>Average Waiting Time</option>
          <option value="avgTurnaroundTime">Average Turnaround Time</option>
          <option value="avgResponseTime">Average Response Time</option>
          <option value="cpuUtilization">CPU Utilisation (%)</option>
          <option value="throughput">Throughput</option>
        </select>
      </div>

      <div class="bg-[#F8F7FC] p-4 rounded-lg border border-[#E4DDF2]">
        <div class="relative h-80 w-full">
          <canvas id="trendChart"></canvas>
        </div>
      </div>

      <div id="studySummary" class="text-xs text-[#40384A] leading-relaxed">
        <p class="text-slate-400 italic">Click "Run Study" to identify which algorithm wins each metric across the process-count range.</p>
      </div>
    </div>
  `;

  // ---------------------------------------------------------------------------
  // Output reset / run-button state
  // ---------------------------------------------------------------------------

  function resetOutputs() {
    const metricsBody = document.getElementById("metricsTableBody");
    if (metricsBody) {
      metricsBody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-500">Run simulation to view metrics</td></tr>`;
    }

    const containers = ["fcfsGanttContainer", "srtfGanttContainer", "rrGanttContainer"];
    containers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="text-xs text-slate-400 italic py-2">Click "Run" to generate Gantt chart</div>`;
    });

    if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
    if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
  }

  function setRunEnabled(enabled) {
    const runBtn = document.getElementById("btnRun");
    if (!runBtn) return;
    runBtn.disabled = !enabled;
    runBtn.classList.toggle("opacity-50", !enabled);
    runBtn.classList.toggle("cursor-not-allowed", !enabled);
  }

  // ---------------------------------------------------------------------------
  // Clear / reset
  // ---------------------------------------------------------------------------

  function clearAll() {
    currentProcesses = [];
    studyResults = null;

    const tableBody = document.getElementById("workloadTableBody");
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-center text-slate-400 italic">
            No processes loaded — click "Generate" to begin.
          </td>
        </tr>`;
    }

    const quantumDisplay = document.getElementById("quantumDisplay");
    if (quantumDisplay) quantumDisplay.textContent = "Auto-generated (random)";

    resetOutputs();

    if (trendChartInstance) { trendChartInstance.destroy(); trendChartInstance = null; }

    const studySummary = document.getElementById("studySummary");
    if (studySummary) {
      studySummary.innerHTML = `<p class="text-slate-400 italic">Click "Run Study" to identify which algorithm wins each metric across the process-count range.</p>`;
    }

    setRunEnabled(false);
  }

  // ---------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------

  function buildRandomWorkload(count) {
    const procs = [];
    let t = 1;
    for (let i = 1; i <= count; i++) {
      t += Math.floor(Math.random() * 3); // 0, 1, or 2 incremental arrival
      procs.push({
        id: `P${i}`,
        arrivalTime: t,
        burstTime: Math.floor(Math.random() * 10) + 1, // 1-10
        priority: Math.floor(Math.random() * 5) + 1,   // 1-5
      });
    }
    return procs;
  }

  function randomQuantum() {
    return Math.floor(Math.random() * 5) + 2; // 2-6
  }

  // ---------------------------------------------------------------------------
  // Single-workload generation + table rendering
  // ---------------------------------------------------------------------------

  function generateWorkload() {
    const count = parseInt(document.getElementById("processCountSelect").value, 10);
    currentProcesses = buildRandomWorkload(count);

    const q = randomQuantum();
    const quantumDisplay = document.getElementById("quantumDisplay");
    if (quantumDisplay) {
      quantumDisplay.textContent = `Q=${q} (applies to all processes)`;
    }

    renderWorkloadTable();
    resetOutputs();
    setRunEnabled(true);
  }

  function renderWorkloadTable() {
    const tableBody = document.getElementById("workloadTableBody");
    if (!tableBody) return;

    if (currentProcesses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-center text-slate-400 italic">
            No processes loaded — click "Generate" to begin.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = currentProcesses
      .map((p, index) => `
        <tr class="hover:bg-[#F3EEFF]/30">
          <td class="p-2 font-bold text-[#6D28D9]">${p.id}</td>
          <td class="p-2">
            <input type="number" min="0" value="${p.arrivalTime}" data-index="${index}" data-field="arrivalTime"
              class="process-input w-20 bg-[#F8F7FC] border border-[#E4DDF2] rounded px-2 py-1 text-xs text-[#211B2D] focus:outline-none focus:border-[#6D28D9]" />
          </td>
          <td class="p-2">
            <input type="number" min="1" value="${p.burstTime}" data-index="${index}" data-field="burstTime"
              class="process-input w-20 bg-[#F8F7FC] border border-[#E4DDF2] rounded px-2 py-1 text-xs text-[#211B2D] focus:outline-none focus:border-[#6D28D9]" />
          </td>
          <td class="p-2">
            <input type="number" min="1" max="5" value="${p.priority}" data-index="${index}" data-field="priority"
              class="process-input w-20 bg-[#F8F7FC] border border-[#E4DDF2] rounded px-2 py-1 text-xs text-[#211B2D] focus:outline-none focus:border-[#6D28D9]" />
          </td>
        </tr>
      `)
      .join("");

    document.querySelectorAll(".process-input").forEach((input) => {
      input.addEventListener("input", (e) => {
        const index = parseInt(e.target.getAttribute("data-index"), 10);
        const field = e.target.getAttribute("data-field");
        const val = parseInt(e.target.value, 10) || 0;
        if (currentProcesses[index]) {
          currentProcesses[index][field] = val;
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Bar + Pie charts (single-workload comparison)
  // ---------------------------------------------------------------------------

  function renderComparisonChart(results) {
    const labels = results.map((r) => r.algorithm);
    const avgWaitTimes = results.map((r) => r.avgWaitingTime);
    const avgTurnaroundTimes = results.map((r) => r.avgTurnaroundTime);
    const avgResponseTimes = results.map((r) => r.avgResponseTime || 0);

    const ctxBar = document.getElementById("comparisonBarChart");
    if (ctxBar) {
      if (barChartInstance) barChartInstance.destroy();

      barChartInstance = new Chart(ctxBar, {
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Avg Wait Time (s)", data: avgWaitTimes, backgroundColor: "rgba(109, 40, 217, 0.8)" },
            { label: "Avg Turnaround Time (s)", data: avgTurnaroundTimes, backgroundColor: "rgba(5, 150, 105, 0.8)" },
            { label: "Avg Response Time (s)", data: avgResponseTimes, backgroundColor: "rgba(219, 39, 119, 0.8)" },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, grid: { color: "rgba(228, 221, 242, 0.5)" } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    const ctxPie = document.getElementById("comparisonPieChart");
    if (ctxPie) {
      if (pieChartInstance) pieChartInstance.destroy();

      pieChartInstance = new Chart(ctxPie, {
        type: "pie",
        data: {
          labels,
          datasets: [{
            label: "Avg Waiting Time Share",
            data: avgWaitTimes,
            backgroundColor: [
              "rgba(109, 40, 217, 0.85)",
              "rgba(14, 165, 233, 0.85)",
              "rgba(245, 158, 11, 0.85)",
            ],
            borderColor: ["#6D28D9", "#0EA5E9", "#F59E0B"],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = context.dataset.data.reduce((a, c) => a + c, 0);
                  const value = context.raw;
                  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${value.toFixed(2)}s (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Best-algorithm highlighting for the metrics table
  // ---------------------------------------------------------------------------

  function getBestIndices(results) {
    const minIdx = (k) =>
      results.reduce((best, r, i, arr) => ((r[k] ?? Infinity) < (arr[best][k] ?? Infinity) ? i : best), 0);
    const maxIdx = (k) =>
      results.reduce((best, r, i, arr) => ((r[k] ?? -Infinity) > (arr[best][k] ?? -Infinity) ? i : best), 0);

    return {
      waiting: minIdx("avgWaitingTime"),
      turnaround: minIdx("avgTurnaroundTime"),
      response: minIdx("avgResponseTime"),
      cpu: maxIdx("cpuUtilization"),
      throughput: maxIdx("throughput"),
    };
  }

  // ---------------------------------------------------------------------------
  // Single-workload simulation runner
  // ---------------------------------------------------------------------------

  function executeSimulation() {
    if (currentProcesses.length === 0) return;

    // Sync any manual edits from the table inputs first
    document.querySelectorAll(".process-input").forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      const val = parseInt(input.value, 10) || 0;
      if (currentProcesses[index]) currentProcesses[index][field] = val;
    });

    const quantumDisplay = document.getElementById("quantumDisplay");
    const quantumMatch = quantumDisplay ? quantumDisplay.textContent.match(/\d+/) : null;
    const quantum = quantumMatch ? parseInt(quantumMatch[0], 10) : 2;

    const procsFcfs = JSON.parse(JSON.stringify(currentProcesses));
    const procsSrtf = JSON.parse(JSON.stringify(currentProcesses));
    const procsRr = JSON.parse(JSON.stringify(currentProcesses));

    const fcfsResult = typeof runFCFS === "function" ? runFCFS(procsFcfs) : { algorithm: "Preemptive FCFS", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0, cpuUtilization: 0, throughput: 0 };
    const srtfResult = typeof runSRTF === "function" ? runSRTF(procsSrtf) : { algorithm: "SRTF", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0, cpuUtilization: 0, throughput: 0 };
    const rrResult = typeof runRoundRobin === "function" ? runRoundRobin(procsRr, quantum) : { algorithm: `Round Robin (Q=${quantum})`, ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0, cpuUtilization: 0, throughput: 0 };

    const results = [fcfsResult, srtfResult, rrResult];
    const best = getBestIndices(results);
    const hit = (isBest) => isBest ? "bg-emerald-50 font-bold ring-1 ring-inset ring-emerald-300" : "";

    const metricsBody = document.getElementById("metricsTableBody");
    metricsBody.innerHTML = results.map((r, i) => `
      <tr class="hover:bg-[#F3EEFF]/30">
        <td class="p-2 font-bold text-[#211B2D]">${r.algorithm}</td>
        <td class="p-2 text-[#6D28D9] ${hit(i === best.waiting)}">${r.avgWaitingTime.toFixed(2)}</td>
        <td class="p-2 text-emerald-600 ${hit(i === best.turnaround)}">${r.avgTurnaroundTime.toFixed(2)}</td>
        <td class="p-2 text-pink-600 ${hit(i === best.response)}">${(r.avgResponseTime || 0).toFixed(2)}</td>
        <td class="p-2 text-amber-600 ${hit(i === best.cpu)}">${r.cpuUtilization.toFixed(1)}%</td>
        <td class="p-2 text-purple-600 ${hit(i === best.throughput)}">${r.throughput.toFixed(3)}</td>
      </tr>
    `).join("");

    if (typeof renderRowGanttChart === "function") {
      renderRowGanttChart("fcfsGanttContainer", fcfsResult.ganttChart, currentProcesses);
      renderRowGanttChart("srtfGanttContainer", srtfResult.ganttChart, currentProcesses);
      renderRowGanttChart("rrGanttContainer", rrResult.ganttChart, currentProcesses);
    }

    renderComparisonChart(results);
  }

  // ---------------------------------------------------------------------------
  // Process-count study (10 → 50) — answers the investigative questions
  // ---------------------------------------------------------------------------

  function runProcessCountStudy() {
    const counts = [10, 20, 30, 40, 50];
    const TRIALS = 5;

    return counts.map((count) => {
      const sums = {
        fcfs: { avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0, cpuUtilization: 0, throughput: 0 },
        srtf: { avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0, cpuUtilization: 0, throughput: 0 },
        rr:   { avgWaitingTime: 0, avgTurnaroundTime: 0, avgResponseTime: 0, cpuUtilization: 0, throughput: 0 },
      };

      for (let t = 0; t < TRIALS; t++) {
        const workload = buildRandomWorkload(count);
        const q = randomQuantum();

        const fcfs = runFCFS(JSON.parse(JSON.stringify(workload)));
        const srtf = runSRTF(JSON.parse(JSON.stringify(workload)));
        const rr   = runRoundRobin(JSON.parse(JSON.stringify(workload)), q);

        [["fcfs", fcfs], ["srtf", srtf], ["rr", rr]].forEach(([key, res]) => {
          sums[key].avgWaitingTime += res.avgWaitingTime;
          sums[key].avgTurnaroundTime += res.avgTurnaroundTime;
          sums[key].avgResponseTime += res.avgResponseTime || 0;
          sums[key].cpuUtilization += res.cpuUtilization;
          sums[key].throughput += res.throughput;
        });
      }

      const avgOf = (obj) =>
        Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v / TRIALS]));

      return {
        count,
        fcfs: avgOf(sums.fcfs),
        srtf: avgOf(sums.srtf),
        rr:   avgOf(sums.rr),
      };
    });
  }

  const METRIC_LABELS = {
    avgWaitingTime: "Average Waiting Time",
    avgTurnaroundTime: "Average Turnaround Time",
    avgResponseTime: "Average Response Time",
    cpuUtilization: "CPU Utilisation (%)",
    throughput: "Throughput (processes / unit time)",
  };

  function renderTrendChart(results, metricKey) {
    const canvas = document.getElementById("trendChart");
    if (!canvas || !results) return;

    if (trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(canvas, {
      type: "line",
      data: {
        labels: results.map((r) => r.count),
        datasets: [
          {
            label: "Preemptive FCFS (Priority)",
            data: results.map((r) => r.fcfs[metricKey]),
            borderColor: "#6D28D9",
            backgroundColor: "rgba(109, 40, 217, 0.15)",
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: "#6D28D9",
          },
          {
            label: "SRTF (Priority)",
            data: results.map((r) => r.srtf[metricKey]),
            borderColor: "#0EA5E9",
            backgroundColor: "rgba(14, 165, 233, 0.15)",
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: "#0EA5E9",
          },
          {
            label: "Round Robin (Priority)",
            data: results.map((r) => r.rr[metricKey]),
            borderColor: "#F59E0B",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            tension: 0.3,
            fill: false,
            pointRadius: 5,
            pointBackgroundColor: "#F59E0B",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } },
          title: {
            display: true,
            text: `${METRIC_LABELS[metricKey]} vs Number of Processes`,
            color: "#211B2D",
            font: { size: 13, weight: "bold" },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(3)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: METRIC_LABELS[metricKey], color: "#756D80" },
            grid: { color: "rgba(228, 221, 242, 0.6)" },
          },
          x: {
            title: { display: true, text: "Number of Processes", color: "#756D80" },
            grid: { display: false },
          },
        },
      },
    });
  }

  function buildStudySummary(results) {
    const metrics = [
      { key: "avgWaitingTime", name: "waiting time", lowerBetter: true },
      { key: "avgTurnaroundTime", name: "turnaround time", lowerBetter: true },
      { key: "avgResponseTime", name: "response time", lowerBetter: true },
      { key: "cpuUtilization", name: "CPU utilisation", lowerBetter: false },
      { key: "throughput", name: "throughput", lowerBetter: false },
    ];

    const algos = [
      { key: "fcfs", name: "Preemptive FCFS" },
      { key: "srtf", name: "SRTF" },
      { key: "rr", name: "Round Robin" },
    ];

    const rows = metrics.map((m) => {
      const overallAvg = (algoKey) =>
        results.reduce((s, r) => s + r[algoKey][m.key], 0) / results.length;

      const scored = algos
        .map((a) => ({ name: a.name, value: overallAvg(a.key) }))
        .sort((a, b) => (m.lowerBetter ? a.value - b.value : b.value - a.value));

      return `<tr>
        <td class="py-1 pr-4 font-medium text-[#40384A] capitalize">${m.name}</td>
        <td class="py-1 pr-4 font-bold text-[#6D28D9]">${scored[0].name}</td>
        <td class="py-1 text-[#756D80] font-mono">${scored[0].value.toFixed(2)}</td>
      </tr>`;
    }).join("");

    return `
      <p class="text-xs font-semibold text-[#211B2D] mb-2 uppercase tracking-wide">Best Algorithm per Metric (averaged across 10 → 50 processes)</p>
      <table class="text-xs border border-[#E4DDF2] rounded">
        <thead class="bg-[#F3EEFF] text-[#4C1D95]">
          <tr>
            <th class="text-left py-1.5 px-3">Metric</th>
            <th class="text-left py-1.5 px-3">Best Algorithm</th>
            <th class="text-left py-1.5 px-3">Avg Value</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E4DDF2]">${rows}</tbody>
      </table>
      <p class="text-[10px] text-[#756D80] italic mt-2">Lower is better for time-based metrics; higher is better for CPU utilisation and throughput.</p>
    `;
  }

  // ---------------------------------------------------------------------------
  // Event listeners
  // ---------------------------------------------------------------------------

  document.getElementById("btnGenerate").addEventListener("click", generateWorkload);
  document.getElementById("btnRun").addEventListener("click", executeSimulation);
  document.getElementById("btnClear").addEventListener("click", clearAll);

  document.getElementById("btnStudy").addEventListener("click", () => {
    const btn = document.getElementById("btnStudy");
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Running…";
    btn.classList.add("opacity-70", "cursor-not-allowed");

    // Defer so the button label paints before the (synchronous) study runs
    setTimeout(() => {
      studyResults = runProcessCountStudy();

      const metricKey = document.getElementById("studyMetricSelect").value;
      renderTrendChart(studyResults, metricKey);

      document.getElementById("studySummary").innerHTML = buildStudySummary(studyResults);

      btn.disabled = false;
      btn.textContent = original;
      btn.classList.remove("opacity-70", "cursor-not-allowed");
    }, 30);
  });

  document.getElementById("studyMetricSelect").addEventListener("change", (e) => {
    if (studyResults) renderTrendChart(studyResults, e.target.value);
  });

  // Initial state: generate a starter workload, but Run is disabled until the user clicks it
  generateWorkload();
});