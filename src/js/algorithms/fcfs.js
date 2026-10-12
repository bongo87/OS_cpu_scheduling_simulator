/**
 * src/js/algorithms/fcfs.js
 *
 * First-Come, First-Served (FCFS) — non-preemptive.
 *   Primary criterion : arrival time.
 *   Tiebreakers       : higher priority (5 > 1), then numeric PID.
 *
 * Note: priority is a TIEBREAK ONLY. It never preempts a running process.
 * Once a process is on the CPU, it runs to completion.
 */
function runFCFS(processes) {
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
  let activeProc = null; // once picked, runs to completion

  while (completed < totalProcesses) {
    if (!activeProc) {
      const readyPool = procs.filter(
        (p) => p.arrivalTime <= currentTime && p.remainingTime > 0
      );

      if (readyPool.length === 0) {
        rawGantt.push({ processId: "IDLE", time: currentTime });
        currentTime++;
        continue;
      }

      // Arrival order; priority and PID only break exact arrival ties.
      readyPool.sort(
        (a, b) =>
          a.arrivalTime - b.arrivalTime ||
          b.priority - a.priority ||
          a.id.localeCompare(b.id, undefined, { numeric: true })
      );

      activeProc = readyPool[0];
      if (activeProc.startTime === -1) activeProc.startTime = currentTime;
    }

    // Run one time unit; no preemption.
    rawGantt.push({ processId: activeProc.id, time: currentTime });
    activeProc.remainingTime--;
    currentTime++;

    if (activeProc.remainingTime === 0) {
      activeProc.completionTime = currentTime;
      completed++;
      activeProc = null;
    }
  }

  const ganttChart = compressGantt(rawGantt);
  const processMetrics = computeProcessMetrics(procs);
  return calculateSystemMetrics("FCFS", ganttChart, processMetrics);
}

window.runFCFS = runFCFS;