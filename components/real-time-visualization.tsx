"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Process, ScheduleItem } from "@/lib/types"

interface RealTimeVisualizationProps {
  schedule: ScheduleItem[]
  processes: Process[]
  currentTime: number
  algorithm: string
  quantum: number
}

export default function RealTimeVisualization({
  schedule,
  processes,
  currentTime,
  algorithm,
  quantum,
}: RealTimeVisualizationProps) {
  const [readyQueue, setReadyQueue] = useState<Process[]>([])
  const [runningProcess, setRunningProcess] = useState<Process | null>(null)
  const [remainingBurstTimes, setRemainingBurstTimes] = useState<Record<number, number>>({})
  const [explanation, setExplanation] = useState<string>("")

  // Initialize the remaining burst times
  useEffect(() => {
    const times: Record<number, number> = {}
    processes.forEach((process) => {
      times[process.id] = process.burstTime
    })
    setRemainingBurstTimes(times)
  }, [processes])

  // Update the visualization state based on the current time
  useEffect(() => {
    // Find processes that have arrived by the current time
    const arrivedProcesses = processes
      .filter((p) => p.arrivalTime <= currentTime)
      .sort((a, b) => a.arrivalTime - b.arrivalTime)

    // Find the running process at the current time
    const currentScheduleItem = schedule.find((item) => item.startTime <= currentTime && item.endTime > currentTime)

    let newRunningProcess = null
    if (currentScheduleItem) {
      newRunningProcess = processes.find((p) => p.id === currentScheduleItem.processId) || null
    }

    // Calculate remaining burst times based on the schedule
    const newRemainingBurstTimes = { ...remainingBurstTimes }
    processes.forEach((process) => {
      // Find all schedule items for this process that have started
      const processItems = schedule.filter((item) => item.processId === process.id && item.startTime < currentTime)

      // Calculate how much time has been used
      let usedTime = 0
      processItems.forEach((item) => {
        const endTime = Math.min(item.endTime, currentTime)
        const startTime = item.startTime
        usedTime += endTime - startTime
      })

      // Update remaining time
      newRemainingBurstTimes[process.id] = Math.max(0, process.burstTime - usedTime)
    })

    // Calculate the ready queue (processes that have arrived but are not currently running)
    let newReadyQueue = arrivedProcesses.filter((p) => !currentScheduleItem || p.id !== currentScheduleItem.processId)

    // Sort the ready queue based on the algorithm
    if (algorithm === "sjf") {
      newReadyQueue = newReadyQueue.sort((a, b) => a.burstTime - b.burstTime)
    } else if (algorithm === "priority") {
      newReadyQueue = newReadyQueue.sort((a, b) => a.priority - b.priority)
    } else if (algorithm === "srtf") {
      // For SRTF, we need to consider remaining burst times
      newReadyQueue = newReadyQueue.sort(
        (a, b) => (newRemainingBurstTimes[a.id] || 0) - (newRemainingBurstTimes[b.id] || 0),
      )
    }

    // Generate explanation text
    let newExplanation = ""
    if (newRunningProcess) {
      const remainingTime = newRemainingBurstTimes[newRunningProcess.id]
      newExplanation = `Process ${newRunningProcess.name} is currently running with ${remainingTime} time units remaining.`

      if (algorithm === "round-robin") {
        // Find the current time slice
        const currentSliceStart = currentScheduleItem?.startTime || 0
        const timeInSlice = currentTime - currentSliceStart
        const remainingInSlice = quantum - timeInSlice

        newExplanation += ` It has used ${timeInSlice} out of its ${quantum} time quantum with ${remainingInSlice} remaining.`
      }
    } else {
      newExplanation = "CPU is idle. No process is currently running."
    }

    if (newReadyQueue.length > 0) {
      newExplanation += ` There ${newReadyQueue.length === 1 ? "is" : "are"} ${newReadyQueue.length} process${newReadyQueue.length === 1 ? "" : "es"} in the ready queue.`
    } else {
      newExplanation += " The ready queue is empty."
    }

    // Set the states
    setReadyQueue(newReadyQueue)
    setRunningProcess(newRunningProcess)
    setRemainingBurstTimes(newRemainingBurstTimes)
    setExplanation(newExplanation)
  }, [currentTime, schedule, processes, algorithm, quantum]) // Remove remainingBurstTimes from dependencies

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-2">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">CPU</h3>
              <div className="border-2 rounded-lg p-4 h-24 flex items-center justify-center">
                {runningProcess ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: runningProcess.color }}></div>
                      <span className="font-bold">{runningProcess.name}</span>
                    </div>
                    <div className="text-sm">Remaining: {remainingBurstTimes[runningProcess.id] || 0} time units</div>
                    {algorithm === "round-robin" && (
                      <div className="text-xs text-muted-foreground">Time Quantum: {quantum}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground">IDLE</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Ready Queue</h3>
              <div className="border-2 rounded-lg p-4 min-h-16 flex flex-wrap gap-2">
                {readyQueue.length > 0 ? (
                  readyQueue.map((process) => (
                    <Badge
                      key={process.id}
                      className="flex items-center gap-1.5 px-3 py-1.5"
                      style={{ backgroundColor: process.color }}
                    >
                      {process.name}
                      <span className="text-xs opacity-90">({remainingBurstTimes[process.id] || 0})</span>
                    </Badge>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">Empty</div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Explanation</h3>
              <div className="border-2 rounded-lg p-4 min-h-16">
                <p>{explanation}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Process Status</h3>
          <div className="space-y-3">
            {processes.map((process) => {
              const isRunning = runningProcess?.id === process.id
              const isInReadyQueue = readyQueue.some((p) => p.id === process.id)
              const hasArrived = process.arrivalTime <= currentTime
              const isCompleted = remainingBurstTimes[process.id] === 0

              let status = "Not Arrived"
              if (isCompleted) status = "Completed"
              else if (isRunning) status = "Running"
              else if (isInReadyQueue) status = "Ready"
              else if (hasArrived) status = "Ready"

              return (
                <div
                  key={process.id}
                  className={`flex items-center justify-between p-3 rounded-md ${isRunning ? "bg-primary/10" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: process.color }}></div>
                    <span>{process.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">Remaining: {remainingBurstTimes[process.id] || 0}</span>
                    <Badge
                      variant={
                        isRunning ? "default" : isCompleted ? "outline" : isInReadyQueue ? "secondary" : "outline"
                      }
                    >
                      {status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
