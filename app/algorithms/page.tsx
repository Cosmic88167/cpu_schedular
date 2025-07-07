import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AlgorithmsPage() {
  const algorithms = [
    {
      id: "fcfs",
      name: "First Come First Served (FCFS)",
      description: "Processes are executed in the order they arrive in the ready queue.",
      color: "bg-blue-500",
    },
    {
      id: "sjf",
      name: "Shortest Job First (SJF)",
      description: "Process with the smallest execution time is selected for execution next.",
      color: "bg-green-500",
    },
    {
      id: "priority",
      name: "Priority Scheduling",
      description: "Process with the highest priority is selected for execution next.",
      color: "bg-purple-500",
    },
    {
      id: "round-robin",
      name: "Round Robin",
      description: "Each process is assigned a fixed time slot in a cyclic way.",
      color: "bg-orange-500",
    },
    {
      id: "srtf",
      name: "Shortest Remaining Time First",
      description: "Preemptive version of SJF, where the process with the smallest remaining time is selected.",
      color: "bg-pink-500",
    },
  ]

  return (
    <div className="container py-10 px-4 md:px-6">
      <div className="flex flex-col items-center space-y-4 text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">CPU Scheduling Algorithms</h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
          Select an algorithm to visualize how it schedules processes and affects system performance.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {algorithms.map((algorithm) => (
          <Card key={algorithm.id} className="overflow-hidden">
            <CardHeader className={`text-white ${algorithm.color}`}>
              <CardTitle>{algorithm.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <CardDescription className="text-base">{algorithm.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Link href={`/visualize/${algorithm.id}`} className="w-full">
                <Button className="w-full">Visualize</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
