/**
 * src/js/simulator.js
 */

// Keep track of active Chart.js instances to allow clean re-rendering
let barChartInstance = null;
let pieChartInstance = null;
let trendChartInstance = null;

// Batch study config
const BATCH_PROCESS_COUNTS = [10, 20, 30, 40, 50];
const BATCH_TRIALS = 5;
const BATCH_QUANTUM = 3;
let batchResults = null;

document.addEventListener("DOMContentLoaded", () => {
  let currentProcesses = [];

  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  appContainer.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
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
          <button id="btnGenerate" class="flex-1 min-w-[120px] bg-[#F3EEFF] hover:bg-slate-200 text-[#211B2D] font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-[#E4DDF2]">
            Generate Workload
          </button>
          <button id="btnRun" class="flex-1 min-w-[120px] bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm py-2 px-3 rounded-lg transition-colors shadow">
            Run Simulation
          </button>
          <button id="btnClear" class="flex-1 min-w-[80px] bg-white hover:bg-red-50 text-red-600 font-medium text-sm py-2 px-3 rounded-lg transition-colors border border-red-200">
            Clear
          </button>
        </div>
      </div>

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
            <tbody id="workloadTableBody" class="divide-y divide-slate-200 text-[#756D80]"></tbody>
          </table>
        </div>
      </div>

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
      </div>

    </div>

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

    <!-- Batch Study: metric trends vs. process count -->
    <div class="bg-white/80 border border-[#E4DDF2]/60 rounded-xl p-5 shadow-lg space-y-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-bold text-[#211B2D]">Batch Study — Metrics vs. Process Count</h2>
          <p class="text-xs text-[#756D80] mt-1">
            Runs each algorithm across 10, 20, 30, 40 and 50 processes (${BATCH_TRIALS} seeded trials each).
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select id="trendMetricSelect" class="bg-[#F8F7FC] border border-[#E4DDF2] rounded-lg px-3 py-2 text-xs text-[#40384A] focus:outline-none focus:border-[#6D28D9]">
            <option value="wait">Avg Waiting Time</option>
            <option value="tat">Avg Turnaround Time</option>
            <option value="resp">Avg Response Time</option>
            <option value="cpu">CPU Utilisation (%)</option>
            <option value="throughput">Throughput</option>
          </select>
          <button id="btnBatch" class="bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors shadow">
            Run Batch Study
          </button>
        </div>
      </div>

      <div class="relative h-72 w-full bg-[#F8F7FC] p-4 rounded-lg border border-[#E4DDF2]">
        <canvas id="trendChart"></canvas>
      </div>
    </div>
  `;

  function resetOutputs() {
    const metricsBody = document.getElementById("metricsTableBody");
    if (metricsBody) {
      metricsBody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-500">Run simulation to view metrics</td></tr>`;
    }

    const containers = ["fcfsGanttContainer", "srtfGanttContainer", "rrGanttContainer"];
    containers.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = `<div class="text-xs text-slate-400 italic py-2">Click "Run Simulation" to generate Gantt chart</div>`;
    });

    if (barChartInstance) { barChartInstance.destroy(); barChartInstance = null; }
    if (pieChartInstance) { pieChartInstance.destroy(); pieChartInstance = null; }
    if (trendChartInstance) { trendChartInstance.destroy(); trendChartInstance = null; }
  }

  function setRunEnabled(enabled) {
    const runBtn = document.getElementById("btnRun");
    if (!runBtn) return;
    runBtn.disabled = !enabled;
    runBtn.classList.toggle("opacity-50", !enabled);
    runBtn.classList.toggle("cursor-not-allowed", !enabled);
  }

  function clearAll() {
    currentProcesses = [];
    batchResults = null;

    const tableBody = document.getElementById("workloadTableBody");
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="p-4 text-center text-slate-400 italic">
            No processes loaded — click "Generate Workload" to begin.
          </td>
        </tr>`;
    }

    const quantumDisplay = document.getElementById("quantumDisplay");
    if (quantumDisplay) quantumDisplay.textContent = "Auto-generated (random)";

    resetOutputs();
    setRunEnabled(false);
  }

  function seededRandom(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildWorkload(count, rng) {
    const procs = [];
    let t = 1;
    for (let i = 1; i <= count; i++) {
      t += Math.floor(rng() * 3);
      procs.push({
        id: `P${i}`,
        arrivalTime: t,
        burstTime: Math.floor(rng() * 10) + 1,
        priority: Math.floor(rng() * 5) + 1,
      });
    }
    return procs;
  }

  // === Batch Study ===
  function runBatchStudy() {
    const algos = [
      "Preemptive FCFS (Priority)",
      "SRTF (Priority)",
      `Round Robin (Q=${BATCH_QUANTUM}, Priority)`,
    ];
    const series = algos.map(() => ({ wait: [], tat: [], resp: [], cpu: [], throughput: [] }));

    BATCH_PROCESS_COUNTS.forEach((count) => {
      const totals = algos.map(() => ({ wait: 0, tat: 0, resp: 0, cpu: 0, thr: 0 }));

      for (let trial = 0; trial < BATCH_TRIALS; trial++) {
        const rng = seededRandom(count * 1000 + trial + 1);
        const procs = buildWorkload(count, rng);

        const results = [
          runFCFS(JSON.parse(JSON.stringify(procs))),
          runSRTF(JSON.parse(JSON.stringify(procs))),
          runRoundRobin(JSON.parse(JSON.stringify(procs)), BATCH_QUANTUM),
        ];

        results.forEach((r, i) => {
          totals[i].wait += r.avgWaitingTime;
          totals[i].tat  += r.avgTurnaroundTime;
          totals[i].resp += r.avgResponseTime || 0;
          totals[i].cpu  += r.cpuUtilization;
          totals[i].thr  += r.throughput;
        });
      }

      totals.forEach((t, i) => {
        series[i].wait.push(t.wait / BATCH_TRIALS);
        series[i].tat.push(t.tat / BATCH_TRIALS);
        series[i].resp.push(t.resp / BATCH_TRIALS);
        series[i].cpu.push(t.cpu / BATCH_TRIALS);
        series[i].throughput.push(t.thr / BATCH_TRIALS);
      });
    });

    return { processCounts: BATCH_PROCESS_COUNTS, algorithms: algos, series };
  }

  function renderTrendChart(metric) {
    const canvas = document.getElementById("trendChart");
    if (!canvas || !batchResults) return;

    if (trendChartInstance) trendChartInstance.destroy();

    const colors = ["#6D28D9", "#0EA5E9", "#F59E0B"];

    trendChartInstance = new Chart(canvas.getContext("2d"), {
      type: "line",
      data: {
        labels: batchResults.processCounts.map((c) => `${c} processes`),
        datasets: batchResults.algorithms.map((name, i) => ({
          label: name,
          data: batchResults.series[i][metric],
          borderColor: colors[i],
          backgroundColor: colors[i] + "22",
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 4,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)}`,
            },
          },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(228,221,242,0.5)" } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  // === Single-workload flow ===
  function generateWorkload() {
    const count = parseInt(document.getElementById("processCountSelect").value, 10);
    const rng = seededRandom(Math.floor(Math.random() * 1e9));
    currentProcesses = buildWorkload(count, rng);

    const randomQuantum = Math.floor(Math.random() * 5) + 2;
    const quantumDisplay = document.getElementById("quantumDisplay");
    if (quantumDisplay) {
      quantumDisplay.textContent = `Q=${randomQuantum} (applies to all processes)`;
    }

    renderWorkloadTable();
    resetOutputs();
    setRunEnabled(true);

    return randomQuantum;
  }

  function renderWorkloadTable() {
    const tableBody = document.getElementById("workloadTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = currentProcesses
      .map(
        (p, index) => `
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
    `
      )
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
          labels: labels,
          datasets: [
            { label: "Avg Wait Time (s)", data: avgWaitTimes, backgroundColor: "rgba(109, 40, 217, 0.8)" },
            { label: "Avg Turnaround Time (s)", data: avgTurnaroundTimes, backgroundColor: "rgba(5, 150, 105, 0.8)" },
            { label: "Avg Response Time (s)", data: avgResponseTimes, backgroundColor: "rgba(219, 39, 119, 0.8)" },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
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
          labels: labels,
          datasets: [{
            label: "Avg Waiting Time Share",
            data: avgWaitTimes,
            backgroundColor: ["rgba(109, 40, 217, 0.85)", "rgba(14, 165, 233, 0.85)", "rgba(245, 158, 11, 0.85)"],
            borderColor: ["#6D28D9", "#0EA5E9", "#F59E0B"],
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
                  const value = context.raw;
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  return `${context.label}: ${value.toFixed(2)}s (${percentage}%)`;
                },
              },
            },
          },
        },
      });
    }
  }

  function executeSimulation() {
    document.querySelectorAll(".process-input").forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      const val = parseInt(input.value, 10) || 0;
      if (currentProcesses[index]) {
        currentProcesses[index][field] = val;
      }
    });

    const quantumDisplay = document.getElementById("quantumDisplay");
    const quantumMatch = quantumDisplay ? quantumDisplay.textContent.match(/\d+/) : null;
    const quantum = quantumMatch ? parseInt(quantumMatch[0], 10) : 2;

    const procsFcfs = JSON.parse(JSON.stringify(currentProcesses));
    const procsSrtf = JSON.parse(JSON.stringify(currentProcesses));
    const procsRr = JSON.parse(JSON.stringify(currentProcesses));

    const fcfsResult = typeof runFCFS === "function" ? runFCFS(procsFcfs) : { algorithm: "Preemptive FCFS", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
    const srtfResult = typeof runSRTF === "function" ? runSRTF(procsSrtf) : { algorithm: "SRTF", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
    const rrResult = typeof runRoundRobin === "function" ? runRoundRobin(procsRr, quantum) : { algorithm: `Round Robin (Q=${quantum})`, ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };

    const results = [fcfsResult, srtfResult, rrResult];

    const metricsBody = document.getElementById("metricsTableBody");
    metricsBody.innerHTML = results.map((r) => `
      <tr class="hover:bg-[#F3EEFF]/30">
        <td class="p-2 font-bold text-[#211B2D]">${r.algorithm}</td>
        <td class="p-2 text-[#6D28D9]">${r.avgWaitingTime.toFixed(2)}</td>
        <td class="p-2 text-emerald-600">${r.avgTurnaroundTime.toFixed(2)}</td>
        <td class="p-2 text-pink-600">${(r.avgResponseTime || 0).toFixed(2)}</td>
        <td class="p-2 text-amber-600">${r.cpuUtilization.toFixed(1)}%</td>
        <td class="p-2 text-purple-600">${r.throughput.toFixed(3)}</td>
      </tr>
    `).join("");

    if (typeof renderRowGanttChart === "function") {
      renderRowGanttChart("fcfsGanttContainer", fcfsResult.ganttChart, currentProcesses);
      renderRowGanttChart("srtfGanttContainer", srtfResult.ganttChart, currentProcesses);
      renderRowGanttChart("rrGanttContainer", rrResult.ganttChart, currentProcesses);
    }

    renderComparisonChart(results);
  }

  // 5. Attach Event Listeners
  document.getElementById("btnGenerate").addEventListener("click", () => generateWorkload());
  document.getElementById("btnRun").addEventListener("click", () => executeSimulation());
  document.getElementById("btnClear").addEventListener("click", () => clearAll());

  document.getElementById("btnBatch").addEventListener("click", () => {
    batchResults = runBatchStudy();
    renderTrendChart(document.getElementById("trendMetricSelect").value);
  });

  document.getElementById("trendMetricSelect").addEventListener("change", (e) => {
    if (batchResults) renderTrendChart(e.target.value);
  });

  generateWorkload();
});