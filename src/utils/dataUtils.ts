// The following is the planned content for src/utils/dataUtils.ts

import * as tf from '@tensorflow/tfjs'; // Keep if other functions still use it, otherwise remove
import { RiceProductionData, PredictionResult, ModelEvaluation, ParsedDataResult } from "../types/RiceData"; // Import ParsedDataResult

export const parseCSV = (csvContent: string): ParsedDataResult => { // Updated return type
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
                        headers.includes('item code (cpc)') ||
                        headers.includes('item'); // Added 'item' to FAO check

    if (isFAOFormat) {
      return parseFAOFormat(lines, headers);
    }

    // If not FAO format, we'll assume a simple format with Year, Gross Production, and potentially Item
    const yearIndex = headers.findIndex(h =>
      h === 'year' || h.includes('year') || h === 'date' || h === 'time');

    // Find column index for 'Value' or 'Gross Production'
    const valueIndex = headers.findIndex(h =>
      h === 'value' || h.includes('gross production'));

    // Find optional item column
    const itemIndex = headers.findIndex(h =>
      h === 'item' || h === 'product' || h.includes('item name') || h.includes('product name'));


    // Check if required columns exist
    const missingColumns = [];
    if (yearIndex === -1) missingColumns.push("Year");
    if (valueIndex === -1) missingColumns.push("Value or Gross Production");

    if (missingColumns.length > 0) {
      console.log("Available columns:", headers);
      throw new Error(
        `CSV must contain columns for ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`
      );
    }

    // Parse data rows
    const data: RiceProductionData[] = [];
    const itemsSet = new Set<string>();
    const defaultItemName = "Gross Production Data";

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());

      // Ensure we have enough values for required columns
      if (values.length <= Math.max(yearIndex, valueIndex)) {
          continue; // Skip incomplete rows for required fields
      }

      const year = parseInt(values[yearIndex]);
      const grossProduction = parseFloat(values[valueIndex]);

      // Get item value if item column exists
      const item = itemIndex !== -1 && values.length > itemIndex ? values[itemIndex].trim() : defaultItemName;


      // Only add if we have valid numbers for required fields
      if (!isNaN(year) && !isNaN(grossProduction)) {
        data.push({
          year: year,
          grossProduction: grossProduction, // Mapping 'Value' to 'grossProduction'
          item: item // Include item
        });
         itemsSet.add(item); // Add item to the set of unique items
      }
    }

    if (data.length === 0) {
      throw new Error("No valid data rows found. Please check your CSV format and ensure Year and Gross Production columns are present.");
    }

    const uniqueItems = Array.from(itemsSet);
    console.log("Identified unique items:", uniqueItems);


    return { // Return ParsedDataResult object
        data: data.sort((a, b) => a.year - b.year),
        items: uniqueItems
    };
  } catch (error) {
    console.error("Error parsing CSV:", error);
    throw error; // Pass the original error up for better debugging
  }
};

// Function to handle FAO data format specifically
const parseFAOFormat = (lines: string[], headers: string[]): ParsedDataResult => {
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
    h === 'item' || h === 'item name'); // Added 'item name'

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
  console.log(`Found columns - Year: ${yearIndex !== -1 ? yearIndex : 'not found'}, Element Code: ${elementCodeIndex}, Element: ${elementIndex}, Value: ${valueIndex}, Item: ${itemIndex}, Item Code: ${itemCodeIndex}`);


  // We'll use these to store data by year and item
  const yearItemData: Map<string, Map<number, { // Key is "item_year"
    grossProduction?: number
  }>> = new Map();

  const itemsSet = new Set<string>(); // To collect unique items


  // Process each line
  let processedLines = 0;
  let validDataPoints = 0;

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    processedLines++;

    // Skip if we don't have enough values for the columns we intend to use
    const requiredIndices = [yearIndex, valueIndex];
    if (itemIndex !== -1) { // Add itemIndex only if it was found
        requiredIndices.push(itemIndex);
    }
    // Ensure requiredIndices is not empty before using Math.max
    const maxRequiredIndex = requiredIndices.length > 0 ? Math.max(...requiredIndices) : -1;


    if (maxRequiredIndex !== -1 && values.length <= maxRequiredIndex) {
        console.log(`Skipping row ${i + 1} due to insufficient columns. Expected at least ${maxRequiredIndex + 1}, found ${values.length}`); // Added logging
        continue;
    }


    // Get item type
    let itemValue = 'Unknown Item'; // Default item value
    if (itemIndex !== -1 && values.length > itemIndex && values[itemIndex].trim() !== '') {
        itemValue = values[itemIndex].trim();
    } else if (itemCodeIndex !== -1 && values.length > itemCodeIndex && values[itemCodeIndex].trim() !== '') {
        itemValue = values[itemCodeIndex].trim();
    }

    // Get year
    const yearVal = values[yearIndex];
    const year = parseInt(yearVal);
    if (isNaN(year)) {
        console.log(`Skipping row ${i + 1}: Invalid year value "${yearVal}"`); // Log invalid year
        continue;
    }

    // Get element (to identify if this is area, yield, or production)
    let elementVal = '';
    if (elementIndex !== -1 && values.length > elementIndex) {
      elementVal = values[elementIndex].trim(); // Trim whitespace
    } else if (elementCodeIndex !== -1 && values.length > elementCodeIndex) {
      elementVal = values[elementCodeIndex].trim(); // Trim whitespace
    }

    console.log(`Processing row ${i + 1}, Element value: "${elementVal}", Item: "${itemValue}", Year: ${year}`); // Log Element value, Item, Year

    // Get the value
    const value = parseFloat(values[valueIndex]);
    if (isNaN(value)) {
        console.log(`Skipping row ${i + 1}: Invalid value "${values[valueIndex]}" in Value column.`); // Log invalid value
        continue;
    }

    // Use item and year as a combined key
    const itemYearKey = `${itemValue}_${year}`;

    // Initialize data for this item and year if not exists
    if (!yearItemData.has(itemYearKey)) {
      yearItemData.set(itemYearKey, new Map());
    }

    const currentYearData = yearItemData.get(itemYearKey)!;

    if (!currentYearData.has(year)) {
        currentYearData.set(year, {});
    }

    const currentData = currentYearData.get(year)!;


    // Match by element descriptions or codes for Gross Production (Assuming Element Code 152 for Gross Production)
    const grossProductionRegex = /gross\s*production/i; // Case-insensitive match with optional space

    // Explicitly check for "Gross Production Value" or use regex/code
    if (elementVal === 'Gross Production Value' || grossProductionRegex.test(elementVal) || elementVal === '152' || elementVal.includes('production')) {
      console.log(`Row ${i + 1}: Element "${elementVal}" matched Gross Production criteria.`); // Log successful match
      currentData.grossProduction = value;
      validDataPoints++;
       itemsSet.add(itemValue); // Add item to the set of unique items
       console.log(`Found Gross Production data for Item: ${itemValue}, Year: ${year}, Value: ${value}`); // Added logging
    } else {
        console.log(`Row ${i + 1}: Element "${elementVal}" did not match Gross Production criteria.`); // Added logging for non-matching element
    }
  }

  console.log(`Processed ${processedLines} lines, found ${validDataPoints} valid data points`);
  console.log(`Found data for ${yearItemData.size} different item-year combinations`);
  console.log("Collected unique items:", Array.from(itemsSet)); // Added logging for unique items


  // Convert map to array of RiceProductionData objects
  const data: RiceProductionData[] = [];

  for (const [itemYearKey, yearMap] of yearItemData.entries()) {
      const [item, yearStr] = itemYearKey.split('_');
      const year = parseInt(yearStr);
      const yearData = yearMap.get(year)!;

    // Only add if we have Gross Production data for the year and item
    if (yearData.grossProduction !== undefined) {
      data.push({
        year: year,
        grossProduction: yearData.grossProduction,
        item: item // Include item
      });
    } else {
      console.log(`Incomplete data for item ${item} year ${year}`);
    }
  }


  if (data.length === 0) {
    throw new Error(
      "Could not extract complete agricultural production data. Please ensure your CSV contains Year, Item, and Gross Production values for each entry."
    );
  }

   const uniqueItems = Array.from(itemsSet);
   console.log("Identified unique items:", uniqueItems);

  return { // Return ParsedDataResult object
    data: data.sort((a, b) => a.year - b.year),
    items: uniqueItems
  };
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

  // Extract years and gross production values
  const years = data.map(d => d.year);
  const grossProductions = data.map(d => d.grossProduction); // Using grossProduction

  // Calculate linear regression parameters
  const n = years.length;
  const sumX = years.reduce((a, b) => a + b, 0);
  const sumY = grossProductions.reduce((a, b) => a + b, 0); // Using grossProductions
  const sumXY = years.map((x, i) => x * grossProductions[i]).reduce((a, b) => a + b, 0); // Using grossProductions
  const sumXX = years.map(x => x * x).reduce((a, b) => a + b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Evaluate the model
  const predictions = years.map(year => {
    return intercept + slope * year;
  });

  const errors = predictions.map((pred, i) => grossProductions[i] - pred); // Using grossProductions
  const squaredErrors = errors.map(err => err * err);
  const absErrors = errors.map(err => Math.abs(err));

  const mae = absErrors.reduce((a, b) => a + b, 0) / n;
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / n);

  // Calculate R-squared
  const meanY = sumY / n;
  const totalSumOfSquares = grossProductions.map(y => Math.pow(y - meanY, 2)).reduce((a, b) => a + b, 0); // Using grossProductions
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

// Function to format a number to a fixed number of decimals, removing trailing zeros
export const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) {
    return '-';
  }
  // Convert to fixed number of decimal places
  let formatted = value.toFixed(decimals);

  // Remove trailing zeros after the decimal point
  // Use regex to find the decimal point and any trailing zeros
  formatted = formatted.replace(/\.?0+$/, '');

   // If the number ended up as just a decimal point (e.g., 123.), remove it
   if (formatted.endsWith('.')) {
    formatted = formatted.slice(0, -1);
   }

   // Add comma separators for thousands
   const parts = formatted.split('.');
   parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

   return parts.join('.');
};

export const getSampleData = (): ParsedDataResult => {
  const sampleData: RiceProductionData[] = [
    { year: 2010, grossProduction: 10000, item: 'Rice (paddy)' },
    { year: 2011, grossProduction: 10500, item: 'Rice (paddy)' },
    { year: 2012, grossProduction: 11000, item: 'Rice (paddy)' },
    { year: 2013, grossProduction: 11200, item: 'Rice (paddy)' },
    { year: 2014, grossProduction: 11500, item: 'Rice (paddy)' },
    { year: 2015, grossProduction: 12000, item: 'Rice (paddy)' },
    { year: 2016, grossProduction: 12300, item: 'Rice (paddy)' },
    { year: 2017, grossProduction: 12500, item: 'Rice (paddy)' },
    { year: 2018, grossProduction: 12800, item: 'Rice (paddy)' },
    { year: 2019, grossProduction: 13000, item: 'Rice (paddy)' },
    { year: 2020, grossProduction: 13500, item: 'Rice (paddy)' },
    { year: 2021, grossProduction: 13800, item: 'Rice (paddy)' },
    { year: 2022, grossProduction: 14000, item: 'Rice (paddy)' },

    { year: 2010, grossProduction: 5000, item: 'Maize' },
    { year: 2011, grossProduction: 5200, item: 'Maize' },
    { year: 2012, grossProduction: 5500, item: 'Maize' },
    { year: 2013, grossProduction: 5600, item: 'Maize' },
    { year: 2014, grossProduction: 5800, item: 'Maize' },
    { year: 2015, grossProduction: 6000, item: 'Maize' },
    { year: 2016, grossProduction: 6100, item: 'Maize' },
    { year: 2017, grossProduction: 6200, item: 'Maize' },
    { year: 2018, grossProduction: 6300, item: 'Maize' },
    { year: 2019, grossProduction: 6400, item: 'Maize' },
    { year: 2020, grossProduction: 6500, item: 'Maize' },
    { year: 2021, grossProduction: 6600, item: 'Maize' },
    { year: 2022, grossProduction: 6700, item: 'Maize' },

    { year: 2015, grossProduction: 1000, item: 'Wheat' },
    { year: 2016, grossProduction: 1100, item: 'Wheat' },
    { year: 2017, grossProduction: 1200, item: 'Wheat' },
    { year: 2018, grossProduction: 1300, item: 'Wheat' },
    { year: 2019, grossProduction: 1400, item: 'Wheat' },
    { year: 2020, grossProduction: 1500, item: 'Wheat' },
    { year: 2021, grossProduction: 1600, item: 'Wheat' },
    { year: 2022, grossProduction: 1700, item: 'Wheat' },
  ];

  const uniqueItems = Array.from(new Set(sampleData.map(item => item.item)));

  return {
    data: sampleData.sort((a, b) => a.year - b.year),
    items: uniqueItems,
  };
};

export const exponentialSmoothingForecast = (
  data: RiceProductionData[],
  yearsToPredict: number,
  alpha: number = 0.3 // Smoothing factor\
): { predictions: PredictionResult[], evaluation: ModelEvaluation } => {
  if (data.length < 2) {
    throw new Error("Not enough data points for exponential smoothing forecasting");
  }

  const grossProductions = data.map(d => d.grossProduction);
  const years = data.map(d => d.year);
  const n = data.length;

  // Initialize smoothed value
  let smoothed: number[] = [grossProductions[0]];

  // Perform exponential smoothing
  for (let i = 1; i < n; i++) {
    smoothed.push(alpha * grossProductions[i] + (1 - alpha) * smoothed[i - 1]);
  }

  // Forecast future values
  const lastYear = years[n - 1];
  const forecast: PredictionResult[] = [];

  for (let i = 1; i <= yearsToPredict; i++) {
    const futureYear = lastYear + i;
    // For simple exponential smoothing, the forecast for all future periods is the last smoothed value
    const predictedValue = smoothed[n - 1];

    // Simplified confidence interval (can be improved with more complex calculations)
    // For simplicity, using a fixed percentage of the last smoothed value as a margin
    const confidenceMargin = predictedValue * 0.1; // 10% margin

    forecast.push({
      year: futureYear,
      predictedProduction: predictedValue,
      lowerBound: Math.max(0, predictedValue - confidenceMargin),
      upperBound: predictedValue + confidenceMargin,
    });
  }

   // Evaluate the model on the historical data
   // For simple ES, MAE and RMSE are calculated based on one-step-ahead forecast errors
  const errors = data.slice(1).map((d, i) => d.grossProduction - smoothed[i]); // Using smoothed[i] as forecast for d.grossProduction
  const squaredErrors = errors.map(err => err * err);

  const mae = errors.reduce((a, b) => a + Math.abs(b), 0) / errors.length;
  const rmse = Math.sqrt(squaredErrors.reduce((a, b) => a + b, 0) / errors.length);

  return { predictions: forecast, evaluation: { mae, rmse, r2: NaN } }; // R2 is not standard for simple ES
};
