
/**
 * src/js/simulator.js
 */

// Keep track of active Chart.js instances to allow clean re-rendering
let barChartInstance = null;
let pieChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  let currentProcesses = [];

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

        <div class="flex gap-3 pt-2">
          <button id="btnGenerate" class="flex-1 bg-[#F3EEFF] hover:bg-slate-200 text-[#211B2D] font-medium text-sm py-2 px-4 rounded-lg transition-colors border border-[#E4DDF2]">
            Generate Workload
          </button>
          <button id="btnRun" class="flex-1 bg-[#6D28D9] hover:bg-[#5b21b6] text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors shadow">
            Run Simulation
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
              <!-- Dynamically populated with interactive input fields -->
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
        <!-- Chart 1: Bar Chart -->
        <div class="bg-[#F8F7FC] p-4 rounded-lg border border-[#E4DDF2] flex flex-col items-center">
          <h3 class="text-xs font-bold text-[#756D80] uppercase tracking-wider mb-2">Average Times Comparison</h3>
          <div class="relative h-64 w-full">
            <canvas id="comparisonBarChart"></canvas>
          </div>
        </div>

        <!-- Chart 2: Pie Chart -->
        <div class="bg-[#F8F7FC] p-4 rounded-lg border border-[#E4DDF2] flex flex-col items-center">
          <h3 class="text-xs font-bold text-[#756D80] uppercase tracking-wider mb-2">Total Waiting Time Distribution</h3>
          <div class="relative h-64 w-full">
            <canvas id="comparisonPieChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  // Helper to reset outputs prior to running simulation
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

    if (barChartInstance) {
      barChartInstance.destroy();
      barChartInstance = null;
    }
    if (pieChartInstance) {
      pieChartInstance.destroy();
      pieChartInstance = null;
    }
  }

  // 2. Random Workload Generator (Only builds workload and table)
  function generateWorkload() {
    const count = parseInt(document.getElementById("processCountSelect").value, 10);
    currentProcesses = [];

    let currentArrivalTime = 1;
    for (let i = 1; i <= count; i++) {
      const arrivalIncrement = Math.floor(Math.random() * 3); // 0, 1, or 2
      currentArrivalTime += arrivalIncrement;

      currentProcesses.push({
        id: `P${i}`,
        arrivalTime: currentArrivalTime,
        burstTime: Math.floor(Math.random() * 10) + 1, // Random burst time 1-10
        priority: Math.floor(Math.random() * 5) + 1, // Random priority 1-5
      });
    }

    // Generate random time quantum for Round Robin
    const randomQuantum = Math.floor(Math.random() * 5) + 2; // 2-6
    const quantumDisplay = document.getElementById("quantumDisplay");
    if (quantumDisplay) {
      quantumDisplay.textContent = `Q=${randomQuantum} (applies to all processes)`;
    }

    // Render interactive workload table inputs
    renderWorkloadTable();

    // Reset previous execution results
    resetOutputs();

    return randomQuantum;
  }

  // Helper to render interactive table inputs
  function renderWorkloadTable() {
    const tableBody = document.getElementById("workloadTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = currentProcesses
      .map(
        (p, index) => `
      <tr class="hover:bg-[#F3EEFF]/30">
        <td class="p-2 font-bold text-[#6D28D9]">${p.id}</td>
        <td class="p-2">
          <input 
            type="number" 
            min="0" 
            value="${p.arrivalTime}" 
            data-index="${index}" 
            data-field="arrivalTime"
            class="process-input w-20 bg-[#F8F7FC] border border-[#E4DDF2] rounded px-2 py-1 text-xs text-[#211B2D] focus:outline-none focus:border-[#6D28D9]"
          />
        </td>
        <td class="p-2">
          <input 
            type="number" 
            min="1" 
            value="${p.burstTime}" 
            data-index="${index}" 
            data-field="burstTime"
            class="process-input w-20 bg-[#F8F7FC] border border-[#E4DDF2] rounded px-2 py-1 text-xs text-[#211B2D] focus:outline-none focus:border-[#6D28D9]"
          />
        </td>
        <td class="p-2">
          <input 
            type="number" 
            min="1" 
            max="5" 
            value="${p.priority}" 
            data-index="${index}" 
            data-field="priority"
            class="process-input w-20 bg-[#F8F7FC] border border-[#E4DDF2] rounded px-2 py-1 text-xs text-[#211B2D] focus:outline-none focus:border-[#6D28D9]"
          />
        </td>
      </tr>
    `
      )
      .join("");

    // Event listener to sync live changes back to currentProcesses state array
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

  // 3. Render Comparison Charts (Bar Chart & Pie Chart)
  function renderComparisonChart(results) {
    const labels = results.map((r) => r.algorithm);
    const avgWaitTimes = results.map((r) => r.avgWaitingTime);
    const avgTurnaroundTimes = results.map((r) => r.avgTurnaroundTime);
    const avgResponseTimes = results.map((r) => r.avgResponseTime || 0);

    // --- 1. BAR CHART: Average Times Comparison ---
    const ctxBar = document.getElementById("comparisonBarChart");
    if (ctxBar) {
      if (barChartInstance) barChartInstance.destroy();

      barChartInstance = new Chart(ctxBar, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Avg Wait Time (s)",
              data: avgWaitTimes,
              backgroundColor: "rgba(109, 40, 217, 0.8)",
            },
            {
              label: "Avg Turnaround Time (s)",
              data: avgTurnaroundTimes,
              backgroundColor: "rgba(5, 150, 105, 0.8)",
            },
            {
              label: "Avg Response Time (s)",
              data: avgResponseTimes,
              backgroundColor: "rgba(219, 39, 119, 0.8)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 10 } } },
          },
          scales: {
            y: { beginAtZero: true, grid: { color: "rgba(228, 221, 242, 0.5)" } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    // --- 2. PIE CHART: Total Waiting Time Share with Distinct Palette ---
    const ctxPie = document.getElementById("comparisonPieChart");
    if (ctxPie) {
      if (pieChartInstance) pieChartInstance.destroy();

      const pieFillColors = [
        "rgba(109, 40, 217, 0.85)",  // Purple (Preemptive FCFS)
        "rgba(14, 165, 233, 0.85)",  // Sky Blue (SRTF)
        "rgba(245, 158, 11, 0.85)",  // Amber/Gold (Round Robin)
      ];

      const pieBorderColors = [
        "#6D28D9",
        "#0EA5E9",
        "#F59E0B",
      ];

      pieChartInstance = new Chart(ctxPie, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Avg Waiting Time Share",
              data: avgWaitTimes,
              backgroundColor: pieFillColors,
              borderColor: pieBorderColors,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
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

  // 4. Main Controller Runner (Only triggered on "Run Simulation")
  function executeSimulation() {
    // Collect updated manual input values prior to execution
    document.querySelectorAll(".process-input").forEach((input) => {
      const index = parseInt(input.getAttribute("data-index"), 10);
      const field = input.getAttribute("data-field");
      const val = parseInt(input.value, 10) || 0;
      if (currentProcesses[index]) {
        currentProcesses[index][field] = val;
      }
    });

    // Extract current Quantum
    const quantumDisplay = document.getElementById("quantumDisplay");
    const quantumMatch = quantumDisplay ? quantumDisplay.textContent.match(/\d+/) : null;
    const quantum = quantumMatch ? parseInt(quantumMatch[0], 10) : 2;

    // Deep clone process list to avoid mutations during algorithm execution
    const procsFcfs = JSON.parse(JSON.stringify(currentProcesses));
    const procsSrtf = JSON.parse(JSON.stringify(currentProcesses));
    const procsRr = JSON.parse(JSON.stringify(currentProcesses));

    // Execute scheduling algorithms
    const fcfsResult = typeof runFCFS === "function" ? runFCFS(procsFcfs) : { algorithm: "Preemptive FCFS", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
    const srtfResult = typeof runSRTF === "function" ? runSRTF(procsSrtf) : { algorithm: "SRTF", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
    const rrResult = typeof runRoundRobin === "function" ? runRoundRobin(procsRr, quantum) : { algorithm: `Round Robin (Q=${quantum})`, ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };

    const results = [fcfsResult, srtfResult, rrResult];

    // Populate Metrics Summary Table
    const metricsBody = document.getElementById("metricsTableBody");
    metricsBody.innerHTML = results
      .map(
        (r) => `
      <tr class="hover:bg-[#F3EEFF]/30">
        <td class="p-2 font-bold text-[#211B2D]">${r.algorithm}</td>
        <td class="p-2 text-[#6D28D9]">${r.avgWaitingTime.toFixed(2)}</td>
        <td class="p-2 text-emerald-600">${r.avgTurnaroundTime.toFixed(2)}</td>
        <td class="p-2 text-pink-600">${(r.avgResponseTime || 0).toFixed(2)}</td>
        <td class="p-2 text-amber-600">${r.cpuUtilization.toFixed(1)}%</td>
        <td class="p-2 text-purple-600">${r.throughput.toFixed(3)}</td>
      </tr>
    `
      )
      .join("");

    // Render Process-Row Grid Gantt Charts
    if (typeof renderRowGanttChart === "function") {
      renderRowGanttChart("fcfsGanttContainer", fcfsResult.ganttChart, currentProcesses);
      renderRowGanttChart("srtfGanttContainer", srtfResult.ganttChart, currentProcesses);
      renderRowGanttChart("rrGanttContainer", rrResult.ganttChart, currentProcesses);
    }

    // Render Canvas Charts (Bar & Pie)
    renderComparisonChart(results);
  }

  // 5. Attach Event Listeners
  document.getElementById("btnGenerate").addEventListener("click", () => {
    generateWorkload(); // Generates workload table only
  });

  document.getElementById("btnRun").addEventListener("click", () => {
    executeSimulation(); // Runs execution timelines, metrics, and charts
  });

  // Initial setup on page load: create initial workload but wait for Run Simulation
  generateWorkload();
});