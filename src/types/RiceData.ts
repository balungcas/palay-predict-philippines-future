export interface RiceProductionData {
  year: number;
  grossProduction: number;
  item?: string; // Added optional item field
}

export interface PredictionResult {
  year: number;
  predictedProduction: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface ModelEvaluation {
  mae?: number;  // Mean Absolute Error
  rmse?: number; // Root Mean Squared Error
  r2?: number;   // R-squared
}

// New interface to return parsed data and unique items
export interface ParsedDataResult {
  data: RiceProductionData[];
  items: string[];
}
