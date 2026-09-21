/**
 * Chart rendering wrapper using Chart.js
 */
let metricsChartInstance = null;

function renderComparisonChart(canvasId, metricsResults) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  if (metricsChartInstance) {
    metricsChartInstance.destroy();
  }

  const labels = metricsResults.map((m) => m.algorithm);

  metricsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Avg Waiting Time",
          data: metricsResults.map((m) => m.avgWaitingTime.toFixed(2)),
          backgroundColor: "rgba(54, 162, 235, 0.7)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "Avg Turnaround Time",
          data: metricsResults.map((m) => m.avgTurnaroundTime.toFixed(2)),
          backgroundColor: "rgba(255, 99, 132, 0.7)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
        {
          label: "Avg Response Time",
          data: metricsResults.map((m) => m.avgResponseTime.toFixed(2)),
          backgroundColor: "rgba(75, 192, 192, 0.7)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: "#fff" },
        },
      },
      scales: {
        x: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "#334155" },
        },
        y: {
          ticks: { color: "#cbd5e1" },
          grid: { color: "#334155" },
          beginAtZero: true,
        },
      },
    },
  });
}