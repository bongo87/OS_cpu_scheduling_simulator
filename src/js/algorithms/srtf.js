/**
 * Shortest Remaining Time First (SRTF) with Priority Levels
 * Higher numerical value = Higher Priority (5 > 4 > 3 > 2 > 1).
 */
function runSRTF(processes) {
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

  while (completed < totalProcesses) {
    const readyPool = procs.filter(
      (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
    );

    if (readyPool.length === 0) {
      rawGantt.push({ processId: "IDLE", time: currentTime });
      currentTime++;
      continue;
    }

    // 1st Priority: Priority value (desc) | 2nd Priority: Remaining Time (asc) | 3rd: Arrival
    readyPool.sort(
      (a, b) =>
        b.priority - a.priority ||
        a.remainingTime - b.remainingTime ||
        a.arrivalTime - b.arrivalTime ||
        a.id.localeCompare(b.id)
    );

    const currentProc = readyPool[0];

    if (currentProc.startTime === -1) {
      currentProc.startTime = currentTime;
    }

    rawGantt.push({ processId: currentProc.id, time: currentTime });
    currentProc.remainingTime--;
    currentTime++;

    if (currentProc.remainingTime === 0) {
      currentProc.completionTime = currentTime;
      completed++;
    }
  }

  const ganttChart = compressGantt(rawGantt);
  const processMetrics = computeProcessMetrics(procs);

  return calculateSystemMetrics("SRTF (Priority)", ganttChart, processMetrics);
}

// Expose function to global scope
window.runSRTF = runSRTF;
