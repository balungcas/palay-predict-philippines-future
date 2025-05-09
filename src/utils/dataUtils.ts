
import { RiceProductionData, PredictionResult, ModelEvaluation } from "../types/RiceData";

export const parseCSV = (csvContent: string): RiceProductionData[] => {
  try {
    // Split by lines and remove any empty lines
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error("CSV file appears to be empty");
    }
    
    // Get headers to identify columns
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Find column indices with more flexible matching
    const yearIndex = headers.findIndex(h => 
      h === 'year' || h.includes('year') || h === 'date' || h === 'time');
    
    const areaIndex = headers.findIndex(h => 
      h.includes('area') || h.includes('hectare') || h === 'area harvested' || 
      h.includes('harvested') || h.includes('harvest'));
    
    const yieldIndex = headers.findIndex(h => 
      h === 'yield' || h.includes('yield') || h.includes('kg/ha') || h.includes('kg/hectare'));
    
    const productionIndex = headers.findIndex(h => 
      h === 'production' || h.includes('production') || h.includes('tonnes') || h.includes('tons'));
    
    // Check if required columns exist
    const missingColumns = [];
    if (yearIndex === -1) missingColumns.push("Year");
    if (areaIndex === -1) missingColumns.push("Area harvested");
    if (yieldIndex === -1) missingColumns.push("Yield");
    if (productionIndex === -1) missingColumns.push("Production");
    
    if (missingColumns.length > 0) {
      console.log("Available columns:", headers);
      throw new Error(
        `CSV must contain columns for ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`
      );
    }
    
    // Parse data rows
    const data: RiceProductionData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      // Ensure we have enough values
      if (values.length >= Math.max(yearIndex, areaIndex, yieldIndex, productionIndex) + 1) {
        const year = parseInt(values[yearIndex]);
        const area = parseFloat(values[areaIndex]);
        const yield_value = parseFloat(values[yieldIndex]);
        const production = parseFloat(values[productionIndex]);
        
        // Only add if we have valid numbers
        if (!isNaN(year) && !isNaN(area) && !isNaN(yield_value) && !isNaN(production)) {
          data.push({
            year: year,
            areaHarvested: area,
            yield: yield_value,
            production: production
          });
        }
      }
    }

    if (data.length === 0) {
      throw new Error("No valid data rows found. Please check your CSV format.");
    }
    
    return data.sort((a, b) => a.year - b.year);
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw error; // Pass the original error up for better debugging
  }
};

// Simple linear regression for time series forecasting
export const linearForecast = (
  data: RiceProductionData[], 
  yearsToPredict: number
): { predictions: PredictionResult[], evaluation: ModelEvaluation } => {
  // Need at least 2 data points for regression
  if (data.length < 2) {
    throw new Error("Not enough data points for forecasting");
  }

  // Extract years and production values
  const years = data.map(d => d.year);
  const productions = data.map(d => d.production);
  
  // Calculate linear regression parameters
  const n = years.length;
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = productions.reduce((a, b) => a + b, 0);
  const sumXY = years.map((x, i) => x * productions[i]).reduce((a, b) => a + b, 0);
  const sumXX = years.map(x => x * x).reduce((a, b) => a + b, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Evaluate the model
  const predictions = years.map(year => {
    return intercept + slope * year;
  });
  
  const errors = predictions.map((pred, i) => productions[i] - pred);
  const squaredErrors = errors.map(err => err * err);
  const absErrors = errors.map(err => Math.abs(err));
  
  const mae = absErrors.reduce((a, b) => a + b, 0) / n;
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / n);
  
  // Calculate R-squared
  const meanY = sumY / n;
  const totalSumOfSquares = productions.map(y => Math.pow(y - meanY, 2)).reduce((a, b) => a + b, 0);
  const residualSumOfSquares = squaredErrors.reduce((a, b) => a + b, 0);
  const r2 = 1 - (residualSumOfSquares / totalSumOfSquares);
  
  // Generate future predictions
  const lastYear = years[years.length - 1];
  const forecast: PredictionResult[] = [];
  
  // Calculate standard error for confidence intervals
  const stdErrorEstimate = Math.sqrt(residualSumOfSquares / (n - 2));
  
  // Generate future predictions with confidence intervals
  for (let i = 1; i <= yearsToPredict; i++) {
    const futureYear = lastYear + i;
    const predictedValue = intercept + slope * futureYear;
    
    // Simplified confidence interval calculation (approx. 95% confidence)
    const confidenceMargin = 1.96 * stdErrorEstimate * Math.sqrt(1 + 1/n + 
      Math.pow(futureYear - meanY, 2) / (sumXX - Math.pow(sumX, 2) / n));
    
    forecast.push({
      year: futureYear,
      predictedProduction: predictedValue,
      lowerBound: Math.max(0, predictedValue - confidenceMargin),
      upperBound: predictedValue + confidenceMargin
    });
  }
  
  return {
    predictions: forecast,
    evaluation: {
      mae,
      rmse,
      r2
    }
  };
};

// Alternative forecasting method using exponential smoothing
export const exponentialSmoothingForecast = (
  data: RiceProductionData[],
  yearsToPredict: number,
  alpha: number = 0.3
): { predictions: PredictionResult[], evaluation: ModelEvaluation } => {
  if (data.length < 2) {
    throw new Error("Not enough data points for forecasting");
  }
  
  const productions = data.map(d => d.production);
  const years = data.map(d => d.year);
  const lastYear = years[years.length - 1];
  
  // Apply simple exponential smoothing
  let smoothedValues = [productions[0]];
  for (let i = 1; i < productions.length; i++) {
    const newSmoothed = alpha * productions[i] + (1 - alpha) * smoothedValues[i-1];
    smoothedValues.push(newSmoothed);
  }
  
  // Calculate errors
  const errors = productions.map((actual, i) => actual - smoothedValues[i]);
  const squaredErrors = errors.map(err => Math.pow(err, 2));
  const absErrors = errors.map(err => Math.abs(err));
  
  const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length);
  
  // Calculate a simple trend factor
  const lastSmoothedValue = smoothedValues[smoothedValues.length - 1];
  const secondLastSmoothedValue = smoothedValues[smoothedValues.length - 2];
  const trendFactor = (lastSmoothedValue - secondLastSmoothedValue);
  
  // Generate future predictions
  const forecast: PredictionResult[] = [];
  let currentPrediction = lastSmoothedValue;
  
  for (let i = 1; i <= yearsToPredict; i++) {
    // Apply trend for each future period
    currentPrediction += trendFactor;
    const stdError = rmse * Math.sqrt(i);
    
    forecast.push({
      year: lastYear + i,
      predictedProduction: currentPrediction,
      lowerBound: Math.max(0, currentPrediction - 1.96 * stdError),
      upperBound: currentPrediction + 1.96 * stdError
    });
  }
  
  return {
    predictions: forecast,
    evaluation: {
      mae,
      rmse
    }
  };
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
};

export const getSampleData = (): RiceProductionData[] => {
  return [
    { year: 2010, areaHarvested: 4528811, yield: 3621, production: 16389850 },
    { year: 2011, areaHarvested: 4536640, yield: 3681, production: 16684062 },
    { year: 2012, areaHarvested: 4690093, yield: 3837, production: 17989143 },
    { year: 2013, areaHarvested: 4746082, yield: 3885, production: 18439156 },
    { year: 2014, areaHarvested: 4739672, yield: 3969, production: 18805883 },
    { year: 2015, areaHarvested: 4656227, yield: 3903, production: 18149838 },
    { year: 2016, areaHarvested: 4556034, yield: 3966, production: 18063283 },
    { year: 2017, areaHarvested: 4811808, yield: 4001, production: 19276347 },
    { year: 2018, areaHarvested: 4800143, yield: 4035, production: 19066094 },
    { year: 2019, areaHarvested: 4652373, yield: 4029, production: 18815249 },
    { year: 2020, areaHarvested: 4718337, yield: 4084, production: 19294719 },
    { year: 2021, areaHarvested: 4802721, yield: 4134, production: 19962991 },
    { year: 2022, areaHarvested: 4827312, yield: 4198, production: 20265421 },
  ];
};
