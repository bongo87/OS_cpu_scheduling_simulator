/**
 * src/js/algorithms/charts.js
 * Shared helpers: system metric aggregation, Gantt compression,
 * per-process metric computation, and the row-style Gantt renderer.
 */

/**
 * Aggregates per-process metrics plus the compressed Gantt chart
 * into system-level averages.
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
    .reduce((sum, block) => sum + (block.endTime - block.startTime + 1), 0);

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
 * Compresses sequential raw time steps into block intervals.
 */
function compressGantt(rawGantt) {
  const compressed = [];
  if (!rawGantt || rawGantt.length === 0) return compressed;

  let currentBlock = {
    processId: rawGantt[0].processId,
    startTime: rawGantt[0].time,
    endTime: rawGantt[0].time,
  };

  for (let i = 1; i < rawGantt.length; i++) {
    if (
      rawGantt[i].processId === currentBlock.processId &&
      rawGantt[i].time === currentBlock.endTime + 1
    ) {
      currentBlock.endTime = rawGantt[i].time;
    } else {
      compressed.push(currentBlock);
      currentBlock = {
        processId: rawGantt[i].processId,
        startTime: rawGantt[i].time,
        endTime: rawGantt[i].time,
      };
    }
  }
  compressed.push(currentBlock);
  return compressed;
}

/**
 * Computes turnaround time, waiting time, and response time per process.
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
 * Renders a per-process execution grid:
 * [ Process ID | Priority | Arrival | Burst time | 1 | 2 | 3 ... N ]
 */
function renderRowGanttChart(containerId, ganttChart, processes) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return;
  }

  if (!ganttChart || ganttChart.length === 0) {
    container.innerHTML = "<p class='text-gray-400 p-2'>No simulation data available</p>";
    return;
  }

  const maxTime = Math.max(...ganttChart.map((b) => b.endTime));

  const sortedProcesses = [...processes].sort((a, b) =>
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  let html = `<div class="overflow-x-auto my-2">
    <table class="w-full text-xs text-center border-collapse bg-white text-[#211B2D] border border-[#E4DDF2] font-sans">`;

  html += `<thead><tr class="bg-[#F3EEFF] text-[#4C1D95] border-b border-gray-400 font-bold">
    <th class="p-1 border border-gray-400 text-left min-w-[90px]">Process ID</th>
    <th class="p-1 border border-gray-400 min-w-[50px]">Priority</th>
    <th class="p-1 border border-gray-400 min-w-[50px]">Arrival</th>
    <th class="p-1 border border-gray-400 min-w-[65px]">Burst time</th>`;

  for (let t = 1; t <= maxTime; t++) {
    html += `<th class="p-1 border border-gray-300 min-w-[24px] font-normal">${t}</th>`;
  }
  html += `</tr></thead><tbody>`;

  sortedProcesses.forEach((p) => {
    html += `<tr class="border-b border-gray-300 hover:bg-gray-50">
      <td class="p-1 border border-gray-400 text-left font-semibold">${p.id}</td>
      <td class="p-1 border border-gray-400">${p.priority}</td>
      <td class="p-1 border border-gray-400">${p.arrivalTime}</td>
      <td class="p-1 border border-gray-400">${p.burstTime}</td>`;

    for (let t = 1; t <= maxTime; t++) {
      const isActive = ganttChart.some(
        (b) => b.processId === p.id && b.startTime <= t && b.endTime >= t
      );

      if (isActive) {
        html += `<td class="bg-[#7C3AED] text-white font-extrabold border border-gray-400">*</td>`;
      } else {
        html += `<td class="bg-white border border-gray-200"></td>`;
      }
    }
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  container.innerHTML = html;
}

// ---- Expose helpers to the algorithm files and simulator ----
window.calculateSystemMetrics = calculateSystemMetrics;
window.compressGantt = compressGantt;
window.computeProcessMetrics = computeProcessMetrics;
window.renderRowGanttChart = renderRowGanttChart;