
import { useState } from 'react';
import { RiceProductionData } from '@/types/RiceData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/utils/dataUtils';

interface DataTableProps {
  data: RiceProductionData[];
}

const DataTable = ({ data }: DataTableProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const visibleData = data.slice(startIndex, startIndex + itemsPerPage);
  
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className="border-rice-200">
      <CardHeader className="bg-rice-50">
        <CardTitle className="text-rice-800 flex items-center">
          <List className="mr-2 h-5 w-5" />
          Historical Rice Production Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-rice-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-rice-100">
              <TableRow>
                <TableHead className="font-semibold">Year</TableHead>
                <TableHead className="font-semibold text-right">Area Harvested (ha)</TableHead>
                <TableHead className="font-semibold text-right">Yield (kg/ha)</TableHead>
                <TableHead className="font-semibold text-right">Production (tonnes)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleData.map((row, index) => (
                <TableRow key={index} className={index % 2 === 0 ? 'bg-rice-50' : 'bg-white'}>
                  <TableCell className="font-medium">{row.year}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.areaHarvested)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.yield)}</TableCell>
                  <TableCell className="text-right">{formatNumber(row.production)}</TableCell>
                </TableRow>
              ))}
              {visibleData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                    No data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-rice-600">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, data.length)} of {data.length} records
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToPreviousPage}
                disabled={currentPage === 0}
                className="border-rice-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="border-rice-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DataTable;
