import { RiceProductionData } from '@/types/RiceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/utils/dataUtils';
// ... (existing imports)
import { TrendingUp } from 'lucide-react';

interface DataVisualizerProps {
  data: RiceProductionData[];
  selectedItem: string | null; // Added selectedItem prop
}
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

const DataVisualizer = ({ data, selectedItem }: DataVisualizerProps) => { // Destructure selectedItem
  const chartData = data.map(item => ({
    year: item.year,
    grossProduction: item.grossProduction,
  }));

  // Calculate statistics
  const lastEntry = data.length > 0 ? data[data.length - 1] : null; // Handle empty data
  const firstEntry = data.length > 0 ? data[0] : null; // Handle empty data


  const years = data.length;
  const growthRate = years > 1 && firstEntry && lastEntry // Add checks for firstEntry and lastEntry
    ? ((lastEntry.grossProduction - firstEntry.grossProduction) / firstEntry.grossProduction) * 100 / (lastEntry.year - firstEntry.year) // Calculate growth rate over the period
    : 0;


  const totalGrossProduction = data.reduce((sum, item) => sum + item.grossProduction, 0);
  const avgGrossProduction = data.length > 0 ? totalGrossProduction / data.length : 0;

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-rice-200 shadow-md rounded-md">
          <p className="font-semibold text-rice-800">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
 <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatNumber(entry.value as number, 0)}`}
 </p>
          ))}
        </div>
      );
    }
    return null;
  };

 return (
 <div className="space-y-6">
      <Card className="border-rice-200">
       <CardHeader className="bg-rice-50">
 <CardTitle className="text-rice-800 flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
 {/* Updated CardTitle to include selectedItem */}
 {selectedItem ? `${selectedItem} Gross Production Trends Over Time` : 'Gross Production Trends Over Time'}
 </CardTitle>
        </CardHeader>
       <CardContent className="p-4">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
 <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
 <p className="text-sm text-rice-700">Average Annual {selectedItem || ''} Gross Production</p> {/* Updated label */}
 <p className="text-2xl font-bold text-rice-800">{formatNumber(avgGrossProduction)} 1000 Int$</p>
 </div>
 <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
 <p className="text-sm text-rice-700">Latest {selectedItem || ''} Gross Production (Year {lastEntry?.year})</p> {/* Updated label */}
 <p className="text-2xl font-bold text-rice-800">{formatNumber(lastEntry?.grossProduction || 0)} 1000 Int$</p>
 </div>
 <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
 <p className="text-sm text-rice-700">Avg. Annual Growth Rate ({selectedItem || ''} Gross Production)</p> {/* Updated label */}
 <p className="text-2xl font-bold text-rice-800">{growthRate.toFixed(1)}%</p>
 </div>
 </div>

 <div className="h-80">
 <ResponsiveContainer width="100%" height="100%">
 {data.length > 0 ? (
 <LineChart
                   data={chartData}
                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                   <XAxis
                     dataKey="year"
                     tick={{ fill: '#52525b' }}
                   />
                   <YAxis
                     yAxisId="left"
                     tick={{ fill: '#52525b' }}
                     tickFormatter={(value) => formatNumber(value, 0)}
                   />
                   <Tooltip content={<CustomTooltip />} />
                   <Legend />
                   <Line
                     yAxisId="left"
                     type="monotone"
                     dataKey="grossProduction"
                     name="Gross Production"
                     stroke="#92c03e"
                     strokeWidth={3}
                     dot={{ r: 4 }}
                     activeDot={{ r: 6 }}
                   />
                 </LineChart>
 ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
 No data available for {selectedItem || 'the selected item'}.
                </div>
 )}
 </ResponsiveContainer>
 </div>
 </CardContent>
 </Card>
 </div>
 );
};

export default DataVisualizer;
