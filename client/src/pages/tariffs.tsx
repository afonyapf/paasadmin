import { useState, useEffect } from "react";

interface Tariff {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string;
  limits: string;
  isActive: boolean;
}

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const response = await fetch("/api/tariffs");
        if (!response.ok) {
          throw new Error("Failed to fetch tariffs");
        }
        const data = await response.json();
        setTariffs(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTariffs();
  }, []);

  // Parse JSON strings to arrays
  const parseTariffData = (tariff: Tariff) => {
    try {
      const features = JSON.parse(tariff.features);
      const limits = JSON.parse(tariff.limits);
      return { features, limits };
    } catch (e) {
      return { 
        features: ["Error parsing features"], 
        limits: { error: "Error parsing limits" } 
      };
    }
  };

  // Format price from cents to dollars
  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tariffs</h1>
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tariffs.length > 0 ? (
            tariffs.map((tariff) => {
              const { features, limits } = parseTariffData(tariff);
              return (
                <div key={tariff.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tariff.name}</h2>
                      {tariff.isActive ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">{tariff.description}</p>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(tariff.price)}</span>
                      {tariff.price > 0 && <span className="text-gray-500 dark:text-gray-400">/month</span>}
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Features</h3>
                      <ul className="space-y-2">
                        {Array.isArray(features) ? features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                          </li>
                        )) : (
                          <li className="text-gray-600 dark:text-gray-300">No features available</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Limits</h3>
                      <ul className="space-y-2">
                        {typeof limits === 'object' && limits !== null ? Object.entries(limits).map(([key, value]) => (
                          <li key={key} className="flex items-center">
                            <span className="text-gray-600 dark:text-gray-300">
                              <span className="font-medium">{key}:</span> {value === -1 ? 'Unlimited' : value}
                            </span>
                          </li>
                        )) : (
                          <li className="text-gray-600 dark:text-gray-300">No limits available</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300">No tariffs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}