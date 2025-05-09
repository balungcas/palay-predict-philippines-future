
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CSVUploader from '@/components/CSVUploader';
import DataTable from '@/components/DataTable';
import DataVisualizer from '@/components/DataVisualizer';
import ForecastSettings from '@/components/ForecastSettings';
import ForecastResults from '@/components/ForecastResults';
import Methodology from '@/components/Methodology';
import { RiceProductionData, PredictionResult, ModelEvaluation } from '@/types/RiceData';
import { getSampleData, linearForecast, exponentialSmoothingForecast } from '@/utils/dataUtils';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [data, setData] = useState<RiceProductionData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [forecastMethod, setForecastMethod] = useState<'linear' | 'exponential'>('linear');
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [evaluation, setEvaluation] = useState<ModelEvaluation>({});
  const { toast } = useToast();

  const handleDataLoad = (uploadedData: RiceProductionData[]) => {
    setData(uploadedData);
    setPredictions([]);
    setEvaluation({});
    
    toast({
      title: "Data loaded successfully",
      description: `Loaded ${uploadedData.length} rice production records.`,
      duration: 3000,
    });
  };
  
  const handleUseDefaultData = () => {
    const sampleData = getSampleData();
    setData(sampleData);
    setPredictions([]);
    setEvaluation({});
    
    toast({
      title: "Sample data loaded",
      description: "Using Philippines rice production sample data (2010-2022).",
      duration: 3000,
    });
  };
  
  const handleGenerateForecast = (years: number, method: 'linear' | 'exponential') => {
    if (data.length < 2) {
      toast({
        title: "Not enough data",
        description: "Need at least 2 years of data to generate forecast.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    setIsGenerating(true);
    setForecastMethod(method);
    
    setTimeout(() => {
      try {
        const result = method === 'linear' 
          ? linearForecast(data, years)
          : exponentialSmoothingForecast(data, years);
        
        setPredictions(result.predictions);
        setEvaluation(result.evaluation);
        
        toast({
          title: "Forecast generated",
          description: `${years}-year forecast using ${method === 'linear' ? 'linear regression' : 'exponential smoothing'}.`,
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
    }, 500);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-rice-800 mb-2">Rice Production Forecasting Tool</h1>
          <p className="text-rice-600 max-w-3xl">
            Upload historical rice production data for the Philippines to visualize trends and generate 
            forecasts for future production levels. Use this tool for agricultural planning and food security analysis.
          </p>
        </div>
        
        <Alert className="mb-6 bg-rice-50 border-rice-300">
          <AlertDescription>
            To begin, upload a CSV file containing rice production data or use our sample Philippine rice data.
            Your CSV should include columns for Year, Area harvested (ha), Yield (kg/ha), and Production (tonnes).
          </AlertDescription>
        </Alert>
      
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <CSVUploader onDataLoad={handleDataLoad} onUseDefaultData={handleUseDefaultData} />
          </div>
          
          <div>
            {data.length > 0 && (
              <ForecastSettings 
                onGenerateForecast={handleGenerateForecast} 
                isGenerating={isGenerating} 
              />
            )}
          </div>
        </div>
        
        {data.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <DataTable data={data} />
              </div>
              
              <div className="md:col-span-2">
                <DataVisualizer data={data} />
              </div>
            </div>
            
            {predictions.length > 0 && (
              <ForecastResults 
                predictions={predictions} 
                evaluation={evaluation}
                method={forecastMethod}
                latestProduction={data[data.length - 1].production}
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
