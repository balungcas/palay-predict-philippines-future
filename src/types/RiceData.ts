
export interface RiceProductionData {
  year: number;
  areaHarvested: number; // in hectares
  yield: number; // in kg per hectare
  production: number; // in tonnes
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
