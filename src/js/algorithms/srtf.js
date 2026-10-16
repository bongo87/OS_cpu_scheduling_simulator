function runSRTF(processes) {
  const procs = JSON.parse(JSON.stringify(processes)).map((p) => ({
    ...p,
    remainingTime: p.burstTime,
    startTime: -1,
    completionTime: 0,
  }));

  let currentTime = 0;
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

    readyPool.sort(
      (a, b) =>
        a.remainingTime - b.remainingTime ||
        b.priority - a.priority ||
        a.arrivalTime - b.arrivalTime ||
        a.id.localeCompare(b.id, undefined, { numeric: true })
    );

    const currentProc = readyPool[0];
    if (currentProc.startTime === -1) currentProc.startTime = currentTime;

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
  return calculateSystemMetrics("SRTF", ganttChart, processMetrics);
}

window.runSRTF = runSRTF;