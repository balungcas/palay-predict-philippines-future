import * as tf from '@tensorflow/tfjs';
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
  
  // Normalize headers to handle case sensitivity and spaces
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Find relevant column indices - being more flexible with matching
  const yearIndex = normalizedHeaders.findIndex(h => 
    h === 'year' || h === 'year code');
  
  const elementCodeIndex = normalizedHeaders.findIndex(h => 
    h === 'element code');
  
  const elementIndex = normalizedHeaders.findIndex(h => 
    h === 'element');
  
  const valueIndex = normalizedHeaders.findIndex(h => 
    h === 'value');
  
  const itemIndex = normalizedHeaders.findIndex(h => 
    h === 'item');
    
  const itemCodeIndex = normalizedHeaders.findIndex(h => 
    h === 'item code (cpc)');
  
  // Check for required columns
  const missingColumns = [];
  if (yearIndex === -1) missingColumns.push("Year or Year Code");
  if (elementCodeIndex === -1 && elementIndex === -1) missingColumns.push("Element or Element Code");
  if (valueIndex === -1) missingColumns.push("Value");
  
  if (missingColumns.length > 0) {
    throw new Error(
      `CSV must contain columns for ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`
    );
  }
  
  // Output found column indices for debugging
  console.log(`Found columns - Year: ${yearIndex !== -1 ? yearIndex : 'not found'}, Element Code: ${elementCodeIndex}, Element: ${elementIndex}, Value: ${valueIndex}`);
  
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
    if (values.length <= Math.max(yearIndex, elementCodeIndex, elementIndex, valueIndex)) {
      continue;
    }
    
    // Get item type (to ensure we're only processing rice data if specified)
    let itemValue = '';
    if (itemIndex !== -1) {
      itemValue = values[itemIndex].toLowerCase();
    } else if (itemCodeIndex !== -1) {
      itemValue = values[itemCodeIndex].toLowerCase();
    }
    
    // Optional: Only process rice-related items
    // Uncomment if you want to filter by rice items only
    /*
    if (itemValue !== '' && !itemValue.includes('rice') && !itemValue.includes('0422')) {
      continue;
    }
    */
    
    // Get year
    const yearVal = values[yearIndex];
    const year = parseInt(yearVal);
    if (isNaN(year)) continue;
    
    // Get element (to identify if this is area, yield, or production)
    let elementVal = '';
    if (elementIndex !== -1) {
      elementVal = values[elementIndex].toLowerCase();
    } else if (elementCodeIndex !== -1) {
      elementVal = values[elementCodeIndex].toLowerCase();
    }
    
    // Get the value
    const value = parseFloat(values[valueIndex]);
    if (isNaN(value)) continue;
    
    // Initialize year data if not exists
    if (!yearData.has(year)) {
      yearData.set(year, {});
    }
    
    // Update the appropriate metric based on element type
    const currentData = yearData.get(year)!;
    
    // Match by more comprehensive element descriptions or codes
    if (elementVal.includes('area harvested') || 
        elementVal.includes('harvested area') || 
        elementVal === '5312' || 
        elementVal.includes('5312')) {
      currentData.area = value;
      validDataPoints++;
    } 
    else if (elementVal.includes('yield') || 
             elementVal === '5419' || 
             elementVal.includes('5419') || 
             elementVal.includes('hg/ha')) {
      currentData.yield = value;
      validDataPoints++;
    }
    else if (elementVal.includes('production') || 
             elementVal === '5510' || 
             elementVal.includes('5510')) {
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
      "Could not extract complete rice production data. Please ensure your CSV contains area harvested, yield, and production values for each year. For FAO format, look for Element codes 5312 (Area Harvested), 5419 (Yield), and 5510 (Production)."
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

export const neuralNetworkForecast = async (
  data: RiceProductionData[],
  yearsToPredict: number
): Promise<{ predictions: PredictionResult[], evaluation: ModelEvaluation }> => {
  if (data.length < 4) {
    throw new Error("Neural network forecasting requires at least 4 data points");
  }

  // Prepare data for neural network
  const windowSize = 3; // Use 3 years to predict the next year
  const X = [];
  const y = [];

  // Create sequences for training
  for (let i = 0; i < data.length - windowSize; i++) {
    const window = data.slice(i, i + windowSize).map(d => [
      d.production / 1e7, // Scale down production
      d.areaHarvested / 1e6, // Scale down area
      d.yield / 1e4 // Scale down yield
    ]);
    X.push(window);
    y.push(data[i + windowSize].production / 1e7); // Scale down target production
  }

  // Convert to tensors
  const xTensor = tf.tensor3d(X);
  const yTensor = tf.tensor2d(y, [y.length, 1]);

  // Create and compile the model
  const model = tf.sequential();
  model.add(tf.layers.lstm({
    units: 32,
    inputShape: [windowSize, 3],
    returnSequences: false
  }));
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  model.add(tf.layers.dense({
    units: 1,
    activation: 'linear'
  }));

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['meanAbsoluteError']
  });

  // Train the model
  await model.fit(xTensor, yTensor, {
    epochs: 100,
    batchSize: 8,
    shuffle: true,
    validationSplit: 0.2
  });

  // Generate predictions
  const predictions: PredictionResult[] = [];
  let lastWindow = data.slice(-windowSize).map(d => [
    d.production / 1e7,
    d.areaHarvested / 1e6,
    d.yield / 1e4
  ]);

  // Calculate evaluation metrics on training data
  const trainPreds = model.predict(xTensor) as tf.Tensor;
  const trainPredsArray = await trainPreds.mul(1e7).array() as number[];
  const actualValues = y.map(val => val * 1e7);

  const errors = trainPredsArray.map((pred, i) => pred - actualValues[i]);
  const absErrors = errors.map(err => Math.abs(err));
  const squaredErrors = errors.map(err => err * err);

  const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / squaredErrors.length);

  // Calculate R-squared
  const meanY = actualValues.reduce((a, b) => a + b, 0) / actualValues.length;
  const totalSumSquares = actualValues.map(y => Math.pow(y - meanY, 2)).reduce((a, b) => a + b, 0);
  const residualSumSquares = squaredErrors.reduce((a, b) => a + b, 0);
  const r2 = 1 - (residualSumSquares / totalSumSquares);

  // Generate future predictions
  const lastYear = data[data.length - 1].year;
  for (let i = 1; i <= yearsToPredict; i++) {
    const input = tf.tensor3d([lastWindow]);
    const prediction = await model.predict(input) as tf.Tensor;
    const predValue = (await prediction.data())[0] * 1e7;

    // Calculate confidence intervals (using RMSE-based approach)
    const stdError = rmse * Math.sqrt(i);
    const confidenceInterval = 1.96 * stdError;

    predictions.push({
      year: lastYear + i,
      predictedProduction: predValue,
      lowerBound: Math.max(0, predValue - confidenceInterval),
      upperBound: predValue + confidenceInterval
    });

    // Update window for next prediction
    lastWindow.shift();
    lastWindow.push([
      predValue / 1e7,
      data[data.length - 1].areaHarvested / 1e6, // Use last known area
      data[data.length - 1].yield / 1e4 // Use last known yield
    ]);
  }

  // Cleanup tensors
  tf.dispose([xTensor, yTensor, model]);

  return {
    predictions,
    evaluation: {
      mae,
      rmse,
      r2
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