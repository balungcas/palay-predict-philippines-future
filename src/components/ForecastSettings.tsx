
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart } from 'lucide-react';

interface ForecastSettingsProps {
  onGenerateForecast: (years: number, method: 'linear' | 'exponential') => void;
  isGenerating: boolean;
}

const ForecastSettings = ({ onGenerateForecast, isGenerating }: ForecastSettingsProps) => {
  const [years, setYears] = useState('3');
  const [method, setMethod] = useState<'linear' | 'exponential'>('linear');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yearsNum = parseInt(years);
    if (yearsNum >= 1 && yearsNum <= 10) {
      onGenerateForecast(yearsNum, method);
    }
  };

  return (
    <Card className="border-rice-200">
      <CardHeader className="bg-rice-50">
        <CardTitle className="text-rice-800 flex items-center">
          <LineChart className="mr-2 h-5 w-5" />
          Forecast Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="years" className="text-rice-700">Years to Forecast</Label>
            <Input
              id="years"
              type="number"
              min="1"
              max="10"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="border-rice-300 focus:border-rice-500 focus:ring-rice-500"
            />
            <p className="text-xs text-rice-600">Enter a value between 1 and 10 years</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="method" className="text-rice-700">Forecasting Method</Label>
            <Select value={method} onValueChange={(value: 'linear' | 'exponential') => setMethod(value)}>
              <SelectTrigger className="border-rice-300 focus:border-rice-500 focus:ring-rice-500">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear Regression</SelectItem>
                <SelectItem value="exponential">Exponential Smoothing</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-rice-600">
              {method === 'linear' 
                ? 'Linear regression works best for stable growth patterns.'
                : 'Exponential smoothing works better for recent trend changes.'}
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-rice-600 hover:bg-rice-700"
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating Forecast...' : 'Generate Forecast'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ForecastSettings;
