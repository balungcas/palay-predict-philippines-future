
import { PredictionResult, ModelEvaluation } from '@/types/RiceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps, ReferenceLine, Area, ComposedChart } from 'recharts';
import { formatNumber } from '@/utils/dataUtils';
// ... (existing imports)
import { PieChart, Calculator, ArrowUp, ArrowDown } from 'lucide-react';

interface ForecastResultsProps {
  predictions: PredictionResult[];
  evaluation: ModelEvaluation;
  method: 'linear' | 'exponential';
  latestProduction: number;
  selectedItem: string | null; // Added selectedItem prop
}

const ForecastResults = ({ predictions, evaluation, method, latestProduction, selectedItem }: ForecastResultsProps) => { // Destructure selectedItem
  if (!predictions || predictions.length === 0) {
    return null;
  }

  const chartData = predictions.map(pred => ({
    year: pred.year,
    production: pred.predictedProduction,
    lowerBound: pred.lowerBound,
    upperBound: pred.upperBound
  }));

  // Calculate growth from current to final year
  const finalYearProduction = predictions[predictions.length - 1].predictedProduction;
  const growthPercent = ((finalYearProduction - latestProduction) / latestProduction) * 100;
  const isGrowth = growthPercent >= 0;

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-rice-200 shadow-md rounded-md">
          <p className="font-semibold text-rice-800">{`Year: ${label}`}</p>
          {payload.map((entry, index) => {
            if (entry.dataKey === 'production') {
              return (
                <p key={index} style={{ color: '#567327' }}>
                  {/* Updated label */}
                  Predicted {selectedItem || ''}: {formatNumber(entry.value as number)} tonnes
                </p>
              );
            } else if (entry.dataKey === 'lowerBound') {
              return (
                <p key={index} style={{ color: '#94a3b8' }}>
                  Lower bound: {formatNumber(entry.value as number)} tonnes
                </p>
              );
            } else if (entry.dataKey === 'upperBound') {
              return (
                <p key={index} style={{ color: '#94a3b8' }}>
                  Upper bound: {formatNumber(entry.value as number)} tonnes
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mt-6 animate-fade-in">
      <Card className="border-rice-200">
        <CardHeader className="bg-rice-50">
          <CardTitle className="text-rice-800 flex items-center">
            <PieChart className="mr-2 h-5 w-5" />
             {/* Updated CardTitle to include selectedItem */}
            Forecasted {selectedItem || 'Agricultural Product'} Production
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
              <p className="text-sm text-rice-700">Forecasting Method</p>
              <p className="text-xl font-semibold text-rice-800">
                {method === 'linear' ? 'Linear Regression' : 'Exponential Smoothing'}
              </p>
            </div>

            <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
              <p className="text-sm text-rice-700">
                 {/* Updated label */}
                {predictions.length > 1
                  ? `Forecast for ${selectedItem || ''} in Year ${predictions[predictions.length-1].year}`
                  : `Forecast for ${selectedItem || ''} in Year ${predictions[0].year}`}
              </p>
              <p className="text-xl font-semibold text-rice-800">
                {formatNumber(predictions[predictions.length-1]?.predictedProduction || 0)} tonnes
              </p>
            </div>

            <div className={`p-4 rounded-md border flex items-center ${
              isGrowth ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'
            }`}>
              <div>
                <p className="text-sm text-rice-700">Expected Growth ({selectedItem || ''})</p> {/* Updated label */}
                <p className={`text-xl font-semibold flex items-center ${
                  isGrowth ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isGrowth ? (
                    <ArrowUp className="h-5 w-5 mr-1" />
                  ) : (
                    <ArrowDown className="h-5 w-5 mr-1" />
                  )}
                  {Math.abs(growthPercent).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#52525b' }}
                />
                <YAxis
                  tick={{ fill: '#52525b' }}
                  tickFormatter={(value) => formatNumber(value, 0)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine
                  y={latestProduction}
                  stroke="#94a3b8"
                  strokeDasharray="3 3"
                  label={{ value: 'Current', position: 'insideLeft', fill: '#64748b' }}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  fill="#e2f0c4"
                  stroke="transparent"
                  strokeWidth={0}
                />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  fill="#e2f0c4"
                  stroke="transparent"
                  strokeWidth={0}
                />
                <Line
                  type="monotone"
                  dataKey="production"
                  name={`Predicted ${selectedItem || ''} Production`}
                  stroke="#567327"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#567327" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 p-4 bg-rice-50 rounded-md border border-rice-100">
            <h3 className="font-semibold flex items-center mb-3 text-rice-800">
              <Calculator className="h-4 w-4 mr-2" />
              Model Performance Metrics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {evaluation.mae !== undefined && (
                <div>
                  <p className="text-rice-600">Mean Absolute Error (MAE)</p>
                  <p className="font-medium">{formatNumber(evaluation.mae, 2)} tonnes of {selectedItem || 'product'}</p> {/* Updated label */}
                </div>
              )}
              {evaluation.rmse !== undefined && (
                <div>
                  <p className="text-rice-600">Root Mean Square Error (RMSE)</p>
                  <p className="font-medium">{formatNumber(evaluation.rmse, 2)} tonnes of {selectedItem || 'product'}</p> {/* Updated label */}
                </div>
              )}
              {evaluation.r2 !== undefined && (
                <div>
                  <p className="text-rice-600">R-squared</p>
                  <p className="font-medium">{(evaluation.r2 * 100).toFixed(2)}%</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForecastResults;
