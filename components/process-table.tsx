"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Process } from "@/lib/types"

interface ProcessTableProps {
  processes: Process[]
  algorithm: string
  updateProcess: (id: number, field: keyof Process, value: number | string) => void
  removeProcess: (id: number) => void
}

export default function ProcessTable({ processes, algorithm, updateProcess, removeProcess }: ProcessTableProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Process</TableHead>
            <TableHead>Arrival Time</TableHead>
            <TableHead>Burst Time</TableHead>
            {algorithm === "priority" && <TableHead>Priority</TableHead>}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processes.map((process) => (
            <TableRow key={process.id}>
              <TableCell>
                <Input
                  value={process.name}
                  onChange={(e) => updateProcess(process.id, "name", e.target.value)}
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  value={process.arrivalTime}
                  onChange={(e) => updateProcess(process.id, "arrivalTime", e.target.value)}
                  className="w-20"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={process.burstTime}
                  onChange={(e) => updateProcess(process.id, "burstTime", e.target.value)}
                  className="w-20"
                />
              </TableCell>
              {algorithm === "priority" && (
                <TableCell>
                  <Input
                    type="number"
                    min="1"
                    value={process.priority}
                    onChange={(e) => updateProcess(process.id, "priority", e.target.value)}
                    className="w-20"
                  />
                </TableCell>
              )}
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProcess(process.id)}
                  disabled={processes.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
