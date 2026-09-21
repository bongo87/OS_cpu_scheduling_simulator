// Shared Helper Utilities
if (typeof compressGantt !== "function") {
  window.compressGantt = function (rawGantt) {
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
  };
}

if (typeof computeProcessMetrics !== "function") {
  window.computeProcessMetrics = function (procs) {
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
  };
}

if (typeof calculateSystemMetrics !== "function") {
  window.calculateSystemMetrics = function (algorithmName, ganttChart, processMetrics) {
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
  };
}

/**
 * Round Robin (RR) with Priority Levels
 * Higher priority processes run first; quantum applies among processes of EQUAL priority.
 */
function runRoundRobin(processes, quantum = 2) {
  const procs = JSON.parse(JSON.stringify(processes)).map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    startTime: -1,
    completionTime: 0,
  }));

  let currentTime = 1;
  let completed = 0;
  const totalProcesses = procs.length;
  const ganttChart = [];

  let currentQuantumUsed = 0;
  let activeProc = null;

  while (completed < totalProcesses) {
    const readyPool = procs.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
    );

    if (readyPool.length === 0) {
      ganttChart.push({ processId: "IDLE", startTime: currentTime, endTime: currentTime + 1 });
      currentTime++;
      activeProc = null;
      currentQuantumUsed = 0;
      continue;
    }

    const highestPriority = Math.min(...readyPool.map((p) => p.priority));
    const highestPriorityPool = readyPool.filter((p) => p.priority === highestPriority);

    if (
      !activeProc ||
      activeProc.remainingTime === 0 ||
      activeProc.priority > highestPriority ||
      currentQuantumUsed >= quantum
    ) {
      if (activeProc && activeProc.priority === highestPriority && activeProc.remainingTime > 0 && currentQuantumUsed >= quantum) {
        const index = highestPriorityPool.indexOf(activeProc);
        activeProc = highestPriorityPool[(index + 1) % highestPriorityPool.length];
      } else {
        activeProc = highestPriorityPool[0];
      }
      currentQuantumUsed = 0;
    }

    if (activeProc.startTime === -1) {
      activeProc.startTime = currentTime;
    }

    const lastGantt = ganttChart[ganttChart.length - 1];
    if (lastGantt && lastGantt.processId === activeProc.id) {
      lastGantt.endTime++;
    } else {
      ganttChart.push({
        processId: activeProc.id,
        startTime: currentTime,
        endTime: currentTime + 1,
      });
    }

    activeProc.remainingTime--;
    currentQuantumUsed++;
    currentTime++;

    if (activeProc.remainingTime === 0) {
      activeProc.completionTime = currentTime;
      completed++;
      activeProc = null;
      currentQuantumUsed = 0;
    }
  }

  const processMetrics = computeProcessMetrics(procs);

  return calculateSystemMetrics(`Round Robin (Q=${quantum}, Priority)`, ganttChart, processMetrics);
}
