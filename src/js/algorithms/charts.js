/**
 * src/js/charts.js
 */

// Global Chart instance tracker to allow clean re-renders
let comparisonChartInstance = null;

/**
 * Shared System Metrics Calculator
 * Aggregates individual process metrics into system-wide averages.
 */
function calculateSystemMetrics(algorithmName, ganttChart, processMetrics) {
  const totalProcesses = processMetrics.length;
  if (totalProcesses === 0) {
    return {
      algorithm: algorithmName,
      totalSimulationTime: 0,
      ganttChart: [],
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      avgResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
    };
  }

  const totalWait = processMetrics.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTat = processMetrics.reduce((sum, p) => sum + p.turnaroundTime, 0);
  const totalResp = processMetrics.reduce((sum, p) => sum + (p.responseTime || 0), 0);

  const maxCompletionTime = Math.max(...processMetrics.map((p) => p.completionTime));
  const minArrivalTime = Math.min(...processMetrics.map((p) => p.arrivalTime));
  const totalSimulationTime = maxCompletionTime - minArrivalTime;

  const busyTime = ganttChart
    .filter((block) => block.processId !== "IDLE")
    .reduce((sum, block) => sum + (block.endTime - block.startTime), 0);

  return {
    algorithm: algorithmName,
    totalSimulationTime,
    ganttChart,
    avgWaitingTime: totalWait / totalProcesses,
    avgTurnaroundTime: totalTat / totalProcesses,
    avgResponseTime: totalResp / totalProcesses,
    cpuUtilization: totalSimulationTime > 0 ? (busyTime / totalSimulationTime) * 100 : 0,
    throughput: totalSimulationTime > 0 ? totalProcesses / totalSimulationTime : 0,
  };
}

/**
 * Compresses sequential time-step blocks into aggregated start/end intervals.
 */
function compressGantt(rawGantt) {
  const compressed = [];
  if (rawGantt.length === 0) return compressed;

  let currentBlock = {
    processId: rawGantt[0].processId,
    startTime: rawGantt[0].time,
    endTime: rawGantt[0].time + 1,
  };

  for (let i = 1; i < rawGantt.length; i++) {
    if (rawGantt[i].processId === currentBlock.processId) {
      currentBlock.endTime++;
    } else {
      compressed.push(currentBlock);
      currentBlock = {
        processId: rawGantt[i].processId,
        startTime: rawGantt[i].time,
        endTime: rawGantt[i].time + 1,
      };
    }
  }
  compressed.push(currentBlock);
  return compressed;
}

/**
 * Computes individual process metrics (TAT, WT, RT).
 */
function computeProcessMetrics(procs) {
  return procs.map((p) => {
    const turnaroundTime = p.completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = p.startTime - p.arrivalTime;

    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      completionTime: p.completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    };
  });
}

/**
 * Renders a row-based per-process matrix grid for the Gantt chart.
 */
function renderRowGanttChart(containerId, ganttChart, processes) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!ganttChart || ganttChart.length === 0) {
    container.innerHTML = "<p class='text-gray-400 p-2'>No simulation data available</p>";
    return;
  }

  const maxTime = Math.max(...ganttChart.map((b) => b.endTime));
  const processList = processes.map((p) => p.id).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  let html = `<div class="overflow-x-auto my-2">
    <table class="w-full text-xs text-center border-collapse bg-slate-900 border border-slate-700">`;

  // Header row displaying time steps
  html += `<thead><tr class="bg-slate-800 text-gray-300">
    <th class="p-2 border border-slate-700 font-semibold min-w-[80px]">Process ID</th>`;
  for (let t = 1; t <= maxTime; t++) {
    html += `<th class="p-1 border border-slate-700 min-w-[28px] font-mono">${t}</th>`;
  }
  html += `</tr></thead><tbody>`;

  // Process rows
  processList.forEach((pId) => {
    html += `<tr class="border-b border-slate-800">
      <td class="p-2 font-bold border border-slate-700 text-left bg-slate-900 text-slate-200">${pId}</td>`;

    for (let t = 1; t <= maxTime; t++) {
      const isActive = ganttChart.some(
        (b) => b.processId === pId && b.startTime <= t - 1 && b.endTime >= t
      );

      if (isActive) {
        html += `<td class="bg-yellow-400 text-slate-950 font-extrabold border border-amber-500">*</td>`;
      } else {
        html += `<td class="bg-slate-900/50 border border-slate-800"></td>`;
      }
    }
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

/**
 * Initializes/updates the Chart.js grouped bar comparison chart.
 */
function renderComparisonChart(results) {
  const canvas = document.getElementById("comparisonChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (comparisonChartInstance) {
    comparisonChartInstance.destroy();
  }

  const labels = results.map((r) => r.algorithm);

  comparisonChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Avg Waiting Time",
          data: results.map((r) => Number(r.avgWaitingTime.toFixed(2))),
          backgroundColor: "#3b82f6",
        },
        {
          label: "Avg Turnaround Time",
          data: results.map((r) => Number(r.avgTurnaroundTime.toFixed(2))),
          backgroundColor: "#10b981",
        },
        {
          label: "Avg Response Time",
          data: results.map((r) => Number((r.avgResponseTime || 0).toFixed(2))),
          backgroundColor: "#f59e0b",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "#9ca3af" },
        },
        x: {
          grid: { color: "rgba(255, 255, 255, 0.1)" },
          ticks: { color: "#9ca3af" },
        },
      },
      plugins: {
        legend: { labels: { color: "#e5e7eb" } },
      },
    },
  });
}
