import { Card, CardContent } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import type { Process, SchedulingMetrics } from "@/lib/types"

interface UtilizationDashboardProps {
  metrics: SchedulingMetrics
  processes: Process[]
}

export default function UtilizationDashboard({ metrics, processes }: UtilizationDashboardProps) {
  const waitingTimeData = processes.map((process) => ({
    name: process.name,
    value: metrics.waitingTimes[process.id] || 0,
    color: process.color,
  }))

  const turnaroundTimeData = processes.map((process) => ({
    name: process.name,
    value: metrics.turnaroundTimes[process.id] || 0,
    color: process.color,
  }))

  const utilizationData = [
    { name: "CPU Busy", value: metrics.cpuUtilization * 100, color: "#3b82f6" },
    { name: "CPU Idle", value: 100 - metrics.cpuUtilization * 100, color: "#cbd5e1" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Waiting & Turnaround Times</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processes.map((p) => ({
                  name: p.name,
                  waitingTime: metrics.waitingTimes[p.id] || 0,
                  turnaroundTime: metrics.turnaroundTimes[p.id] || 0,
                }))}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="waitingTime" name="Waiting Time" fill="#3b82f6" />
                <Bar dataKey="turnaroundTime" name="Turnaround Time" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">CPU Utilization</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.averageWaitingTime.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Avg. Waiting Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.averageTurnaroundTime.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Avg. Turnaround Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.throughput.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Throughput</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(metrics.cpuUtilization * 100).toFixed(2)}%</div>
              <div className="text-sm text-muted-foreground">CPU Utilization</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
