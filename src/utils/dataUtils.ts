
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
    
    console.log("Analyzing CSV headers:", headers);
    
    // Check if this is FAO format (has specific columns like domain, element, etc.)
    const isFAOFormat = headers.includes('domain code') || 
                        headers.includes('element code') || 
                        headers.includes('item code (cpc)');
    
    if (isFAOFormat) {
      return parseFAOFormat(lines, headers);
    }
    
    // Standard format parsing continues below
    
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

// Function to handle FAO data format specifically
const parseFAOFormat = (lines: string[], headers: string[]): RiceProductionData[] => {
  console.log("Processing FAO format CSV");
  
  // Find relevant column indices
  const yearIndex = headers.indexOf('year');
  const yearCodeIndex = headers.indexOf('year code');
  const elementCodeIndex = headers.indexOf('element code');
  const elementIndex = headers.indexOf('element');
  const valueIndex = headers.indexOf('value');
  const itemIndex = headers.indexOf('item');
  const itemCodeIndex = headers.indexOf('item code (cpc)');
  
  if (yearIndex === -1 && yearCodeIndex === -1) {
    throw new Error("Cannot find year information in the CSV. Expected 'Year' or 'Year Code' column.");
  }
  
  if (elementCodeIndex === -1 && elementIndex === -1) {
    throw new Error("Cannot find element information in the CSV. Expected 'Element' or 'Element Code' column.");
  }
  
  if (valueIndex === -1) {
    throw new Error("Cannot find 'Value' column in the CSV.");
  }
  
  // Output found column indices for debugging
  console.log(`Found columns - Year: ${yearIndex !== -1 ? yearIndex : yearCodeIndex}, Element: ${elementIndex !== -1 ? elementIndex : elementCodeIndex}, Value: ${valueIndex}`);
  
  // We'll use these to store data by year
  const yearData: Map<number, {
    area?: number,
    yield?: number,
    production?: number
  }> = new Map();
  
  // Process each line
  let processedLines = 0;
  let validDataPoints = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    processedLines++;
    
    // Skip if we don't have enough values for all expected columns
    if (values.length < Math.max(yearIndex, yearCodeIndex, elementIndex, elementCodeIndex, valueIndex) + 1) {
      continue;
    }
    
    // Get item type (to ensure we're only processing rice data)
    let itemValue = '';
    if (itemIndex !== -1) {
      itemValue = values[itemIndex].toLowerCase();
    } else if (itemCodeIndex !== -1) {
      itemValue = values[itemCodeIndex].toLowerCase();
    }
    
    // Only process rice-related items (optional check)
    if (itemValue !== '' && !itemValue.includes('rice') && !itemValue.includes('0422') && !itemValue.includes('23')) {
      continue;
    }
    
    // Get year
    const yearVal = yearIndex !== -1 ? values[yearIndex] : values[yearCodeIndex];
    const year = parseInt(yearVal);
    if (isNaN(year)) continue;
    
    // Get element (to identify if this is area, yield, or production)
    const elementVal = (elementIndex !== -1) ? 
      values[elementIndex].toLowerCase() : 
      values[elementCodeIndex].toLowerCase();
    
    // Get the value
    const value = parseFloat(values[valueIndex]);
    if (isNaN(value)) continue;
    
    // Initialize year data if not exists
    if (!yearData.has(year)) {
      yearData.set(year, {});
    }
    
    // Update the appropriate metric based on element type
    const currentData = yearData.get(year)!;
    
    if (elementVal.includes('area harvested') || elementVal.includes('area') || elementVal.includes('5312') || elementVal === '5312') {
      currentData.area = value;
      validDataPoints++;
    } 
    else if (elementVal.includes('yield') || elementVal.includes('5419') || elementVal === '5419') {
      currentData.yield = value;
      validDataPoints++;
    }
    else if (elementVal.includes('production') || elementVal.includes('5510') || elementVal === '5510') {
      currentData.production = value;
      validDataPoints++;
    }
  }
  
  console.log(`Processed ${processedLines} lines, found ${validDataPoints} valid data points`);
  console.log(`Found data for ${yearData.size} different years`);
  
  // Convert map to array of RiceProductionData objects
  const result: RiceProductionData[] = [];
  
  for (const [year, data] of yearData.entries()) {
    // Log what we found for each year
    console.log(`Year ${year}: Area=${data.area}, Yield=${data.yield}, Production=${data.production}`);
    
    // Only add if we have all three metrics
    if (data.area !== undefined && data.yield !== undefined && data.production !== undefined) {
      result.push({
        year,
        areaHarvested: data.area,
        yield: data.yield,
        production: data.production
      });
    } else {
      console.log(`Incomplete data for year ${year}`);
    }
  }
  
  if (result.length === 0) {
    throw new Error(
      "Could not extract complete rice production data. Please ensure your CSV contains area harvested, yield, and production values for each year."
    );
  }
  
  return result.sort((a, b) => a.year - b.year);
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
