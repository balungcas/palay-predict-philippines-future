
import { Github } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Footer = () => {
  return (
    <footer className="bg-rice-100 text-rice-800 mt-10 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-bold text-lg">Palay Predict Philippines</h3>
            <p className="text-sm text-rice-600">
              Forecasting rice production for agricultural planning
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-rice-700 hover:text-rice-500 transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        <Separator className="my-4 bg-rice-200" />
        
        <div className="text-center text-sm text-rice-600">
          <p>&copy; {new Date().getFullYear()} Palay Predict Philippines. All rights reserved.</p>
          <p className="mt-1">
            Created with advanced time-series forecasting and data visualization techniques.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
