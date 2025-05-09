
import { Sprout } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-rice-500 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-2 md:mb-0">
          <Sprout className="h-8 w-8 mr-2" />
          <h1 className="text-2xl font-bold">Palay Predict Philippines</h1>
        </div>
        <div className="text-sm md:text-base">
          <p>Forecasting Rice Production in the Philippines</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
