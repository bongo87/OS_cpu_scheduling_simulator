function runRoundRobin(processes, quantum = 2) {
  if (!Number.isInteger(quantum) || quantum <= 0) {
    throw new Error("Time quantum must be a positive integer.");
  }

  if (processes.some((p) =>
    !Number.isInteger(p.burstTime) ||
    p.burstTime <= 0 ||
    !Number.isInteger(p.arrivalTime) ||
    p.arrivalTime < 0
  )) {
    throw new Error("Invalid process arrival or burst time.");
  }

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

  const queue = [];
  const queuedIds = new Set();

  let activeProc = null;
  let quantumUsed = 0;

  function enqueueArrivals() {
    procs.forEach((p) => {
      if (
        p !== activeProc &&
        p.arrivalTime <= currentTime &&
        p.remainingTime > 0 &&
        !queuedIds.has(p.id)
      ) {
        queue.push(p);
        queuedIds.add(p.id);
      }
    });
  }

  while (completed < totalProcesses) {
    enqueueArrivals();

    if (!activeProc && queue.length === 0) {
      rawGantt.push({
        processId: "IDLE",
        time: currentTime,
      });

      currentTime++;
      continue;
    }

    if (!activeProc) {
      activeProc = queue.shift();
      queuedIds.delete(activeProc.id);
      quantumUsed = 0;

      if (activeProc.startTime === -1) {
        activeProc.startTime = currentTime;
      }
    }

    rawGantt.push({
      processId: activeProc.id,
      time: currentTime,
    });

    activeProc.remainingTime--;
    quantumUsed++;
    currentTime++;

    if (activeProc.remainingTime === 0) {
      activeProc.completionTime = currentTime;
      completed++;
      activeProc = null;
      quantumUsed = 0;
      continue;
    }

    if (quantumUsed >= quantum) {
      enqueueArrivals();

      queue.push(activeProc);
      queuedIds.add(activeProc.id);

      activeProc = null;
      quantumUsed = 0;
    }
  }

  const ganttChart = compressGantt(rawGantt);
  const processMetrics = computeProcessMetrics(procs);

  return calculateSystemMetrics(
    `Round Robin (Q=${quantum})`,
    ganttChart,
    processMetrics
  );
}

window.runRoundRobin = runRoundRobin;