
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

const Methodology = () => {
  return (
    <Card className="border-rice-200 mt-6">
      <CardHeader className="bg-rice-50">
        <CardTitle className="text-rice-800 flex items-center">
          <Info className="mr-2 h-5 w-5" />
          Methodology & Understanding
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-rice-200">
            <AccordionTrigger className="text-rice-800 hover:text-rice-600">
              Understanding Rice Production Data
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-rice-700 space-y-3">
                <p>
                  Rice production data typically includes four key elements:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Year:</strong> The calendar year of the harvest.</li>
                  <li><strong>Area Harvested:</strong> Land area in hectares (ha) where rice was grown and harvested.</li>
                  <li><strong>Yield:</strong> Average production per unit of land area (kg/ha).</li>
                  <li><strong>Production:</strong> Total rice produced, measured in tonnes.</li>
                </ul>
                <p>
                  These data points are interrelated: Production = Area Harvested × Yield. 
                  Understanding these relationships helps identify whether production changes 
                  are driven by expanded farming area or improved agricultural techniques.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2" className="border-rice-200">
            <AccordionTrigger className="text-rice-800 hover:text-rice-600">
              Time Series Forecasting Methods
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-rice-700 space-y-3">
                <p>
                  This tool implements two common forecasting approaches:
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Linear Regression</h4>
                  <p>
                    Linear regression finds the straight line that best fits the historical data and extends 
                    this line into the future. This method works well when production trends are fairly steady 
                    and consistent over time.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Exponential Smoothing</h4>
                  <p>
                    Exponential smoothing gives more weight to recent observations and less weight to older ones. 
                    This makes it more responsive to recent changes in trends, which can be valuable when recent 
                    agricultural developments are having a significant impact.
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-3" className="border-rice-200">
            <AccordionTrigger className="text-rice-800 hover:text-rice-600">
              Evaluating Forecast Accuracy
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-rice-700 space-y-3">
                <p>
                  We use several metrics to assess forecast reliability:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Mean Absolute Error (MAE):</strong> The average of absolute differences between 
                    predicted and actual values. Lower values indicate better accuracy.
                  </li>
                  <li>
                    <strong>Root Mean Square Error (RMSE):</strong> Similar to MAE but gives more weight to 
                    large errors. Lower values indicate better accuracy.
                  </li>
                  <li>
                    <strong>R-squared (R²):</strong> Measures how well the model explains the variability in 
                    the data. Values closer to 100% indicate better fit.
                  </li>
                </ul>
                
                <p>
                  We also provide confidence intervals (the shaded area in forecasts) to show the range 
                  of likely outcomes, accounting for uncertainty in our predictions.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-4" className="border-rice-200">
            <AccordionTrigger className="text-rice-800 hover:text-rice-600">
              Limitations and Considerations
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-rice-700 space-y-3">
                <p>
                  When interpreting the forecasts, keep these limitations in mind:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>External Factors:</strong> These forecasts primarily rely on historical patterns 
                    and don't explicitly account for climate change, agricultural policy changes, new farming 
                    technologies, or economic disruptions.
                  </li>
                  <li>
                    <strong>Data Quality:</strong> The accuracy depends heavily on the quality and 
                    completeness of the historical data provided.
                  </li>
                  <li>
                    <strong>Forecast Horizon:</strong> Predictions become less reliable the further into the 
                    future they extend. We recommend focusing on shorter-term forecasts (1-3 years) for 
                    greater confidence.
                  </li>
                </ul>
                
                <p>
                  These forecasts should be used as one tool among many for agricultural planning and 
                  should be complemented with expert knowledge and other analytical methods.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default Methodology;
