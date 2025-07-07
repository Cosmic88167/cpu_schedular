"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, Plus } from "lucide-react"
import ProcessTable from "@/components/process-table"
import GanttChart from "@/components/gantt-chart"
import UtilizationDashboard from "@/components/utilization-dashboard"
import RealTimeVisualization from "@/components/real-time-visualization"
import type { Process, SchedulingResult } from "@/lib/types"
import { runSchedulingAlgorithm } from "@/lib/scheduling"
import { exportToCSV } from "@/lib/export"
import { saveAs } from "file-saver"
import jsPDF from "jspdf"


export default function VisualizePage() {
  const params = useParams()
  const router = useRouter()
  const algorithm = params.algorithm as string

  const [processes, setProcesses] = useState<Process[]>([
    { id: 1, name: "P1", arrivalTime: 0, burstTime: 5, priority: 1, color: "#3b82f6" },
    { id: 2, name: "P2", arrivalTime: 1, burstTime: 3, priority: 2, color: "#10b981" },
    { id: 3, name: "P3", arrivalTime: 2, burstTime: 8, priority: 3, color: "#8b5cf6" },
  ])
  const [quantum, setQuantum] = useState<number>(2)
  const [result, setResult] = useState<SchedulingResult | null>(null)
  const [activeTab, setActiveTab] = useState<string>("input")

  // Real-time visualization states
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1) // seconds per time unit
  const [maxTime, setMaxTime] = useState(0)

  const algorithmNames: Record<string, string> = {
    fcfs: "First Come First Served (FCFS)",
    sjf: "Shortest Job First (SJF)",
    priority: "Priority Scheduling",
    "round-robin": "Round Robin",
    srtf: "Shortest Remaining Time First (SRTF)",
  }

  useEffect(() => {
    if (!algorithmNames[algorithm]) {
      router.push("/algorithms")
    }
  }, [algorithm, router])

  // Animation effect for real-time visualization
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (isPlaying && result && currentTime < maxTime) {
      timer = setTimeout(() => {
        setCurrentTime((prev) => Math.min(prev + 1, maxTime))
      }, 1000 / animationSpeed)
    } else if (currentTime >= maxTime) {
      setIsPlaying(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isPlaying, currentTime, maxTime, animationSpeed, result])

  const addProcess = () => {
    const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"]
    const newId = processes.length > 0 ? Math.max(...processes.map((p) => p.id)) + 1 : 1
    setProcesses([
      ...processes,
      {
        id: newId,
        name: `P${newId}`,
        arrivalTime: 0,
        burstTime: 5,
        priority: 1,
        color: colors[newId % colors.length],
      },
    ])
  }

  const removeProcess = (id: number) => {
    setProcesses(processes.filter((p) => p.id !== id))
  }

  const updateProcess = (id: number, field: keyof Process, value: number | string) => {
    setProcesses(
      processes.map((p) => {
        if (p.id === id) {
          return { ...p, [field]: field === "name" ? value : Number(value) }
        }
        return p
      }),
    )
  }

  const runVisualization = () => {
    const result = runSchedulingAlgorithm(algorithm, processes, quantum)
    setResult(result)
    // Get max time from the schedule for animation
    const endTime = result.schedule[result.schedule.length - 1].endTime
    setMaxTime(endTime)
    setCurrentTime(0)
    setActiveTab("visualization")
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const handleStepForward = () => {
    if (currentTime < maxTime) {
      setCurrentTime(currentTime + 1)
    }
  }

  const handleStepBackward = () => {
    if (currentTime > 0) {
      setCurrentTime(currentTime - 1)
    }
  }

  const handleSpeedChange = (value: number[]) => {
    setAnimationSpeed(value[0])
  }

  function handleExportCSV() {
  if (!result) return
  const csvData = exportToCSV(result.schedule, result.metrics)
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
  saveAs(blob, "cpu-schedule-results.csv")
}

function handleExportPDF() {
  if (!result) return
  const doc = new jsPDF()
  doc.setFontSize(14)
  doc.text("CPU Scheduling Results", 10, 10)

  let y = 20
  doc.setFontSize(12)
  doc.text("Schedule:", 10, y)

  result.schedule.forEach(item => {
    y += 8
    doc.text(`Process ${item.processId}: ${item.startTime} -> ${item.endTime}`, 10, y)
  })

  y += 12
  doc.text("Metrics:", 10, y)

  Object.entries(result.metrics).forEach(([key, value]) => {
    y += 8
    doc.text(`${key}: ${value}`, 10, y)
  })

  doc.save("cpu-schedule-results.pdf")
}

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/algorithms">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tighter">{algorithmNames[algorithm]}</h1>
        </div>
        <p className="text-muted-foreground">
          Enter process details and visualize how the {algorithmNames[algorithm]} algorithm schedules them.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="input">Process Input</TabsTrigger>
          <TabsTrigger value="visualization" disabled={!result}>
            Real-Time Visualization
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {algorithm === "round-robin" && (
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="quantum">Time Quantum</Label>
                    <Input
                      id="quantum"
                      type="number"
                      value={quantum}
                      min={1}
                      onChange={(e) => setQuantum(Number(e.target.value))}
                    />
                  </div>
                )}

                <ProcessTable
                  processes={processes}
                  algorithm={algorithm}
                  updateProcess={updateProcess}
                  removeProcess={removeProcess}
                />

                <div className="flex justify-between">
                  <Button onClick={addProcess} variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Process
                  </Button>
                  <Button onClick={runVisualization}>
                    <Play className="mr-2 h-4 w-4" /> Run Visualization
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Real-Time Visualization</span>
                    <div className="text-lg font-normal">
                      Time: {currentTime} / {maxTime}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RealTimeVisualization
                    schedule={result.schedule}
                    processes={processes}
                    currentTime={currentTime}
                    algorithm={algorithm}
                    quantum={quantum}
                  />

                  <div className="mt-6 space-y-4">
                    <div className="flex justify-center space-x-4">
                      <Button variant="outline" size="icon" onClick={handleReset} disabled={currentTime === 0}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleStepBackward} disabled={currentTime === 0}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button onClick={handlePlayPause} disabled={currentTime >= maxTime}>
                        {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isPlaying ? "Pause" : "Play"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleStepForward}
                        disabled={currentTime >= maxTime}
                      >
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentTime(maxTime)}
                        disabled={currentTime >= maxTime}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 max-w-md mx-auto">
                      <span className="text-sm">Speed:</span>
                      <Slider
                        defaultValue={[1]}
                        min={0.5}
                        max={5}
                        step={0.5}
                        value={[animationSpeed]}
                        onValueChange={handleSpeedChange}
                        className="flex-1"
                      />
                      <span className="text-sm">{animationSpeed}x</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gantt Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChart
                    schedule={result.schedule}
                    processes={processes}
                    currentTime={currentTime}
                    showCurrentTime={true}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Gantt Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <GanttChart schedule={result.schedule} processes={processes} />
                </CardContent>
              </Card>
              {result && (
              <div className="flex gap-4 mb-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={handleExportCSV}
                >
                  Export to CSV
                </button>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  onClick={handleExportPDF}
                >
                  Export to PDF
                </button>
              </div>
            )}

              <Card>
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <UtilizationDashboard metrics={result.metrics} processes={processes} />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
