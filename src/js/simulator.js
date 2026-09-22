/**
 * src/js/simulator.js
 */

document.addEventListener("DOMContentLoaded", () => {
  let currentProcesses = [];

  // 1. Inject Dashboard UI into <main id="app">
  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  appContainer.innerHTML = `
    <!-- Top Controls & Generated Workload Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Controls Card -->
      <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg space-y-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span></span> Simulation Controls (Audio-Video System)
        </h2>
        
        <div>
          <label class="block text-xs text-slate-400 mb-1">PROCESS COUNT</label>
          <select id="processCountSelect" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
            <option value="10" selected>10 Processes</option>
            <option value="20">20 Processes</option>
            <option value="30">30 Processes</option>
            <option value="40">40 Processes</option>
            <option value="50">50 Processes</option>
          </select>
        </div>

        <div>
          <label class="block text-xs text-slate-400 mb-1">TIME QUANTUM (RR - System-Wide)</label>
          <div id="quantumDisplay" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
            Auto-generated (random)
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button id="btnGenerate" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium text-sm py-2 px-4 rounded-lg transition-colors">
            Generate Workload
          </button>
          <button id="btnRun" class="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm py-2 px-4 rounded-lg transition-colors">
            Run Simulation
          </button>
        </div>
      </div>

      <!-- Generated Workload Table -->
      <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
        <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span></span> Generated Workload (Audio-Video Processes)
        </h2>
        <div class="overflow-y-auto max-h-52 pr-1">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-900/60 text-slate-400">
              <tr>
                <th class="p-2 rounded-l">PID</th>
                <th class="p-2">ARRIVAL TIME</th>
                <th class="p-2">BURST TIME</th>
                <th class="p-2 rounded-r">PRIORITY</th>
              </tr>
            </thead>
            <tbody id="workloadTableBody" class="divide-y divide-slate-700/50 text-slate-300">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- Performance Metrics Summary Table -->
      <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
        <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span></span> Performance Metrics
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left">
            <thead class="bg-slate-900/60 text-slate-400">
              <tr>
                <th class="p-2 rounded-l">ALGORITHM</th>
                <th class="p-2">AVG WAIT</th>
                <th class="p-2">AVG TAT</th>
                <th class="p-2">AVG RESP</th>
                <th class="p-2">CPU UTIL</th>
                <th class="p-2 rounded-r">THROUGHPUT</th>
              </tr>
            </thead>
            <tbody id="metricsTableBody" class="divide-y divide-slate-700/50 text-slate-300 font-mono">
              <tr><td colspan="6" class="p-3 text-center text-slate-500">Run simulation to view metrics</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Execution Timelines (Gantt Charts Matrix) -->
    <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg space-y-6">
      <h2 class="text-lg font-bold text-white flex items-center gap-2">
        <span></span> Execution Timelines (Gantt Charts)
      </h2>

      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-2">Preemptive FCFS (Priority)</h3>
        <div id="fcfsGanttContainer"></div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-2">SRTF (Priority)</h3>
        <div id="srtfGanttContainer"></div>
      </div>

      <div>
        <h3 class="text-sm font-semibold text-slate-300 mb-2">Round Robin (Priority)</h3>
        <div id="rrGanttContainer"></div>
      </div>
    </div>

    <!-- Metric Comparison Graph Canvas -->
    <div class="bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 shadow-lg">
      <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span></span> Metric Comparison Graph
      </h2>
      <div class="relative h-64 w-full">
        <canvas id="comparisonChart"></canvas>
      </div>
    </div>
  `;

  // 2. Random Workload Generator Helper
  function generateWorkload() {
    const count = parseInt(document.getElementById("processCountSelect").value, 10);
    currentProcesses = [];

    let currentArrivalTime = 1;
    for (let i = 1; i <= count; i++) {
      // Incremental arrival time with random increments
      const arrivalIncrement = Math.floor(Math.random() * 3); // 0, 1, or 2
      currentArrivalTime += arrivalIncrement;

      currentProcesses.push({
        id: `P${i}`,
        arrivalTime: currentArrivalTime,
        burstTime: Math.floor(Math.random() * 10) + 1, // Random burst time 1-10
        priority: Math.floor(Math.random() * 5) + 1, // Random priority 1-5
      });
    }

    // Generate a random time quantum for Round Robin simulation (system-wide)
    const randomQuantum = Math.floor(Math.random() * 5) + 2; // 2-6
    const quantumDisplay = document.getElementById("quantumDisplay");
    if (quantumDisplay) {
      quantumDisplay.textContent = `Q=${randomQuantum} (applies to all processes)`;
    }

    // Render generated processes to workload table
    const tableBody = document.getElementById("workloadTableBody");
    tableBody.innerHTML = currentProcesses
      .map(
        (p) => `
      <tr class="hover:bg-slate-700/30">
        <td class="p-2 font-bold text-cyan-400">${p.id}</td>
        <td class="p-2">${p.arrivalTime}</td>
        <td class="p-2">${p.burstTime}</td>
        <td class="p-2"><span class="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-200">Priority ${p.priority}</span></td>
      </tr>
    `
      )
      .join("");
    
    return randomQuantum;
  }

  // 3. Main Controller Runner Hook
  function executeSimulation() {
    // Generate workload with random quantum
    const quantum = generateWorkload();

    // Deep clone process list to avoid mutation across algorithm executions
    const procsFcfs = JSON.parse(JSON.stringify(currentProcesses));
    const procsSrtf = JSON.parse(JSON.stringify(currentProcesses));
    const procsRr = JSON.parse(JSON.stringify(currentProcesses));

    // Execute algorithms (Ensure fcfs.js, srtf.js, roundRobin.js expose these functions)
    const fcfsResult = typeof runFCFS === "function" ? runFCFS(procsFcfs) : { algorithm: "Preemptive FCFS", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
    const srtfResult = typeof runSRTF === "function" ? runSRTF(procsSrtf) : { algorithm: "SRTF", ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
    const rrResult = typeof runRoundRobin === "function" ? runRoundRobin(procsRr, quantum) : { algorithm: `Round Robin (Q=${quantum})`, ganttChart: [], avgWaitingTime: 0, avgTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };

    const results = [fcfsResult, srtfResult, rrResult];

    // Populate Metrics Summary Table
    const metricsBody = document.getElementById("metricsTableBody");
    metricsBody.innerHTML = results
      .map(
        (r) => `
      <tr class="hover:bg-slate-700/30">
        <td class="p-2 font-bold text-white">${r.algorithm}</td>
        <td class="p-2 text-cyan-400">${r.avgWaitingTime.toFixed(2)}</td>
        <td class="p-2 text-emerald-400">${r.avgTurnaroundTime.toFixed(2)}</td>
        <td class="p-2 text-pink-400">${(r.avgResponseTime || 0).toFixed(2)}</td>
        <td class="p-2 text-amber-400">${r.cpuUtilization.toFixed(1)}%</td>
        <td class="p-2 text-purple-400">${r.throughput.toFixed(3)}</td>
      </tr>
    `
      )
      .join("");

    // Render Process-Row Grid Gantt Charts
    renderRowGanttChart("fcfsGanttContainer", fcfsResult.ganttChart, currentProcesses);
    renderRowGanttChart("srtfGanttContainer", srtfResult.ganttChart, currentProcesses);
    renderRowGanttChart("rrGanttContainer", rrResult.ganttChart, currentProcesses);

    // Render Canvas Bar Chart
    renderComparisonChart(results);
  }

  // 4. Attach Event Listeners
  document.getElementById("btnGenerate").addEventListener("click", () => {
    generateWorkload();
  });

  document.getElementById("btnRun").addEventListener("click", () => {
    executeSimulation();
  });

  // Initial setup on load
  generateWorkload();
  executeSimulation();
});
