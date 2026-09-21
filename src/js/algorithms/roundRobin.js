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
  const rawGantt = [];

  let currentQuantumUsed = 0;
  let activeProc = null;

  while (completed < totalProcesses) {
    const readyPool = procs.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
    );

    if (readyPool.length === 0) {
      rawGantt.push({ processId: "IDLE", time: currentTime });
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

    rawGantt.push({ processId: activeProc.id, time: currentTime });
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

  const ganttChart = compressGantt(rawGantt);
  const processMetrics = computeProcessMetrics(procs);

  return calculateSystemMetrics(`Round Robin (Q=${quantum}, Priority)`, ganttChart, processMetrics);
}

// Expose function to global scope
window.runRoundRobin = runRoundRobin;
