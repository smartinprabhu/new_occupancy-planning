import { TooltipConfig } from '../types';

export const tooltipConfig: TooltipConfig = {
  dateRange: "Select the evaluation period. Minimum 4 weeks required for accurate modeling.",
  dailyVolumes: "Enter the expected daily contact volumes for each day in the selected period.",
  plannedAHT: "Average handling time per contact in seconds (includes talk time + after-call work).",
  inOfficeShrinkage: "Time lost to internal activities like meetings, coaching, and training.",
  outOfOfficeShrinkage: "Time lost to leaves, absenteeism, and other unavailability factors.",
  billableBreakPercent: "Fraction of shift time allocated to paid breaks and lunch.",
  slaTarget: "Service level agreement target (e.g., 0.80 = 80% of calls answered within threshold).",
  serviceTime: "Maximum time in seconds within which contacts should be answered to meet SLA.",
  shiftDuration: "Duration of each agent shift in hours.",
  dailyShiftPlan: "Number of agents scheduled per day across different shifts.",
  
  // Output tooltips
  intervalLabel: "30-minute time interval during the day.",
  derivedVolume: "Contact volume allocated to this interval using historical distribution patterns.",
  derivedAgents: "Number of agents available during this interval based on shift schedules.",
  effectiveAgents: "Actual usable agents after applying shrinkage and break factors.",
  requiredAgents: "Minimum agents needed to meet SLA target using Erlang C calculations.",
  slaAchieved: "Percentage of contacts answered within service time threshold.",
  occupancy: "Agent utilization rate (time spent handling contacts vs. available time).",
  staffingGap: "Difference between planned and required agents (positive = overstaffed, negative = understaffed)."
};

export function getTooltip(key: string): string {
  return tooltipConfig[key] || "No tooltip available for this field.";
}