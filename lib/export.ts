import { ScheduleItem, SchedulingMetrics } from "./types"

export function exportToCSV(schedule: ScheduleItem[], metrics: SchedulingMetrics): string {
  const scheduleHeader = "Process ID,Start Time,End Time"
  const scheduleRows = schedule.map(item =>
    `${item.processId},${item.startTime},${item.endTime}`
  )

  const metricsHeader = "\n\nMetric,Value"
  const metricsRows = Object.entries(metrics).map(([key, value]) =>
    `${key},${value}`
  )

  return [scheduleHeader, ...scheduleRows, metricsHeader, ...metricsRows].join("\n")
}


import jsPDF from "jspdf";

export function exportToPDF(schedule: ScheduleItem[], metrics: SchedulingMetrics): jsPDF {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("CPU Scheduling Report", 20, 20);

  doc.setFontSize(12);
  doc.text("Schedule:", 20, 30);
  let y = 40;
  schedule.forEach((item, index) => {
    doc.text(`#${index + 1} - Process ID: ${item.processId}, Start Time: ${item.startTime}, End Time: ${item.endTime}`, 20, y);
    y += 10;
  });

  y += 10;
  doc.text("Metrics:", 20, y);
  y += 10;
  Object.entries(metrics).forEach(([key, value]) => {
    doc.text(`${key}: ${value}`, 20, y);
    y += 10;
  });

  return doc;
}
