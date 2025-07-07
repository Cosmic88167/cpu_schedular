import type { Process, ScheduleItem, SchedulingMetrics, SchedulingResult } from "./types"

export function runSchedulingAlgorithm(algorithm: string, processes: Process[], quantum = 2): SchedulingResult {
  switch (algorithm) {
    case "fcfs":
      return fcfs(processes)
    case "sjf":
      return sjf(processes)
    case "priority":
      return priorityScheduling(processes)
    case "round-robin":
      return roundRobin(processes, quantum)
    case "srtf":
      return srtf(processes)
    default:
      return fcfs(processes)
  }
}

// First Come First Served (FCFS)
function fcfs(processes: Process[]): SchedulingResult {
  const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime)

  const schedule: ScheduleItem[] = []
  let currentTime = 0

  sortedProcesses.forEach((process) => {
    // If there's a gap between processes
    if (process.arrivalTime > currentTime) {
      currentTime = process.arrivalTime
    }

    schedule.push({
      processId: process.id,
      startTime: currentTime,
      endTime: currentTime + process.burstTime,
    })

    currentTime += process.burstTime
  })

  return {
    schedule,
    metrics: calculateMetrics(schedule, processes),
  }
}

// Shortest Job First (SJF)
function sjf(processes: Process[]): SchedulingResult {
  const schedule: ScheduleItem[] = []
  let currentTime = 0
  let remainingProcesses = [...processes]

  while (remainingProcesses.length > 0) {
    // Find processes that have arrived by current time
    const availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= currentTime)

    if (availableProcesses.length === 0) {
      // No processes available, advance time to next arrival
      const nextArrival = Math.min(...remainingProcesses.map((p) => p.arrivalTime))
      currentTime = nextArrival
      continue
    }

    // Find the process with shortest burst time
    const shortestJob = availableProcesses.reduce((prev, curr) => (prev.burstTime < curr.burstTime ? prev : curr))

    // Add to schedule
    schedule.push({
      processId: shortestJob.id,
      startTime: currentTime,
      endTime: currentTime + shortestJob.burstTime,
    })

    // Update current time and remove the process
    currentTime += shortestJob.burstTime
    remainingProcesses = remainingProcesses.filter((p) => p.id !== shortestJob.id)
  }

  return {
    schedule,
    metrics: calculateMetrics(schedule, processes),
  }
}

// Priority Scheduling
function priorityScheduling(processes: Process[]): SchedulingResult {
  const schedule: ScheduleItem[] = []
  let currentTime = 0
  let remainingProcesses = [...processes]

  while (remainingProcesses.length > 0) {
    // Find processes that have arrived by current time
    const availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= currentTime)

    if (availableProcesses.length === 0) {
      // No processes available, advance time to next arrival
      const nextArrival = Math.min(...remainingProcesses.map((p) => p.arrivalTime))
      currentTime = nextArrival
      continue
    }

    // Find the process with highest priority (lower number = higher priority)
    const highestPriorityJob = availableProcesses.reduce((prev, curr) => (prev.priority < curr.priority ? prev : curr))

    // Add to schedule
    schedule.push({
      processId: highestPriorityJob.id,
      startTime: currentTime,
      endTime: currentTime + highestPriorityJob.burstTime,
    })

    // Update current time and remove the process
    currentTime += highestPriorityJob.burstTime
    remainingProcesses = remainingProcesses.filter((p) => p.id !== highestPriorityJob.id)
  }

  return {
    schedule,
    metrics: calculateMetrics(schedule, processes),
  }
}

// Round Robin
function roundRobin(processes: Process[], quantum: number): SchedulingResult {
  const schedule: ScheduleItem[] = []
  let currentTime = 0

  // Create a queue of processes with remaining burst time
  const processQueue: Array<{
    id: number
    remainingTime: number
    arrivalTime: number
  }> = processes.map((p) => ({
    id: p.id,
    remainingTime: p.burstTime,
    arrivalTime: p.arrivalTime,
  }))

  // Sort by arrival time initially
  processQueue.sort((a, b) => a.arrivalTime - b.arrivalTime)

  // If all processes haven't arrived at time 0, advance time
  if (processQueue[0].arrivalTime > 0) {
    currentTime = processQueue[0].arrivalTime
  }

  const readyQueue: typeof processQueue = []
  let completed = 0

  // Add first process to ready queue
  readyQueue.push(processQueue.shift()!)

  while (completed < processes.length) {
    if (readyQueue.length === 0) {
      // If ready queue is empty but processes remain
      if (processQueue.length > 0) {
        currentTime = processQueue[0].arrivalTime
        readyQueue.push(processQueue.shift()!)
      }
      continue
    }

    const currentProcess = readyQueue.shift()!

    // Check if any new processes arrived during this time slice
    while (processQueue.length > 0 && processQueue[0].arrivalTime <= currentTime) {
      readyQueue.push(processQueue.shift()!)
    }

    const executeTime = Math.min(quantum, currentProcess.remainingTime)

    // Add to schedule
    schedule.push({
      processId: currentProcess.id,
      startTime: currentTime,
      endTime: currentTime + executeTime,
    })

    currentTime += executeTime
    currentProcess.remainingTime -= executeTime

    // Check if any new processes arrived during execution
    while (processQueue.length > 0 && processQueue[0].arrivalTime <= currentTime) {
      readyQueue.push(processQueue.shift()!)
    }

    if (currentProcess.remainingTime > 0) {
      // Process still has time remaining, add back to ready queue
      readyQueue.push(currentProcess)
    } else {
      // Process completed
      completed++
    }
  }

  return {
    schedule,
    metrics: calculateMetrics(schedule, processes),
  }
}

// Shortest Remaining Time First (SRTF)
function srtf(processes: Process[]): SchedulingResult {
  const schedule: ScheduleItem[] = []
  let currentTime = 0

  // Create a list of processes with remaining time
  const remainingProcesses = processes.map((p) => ({
    id: p.id,
    arrivalTime: p.arrivalTime,
    remainingTime: p.burstTime,
  }))

  // Sort by arrival time
  remainingProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)

  // If no process at time 0, advance time
  if (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime > 0) {
    currentTime = remainingProcesses[0].arrivalTime
  }

  let currentProcessId = -1
  let processStartTime = currentTime

  while (remainingProcesses.some((p) => p.remainingTime > 0)) {
    // Find available processes
    const availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= currentTime && p.remainingTime > 0)

    if (availableProcesses.length === 0) {
      // No processes available, find next arrival
      const nextProcess = remainingProcesses.find((p) => p.remainingTime > 0)
      if (nextProcess) {
        currentTime = nextProcess.arrivalTime
      }
      continue
    }

    // Find process with shortest remaining time
    const shortestProcess = availableProcesses.reduce((prev, curr) =>
      prev.remainingTime < curr.remainingTime ? prev : curr,
    )

    // If we're switching processes, add the previous one to schedule
    if (currentProcessId !== shortestProcess.id && currentProcessId !== -1) {
      schedule.push({
        processId: currentProcessId,
        startTime: processStartTime,
        endTime: currentTime,
      })
      processStartTime = currentTime
    }

    // Set current process
    currentProcessId = shortestProcess.id

    // Find next event time (process completion or new arrival)
    const processCompletionTime = currentTime + shortestProcess.remainingTime

    // Find next arrival time that's after current time
    const nextArrivalProcess = remainingProcesses.find((p) => p.arrivalTime > currentTime && p.remainingTime > 0)
    const nextArrivalTime = nextArrivalProcess ? nextArrivalProcess.arrivalTime : Number.POSITIVE_INFINITY

    // Determine next event time
    const nextEventTime = Math.min(processCompletionTime, nextArrivalTime)

    // Update remaining time for current process
    const processIndex = remainingProcesses.findIndex((p) => p.id === shortestProcess.id)
    remainingProcesses[processIndex].remainingTime -= nextEventTime - currentTime

    // If process completed at this point
    if (remainingProcesses[processIndex].remainingTime === 0) {
      schedule.push({
        processId: currentProcessId,
        startTime: processStartTime,
        endTime: nextEventTime,
      })
      processStartTime = nextEventTime
      currentProcessId = -1
    }

    // Update current time
    currentTime = nextEventTime
  }

  return {
    schedule,
    metrics: calculateMetrics(schedule, processes),
  }
}

// Calculate metrics from schedule
function calculateMetrics(schedule: ScheduleItem[], processes: Process[]): SchedulingMetrics {
  const waitingTimes: Record<number, number> = {}
  const turnaroundTimes: Record<number, number> = {}

  // Group schedule items by process
  const processSchedules: Record<number, ScheduleItem[]> = {}

  schedule.forEach((item) => {
    if (!processSchedules[item.processId]) {
      processSchedules[item.processId] = []
    }
    processSchedules[item.processId].push(item)
  })

  // Calculate waiting and turnaround times
  processes.forEach((process) => {
    const items = processSchedules[process.id] || []

    if (items.length > 0) {
      // Turnaround time = completion time - arrival time
      const completionTime = Math.max(...items.map((item) => item.endTime))
      turnaroundTimes[process.id] = completionTime - process.arrivalTime

      // Waiting time = turnaround time - burst time
      waitingTimes[process.id] = turnaroundTimes[process.id] - process.burstTime
    } else {
      waitingTimes[process.id] = 0
      turnaroundTimes[process.id] = 0
    }
  })

  // Calculate averages
  const totalWaitingTime = Object.values(waitingTimes).reduce((sum, time) => sum + time, 0)
  const totalTurnaroundTime = Object.values(turnaroundTimes).reduce((sum, time) => sum + time, 0)

  const averageWaitingTime = totalWaitingTime / processes.length
  const averageTurnaroundTime = totalTurnaroundTime / processes.length

  // Calculate CPU utilization
  const totalBurstTime = processes.reduce((sum, process) => sum + process.burstTime, 0)
  const totalTime = Math.max(...schedule.map((item) => item.endTime))
  const cpuUtilization = totalBurstTime / totalTime

  // Calculate throughput
  const throughput = processes.length / totalTime

  return {
    waitingTimes,
    turnaroundTimes,
    averageWaitingTime,
    averageTurnaroundTime,
    cpuUtilization,
    throughput,
  }
}
