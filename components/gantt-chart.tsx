import { Card } from "@/components/ui/card"
import type { Process, ScheduleItem } from "@/lib/types"

interface GanttChartProps {
  schedule: ScheduleItem[]
  processes: Process[]
  currentTime?: number
  showCurrentTime?: boolean
}

export default function GanttChart({
  schedule,
  processes,
  currentTime = -1,
  showCurrentTime = false,
}: GanttChartProps) {
  if (!schedule.length) return <div>No schedule data available</div>

  const totalTime = schedule[schedule.length - 1].endTime

  // Get process color by ID
  const getProcessColor = (processId: number) => {
    const process = processes.find((p) => p.id === processId)
    return process?.color || "#cbd5e1"
  }

  return (
    <div className="space-y-4">
      <div className="relative h-16 w-full">
        {schedule.map((item, index) => {
          const width = ((item.endTime - item.startTime) / totalTime) * 100
          const left = (item.startTime / totalTime) * 100
          const isPast = showCurrentTime && currentTime >= item.endTime
          const isCurrent = showCurrentTime && currentTime >= item.startTime && currentTime < item.endTime
          const opacity = isPast ? 0.7 : 1

          return (
            <div
              key={index}
              className={`absolute h-12 flex items-center justify-center text-white font-medium rounded-md transition-all duration-200 ${
                isCurrent ? "ring-2 ring-offset-2 ring-white" : ""
              }`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: getProcessColor(item.processId),
                minWidth: "30px",
                opacity,
              }}
            >
              {processes.find((p) => p.id === item.processId)?.name}
            </div>
          )
        })}

        {/* Time markers */}
        <div className="absolute top-14 left-0 w-full flex">
          {Array.from({ length: totalTime + 1 }).map((_, i) => (
            <div key={i} className="relative" style={{ left: `${(i / totalTime) * 100}%` }}>
              <div className="absolute h-2 w-0.5 bg-gray-300"></div>
              <div className="absolute -left-1 top-3 text-xs text-gray-500">{i}</div>
            </div>
          ))}
        </div>

        {/* Current time indicator */}
        {showCurrentTime && currentTime >= 0 && currentTime <= totalTime && (
          <div
            className="absolute h-16 w-0.5 bg-red-500 z-10 transition-all duration-200"
            style={{ left: `${(currentTime / totalTime) * 100}%` }}
          >
            <div className="absolute -left-1.5 -top-5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {processes.map((process) => {
          const processItems = schedule.filter((item) => item.processId === process.id)
          const waitingTime = processItems[0]?.startTime - process.arrivalTime || 0
          const turnaroundTime =
            processItems.length > 0 ? processItems[processItems.length - 1].endTime - process.arrivalTime : 0

          return (
            <Card key={process.id} className="p-4 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: process.color }}></div>
              <div className="font-medium">{process.name}</div>
              <div className="text-sm text-muted-foreground">Waiting: {waitingTime}</div>
              <div className="text-sm text-muted-foreground">Turnaround: {turnaroundTime}</div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
