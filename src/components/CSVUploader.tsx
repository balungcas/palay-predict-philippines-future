
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUpload, UploadCloud, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { parseCSV } from '@/utils/dataUtils';
import { RiceProductionData } from '@/types/RiceData';

interface CSVUploaderProps {
  onDataLoad: (data: RiceProductionData[]) => void;
  onUseDefaultData: () => void;
}

const CSVUploader = ({ onDataLoad, onUseDefaultData }: CSVUploaderProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(false);
    
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    setFileName(file.name);
    setIsLoading(true);
    
    try {
      const text = await file.text();
      const data = parseCSV(text);
      
      if (data.length === 0) {
        setError('No valid data found in the CSV file');
      } else {
        onDataLoad(data);
        setSuccess(true);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 text-rice-800">Upload Your Data</h2>
      
      <Card className="bg-white border-rice-200">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <label 
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-rice-300 border-dashed rounded-md cursor-pointer bg-rice-50 hover:bg-rice-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-8 h-8 mb-2 text-rice-500" />
                <p className="mb-2 text-sm text-rice-700">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-rice-500">
                  CSV file with Year, Area harvested, Yield, and Production columns
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".csv" 
                onChange={handleFileChange} 
                disabled={isLoading}
              />
            </label>

            {fileName && !error && (
              <div className="text-sm text-rice-600 flex items-center gap-2">
                <FileUpload className="w-4 h-4" />
                <span>{fileName}</span>
                {success && <Check className="w-4 h-4 text-green-500" />}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <p className="text-sm text-rice-600 mb-2">- or -</p>
              <Button 
                variant="outline" 
                onClick={onUseDefaultData}
                className="border-rice-300 text-rice-700 hover:bg-rice-100"
              >
                Use Sample Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVUploader;
