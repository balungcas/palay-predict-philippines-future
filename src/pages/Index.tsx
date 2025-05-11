import { useState, useEffect } from 'react'; // Import useEffect
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CSVUploader from '@/components/CSVUploader';
import DataTable from '@/components/DataTable';
import DataVisualizer from '@/components/DataVisualizer';
import ForecastSettings from '@/components/ForecastSettings';
import ForecastResults from '@/components/ForecastResults';
import Methodology from '@/components/Methodology';
// Import ParsedDataResult
import { RiceProductionData, PredictionResult, ModelEvaluation, ParsedDataResult } from '@/types/RiceData';
import { getSampleData, linearForecast, exponentialSmoothingForecast } from '@/utils/dataUtils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  // State to hold data for the selected item (used by DataTable, Visualizer, Forecast)
  const [data, setData] = useState<RiceProductionData[]>([]);
  // State to hold all parsed data
  const [allItems, setAllItems] = useState<RiceProductionData[]>([]);
  // State to hold the list of unique items
  const [items, setItems] = useState<string[]>([]);
  // State to hold the currently selected item
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [forecastMethod, setForecastMethod] = useState<'linear' | 'exponential'>('linear');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [evaluation, setEvaluation] = useState<ModelEvaluation>({});
  const { toast } = useToast();

  // Effect to filter data whenever allItems or selectedItem changes
  useEffect(() => {
    if (selectedItem && allItems.length > 0) {
      const filteredData = allItems.filter(itemData => itemData.item === selectedItem);
      setData(filteredData);
       // Reset predictions and evaluation when item changes
      setPredictions([]);
      setEvaluation({});
    } else if (allItems.length === 0) {
        // If allItems becomes empty, clear the filtered data
        setData([]);
        setPredictions([]);
        setEvaluation({});
    }
     // If selectedItem is null but allItems has data (e.g., initial load before item is selected)
     // or if there's only one item, this will be handled when selectedItem is set.
  }, [allItems, selectedItem]);


  // Update handleDataLoad to accept ParsedDataResult
  const handleDataLoad = (parsedResult: ParsedDataResult) => {
    setAllItems(parsedResult.data);
    setItems(parsedResult.items);
    // Set the first item as selected by default
    if (parsedResult.items.length > 0) {
      setSelectedItem(parsedResult.items[0]);
    } else {
      setSelectedItem(null); // No items found
       setData([]); // Clear data if no items
    }

    setPredictions([]);
    setEvaluation({});

    toast({
      title: "Data loaded successfully",
      description: `Loaded ${parsedResult.data.length} records for ${parsedResult.items.length} items.`,
      duration: 3000,
    });
  };

  const handleUseDefaultData = () => {
    // Assume getSampleData now returns ParsedDataResult
    const sampleResult: ParsedDataResult = getSampleData() as ParsedDataResult; // Cast to ParsedDataResult
    setAllItems(sampleResult.data);
    setItems(sampleResult.items);
     if (sampleResult.items.length > 0) {
      setSelectedItem(sampleResult.items[0]);
    } else {
       setSelectedItem(null);
       setData([]);
    }

    setPredictions([]);
    setEvaluation({});

    toast({
      title: "Sample data loaded",
      description: `Using sample data with ${sampleResult.data.length} records for ${sampleResult.items.length} items.`,
      duration: 3000,
    });
  };

   // New function to handle item selection change
   const handleItemChange = (item: string) => {
       setSelectedItem(item);
       // Filtering will be handled by the useEffect hook
   }


  const handleGenerateForecast = async (years: number, method: 'linear' | 'exponential') => {
    // Check data.length, which now represents the data for the selected item
    if (data.length < 2) {
      toast({
        title: "Not enough data",
        description: "Need at least 2 years of data for the selected item to generate forecast.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsGenerating(true);
    setForecastMethod(method);

    try {
      let result;

      if (method === 'linear') {
        result = linearForecast(data, years);
      } else if (method === 'exponential') {
        result = exponentialSmoothingForecast(data, years);
      } else {
        throw new Error(`Unknown forecast method: ${method}`);
      }

      setPredictions(result.predictions);
      setEvaluation(result.evaluation);

      toast({
        title: "Forecast generated",
        description: `${years}-year forecast for "${selectedItem}" using ${
          method === 'linear' ? 'linear regression' : 'exponential smoothing'
        }.`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Forecast error",
        description: error instanceof Error ? error.message : "An error occurred during forecasting",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-rice-800 mb-2">Agricultural Production Forecasting Tool</h1> {/* Updated title */}
          <p className="text-rice-600 max-w-3xl">
            Upload historical agricultural production data to visualize trends and generate
            forecasts using machine learning techniques. Select an item from the dropdown to view its data and forecast.
          </p>
        </div>

        <Alert className="mb-6 bg-rice-50 border-rice-300">
          <AlertDescription>
          To begin, upload a CSV file containing agricultural production data or use our sample data. Your CSV should include columns for Year, Gross Production, and optionally Item.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {/* CSVUploader needs to be updated to return ParsedDataResult */}
            <CSVUploader onDataLoad={handleDataLoad} onUseDefaultData={handleUseDefaultData} />
          </div>

          <div>
            {/* Pass items, selectedItem, and handleItemChange to ForecastSettings */}
            {allItems.length > 0 && ( // Use allItems to check if any data is loaded
              <ForecastSettings
                onGenerateForecast={handleGenerateForecast}
                isGenerating={isGenerating}
                items={items}
                selectedItem={selectedItem}
                onItemChange={handleItemChange}
              />
            )}
          </div>
        </div>

        {/* Use data.length > 0 to check if there is data for the selected item */}
        {data.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {/* DataTable receives data for the selected item */}
                <DataTable data={data} selectedItem={selectedItem} />
              </div>

              <div className="md:col-span-2">
                 {/* DataVisualizer receives data for the selected item */}
                <DataVisualizer data={data} selectedItem={selectedItem} />
              </div>
            </div>

            {predictions.length > 0 && (
              <ForecastResults
                predictions={predictions}
                evaluation={evaluation}
                method={forecastMethod}
                latestProduction={data[data.length - 1].grossProduction}
                selectedItem={selectedItem}
              />
            )}

            <Methodology />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;