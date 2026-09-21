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