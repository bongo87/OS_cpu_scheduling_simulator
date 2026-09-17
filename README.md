# OS_cpu_scheduling_simulator
An interactive, web-based simulation and visualization tool designed to evaluate, compare, and analyze preemptive and non-preemptive CPU scheduling algorithms under dynamic workloads.

---

# Algorithms Implemented

1. **First Come First Served (FCFS)** – Non-preemptive scheduling based on process arrival sequence.
2. **Shortest Remaining Time First (SRTF)** – Preemptive version of Shortest Job First (SJF) prioritizing tasks with the lowest remaining burst time.
3. **Round Robin (RR)** – Preemptive time-slicing algorithm utilizing randomized or fixed time quanta.

---

# Performance Metrics

The simulator evaluates each algorithm using the following standard operating system metrics:

* **Average Waiting Time ($W_t$)**
* **Average Turnaround Time ($T_t$)**
* **Average Response Time ($R_t$)**
* **CPU Utilization (%)**
* **Throughput (processes per unit time)**

---

# Tech Stack & Prerequisites

* **HTML5 / CSS3 / JavaScript** (ES6+)
* **Styling Framework:** Tailwind CSS
* **Runtime Environment:** Node.js & npm (for build tools)

---
