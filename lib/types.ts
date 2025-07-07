export interface Process {
  id: number
  name: string
  arrivalTime: number
  burstTime: number
  priority: number
  color: string
}

export interface ScheduleItem {
  processId: number
  startTime: number
  endTime: number
}

export interface SchedulingMetrics {
  waitingTimes: Record<number, number>
  turnaroundTimes: Record<number, number>
  averageWaitingTime: number
  averageTurnaroundTime: number
  cpuUtilization: number
  throughput: number
}

export interface SchedulingResult {
  schedule: ScheduleItem[]
  metrics: SchedulingMetrics
}
