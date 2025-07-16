export interface SimulationInputs {
  dateRange: {
    from: string;
    to: string;
  };
  dailyVolumes: number[];
  plannedAHT: number;
  inOfficeShrinkage: number;
  outOfOfficeShrinkage: number;
  billableBreakPercent: number;
  slaTarget: number;
  serviceTime: number;
  shiftDuration: number;
  dailyShiftPlan: number[][];
}

export interface IntervalData {
  intervalLabel: string;
  derivedVolume: number;
  plannedAHT: number;
  derivedAgents: number;
  effectiveAgents: number;
  requiredAgents: number;
  slaAchieved: number;
  occupancy: number;
  staffingGap: number;
}

export interface SimulationResults {
  finalSLA: number;
  finalOccupancy: number;
  intervalData: IntervalData[];
  dailyMetrics: {
    date: string;
    sla: number;
    occupancy: number;
    totalVolume: number;
    avgStaffing: number;
  }[];
}

export interface TooltipConfig {
  [key: string]: string;
}