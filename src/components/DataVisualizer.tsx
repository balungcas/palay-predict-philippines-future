
import { RiceProductionData } from '@/types/RiceData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { BarChart, Bar } from 'recharts';
import { formatNumber } from '@/utils/dataUtils';
import { TrendingUp } from 'lucide-react';

interface DataVisualizerProps {
  data: RiceProductionData[];
}

const DataVisualizer = ({ data }: DataVisualizerProps) => {
  const chartData = data.map(item => ({
    year: item.year,
    production: item.production,
    yield: item.yield,
    areaHarvested: item.areaHarvested,
  }));
  
  // Calculate statistics
  const lastEntry = data[data.length - 1];
  const firstEntry = data[0];
  
  const years = data.length;
  const growthRate = years > 1 
    ? ((lastEntry.production - firstEntry.production) / firstEntry.production) * 100 / years
    : 0;
  
  const totalProduction = data.reduce((sum, item) => sum + item.production, 0);
  const avgProduction = data.length > 0 ? totalProduction / data.length : 0;
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-rice-200 shadow-md rounded-md">
          <p className="font-semibold text-rice-800">{`Year: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${formatNumber(entry.value as number, entry.name === 'Production' ? 0 : entry.name === 'Yield' ? 0 : 0)}`}
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
            Production Trends Over Time
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
              <p className="text-sm text-rice-700">Average Annual Production</p>
              <p className="text-2xl font-bold text-rice-800">{formatNumber(avgProduction)} tonnes</p>
            </div>
            <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
              <p className="text-sm text-rice-700">Latest Production (Year {lastEntry?.year})</p>
              <p className="text-2xl font-bold text-rice-800">{formatNumber(lastEntry?.production || 0)} tonnes</p>
            </div>
            <div className="bg-rice-50 p-4 rounded-md border border-rice-100">
              <p className="text-sm text-rice-700">Avg. Annual Growth Rate</p>
              <p className="text-2xl font-bold text-rice-800">{growthRate.toFixed(1)}%</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
                  dataKey="production"
                  name="Production"
                  stroke="#92c03e"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-rice-200">
          <CardHeader className="bg-rice-50 pb-2">
            <CardTitle className="text-rice-800 text-lg">Yearly Rice Yield</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
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
                  <Line
                    type="monotone"
                    dataKey="yield"
                    name="Yield"
                    stroke="#567327"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-rice-200">
          <CardHeader className="bg-rice-50 pb-2">
            <CardTitle className="text-rice-800 text-lg">Area Harvested</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
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
                  <Bar
                    dataKey="areaHarvested"
                    name="Area Harvested"
                    fill="#cce49a"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataVisualizer;
