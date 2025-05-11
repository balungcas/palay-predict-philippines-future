import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileUp, UploadCloud, AlertCircle, Check, FileQuestion, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { parseCSV } from '@/utils/dataUtils';
import { RiceProductionData, ParsedDataResult } from '@/types/RiceData'; // Import ParsedDataResult

interface CSVUploaderProps {
  // Update onDataLoad to accept ParsedDataResult
  onDataLoad: (data: ParsedDataResult) => void;
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
      // Call parseCSV and handle the ParsedDataResult
      const parsedResult: ParsedDataResult = parseCSV(text) as ParsedDataResult; // Cast to ParsedDataResult

      if (parsedResult.data.length === 0) {
        setError('No valid data found in the CSV file');
      } else {
        // Pass the entire parsedResult to onDataLoad
        onDataLoad(parsedResult);
        setSuccess(true);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      console.error("Error parsing CSV:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleCSV = () => {
    const headers = "Domain Code,Domain,Area Code (M49),Area,Element Code,Element,Item Code (CPC),Item,Year,Code,Year,Unit,Value,Flag,Flag Description";

    // Generate sample data rows for multiple items
    const rows = [
      // Rice (paddy) - Gross Production data (Element Code 152)
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0422,Rice (paddy),2020,2020,1000 Int$,19294719,E,Estimated value",
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0422,Rice (paddy),2021,2021,1000 Int$,19962991,E,Estimated value",
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0422,Rice (paddy),2022,2022,1000 Int$,20265421,E,Estimated value",
      // Maize - Gross Production data (Element Code 152)
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0137,Maize,2020,2020,1000 Int$,8154000,E,Estimated value",
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0137,Maize,2021,2021,1000 Int$,8300000,E,Estimated value",
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0137,Maize,2022,2022,1000 Int$,8450000,E,Estimated value",
      // Wheat - Gross Production data (Element Code 152)
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0111,Wheat,2020,2020,1000 Int$,500000,E,Estimated value",
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0111,Wheat,2021,2021,1000 Int$,520000,E,Estimated value",
      "QV,Value of Agricultural Production,608,Philippines,152,Gross Production,0111,Wheat,2022,2022,1000 Int$,540000,E,Estimated value"
    ];


    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fao_format_sample_multi_item.csv'); // Updated sample file name
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                  CSV file with agricultural production data (FAO STAT format supported) {/* Updated text */}
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
                <FileUp className="w-4 h-4" />
                <span>{fileName}</span>
                {success && <Check className="w-4 h-4 text-green-500" />}
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                  {error.includes('Could not extract complete rice production data') && (
  <div className="mt-2 text-sm">
    <p className="font-semibold mb-1">For FAO format, ensure your CSV has these columns for Gross Production data:</p>
    <ul className="list-disc list-inside ml-2 space-y-1">
    <li>Domain Code</li>
      <li>Domain</li>
      <li>Area Code (M49)</li>
      <li>Area</li>
      <li>Element Code</li>
      <li>Element</li>
      <li>Item Code (CPC)</li>
      <li>Item</li> {/* Highlight Item column */}
      <li>Year Code</li>
      <li>Year</li>
      <li>Unit</li>
      <li>Value</li>
      <li>Flag</li>
      <li>Flag Description</li>
    </ul>
    <p className="font-semibold mt-2">Ensure the 'Item' column is present to handle different products.</p> {/* Added extra hint */}
  </div>
)}

                </AlertDescription>
              </Alert>
            )}

            <div className="text-center mt-2">
              <div className="flex flex-col md:flex-row justify-center gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-rice-300 text-rice-700 hover:bg-rice-100"
                  onClick={() => window.open("https://github.com/user/repo/blob/main/sample.csv", "_blank")}
                >
                  <FileQuestion className="mr-1 h-3 w-3" />
                  View Sample CSV Format
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-rice-300 text-rice-700 hover:bg-rice-100"
                  onClick={generateSampleCSV}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Download Multi-Item FAO Sample CSV {/* Updated button text */}
                </Button>
              </div>
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
