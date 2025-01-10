import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';
import axios from 'axios';
import PinCard from '../components/PinCard';

export default function SearchPage() {
  const router = useRouter();
  const { q: query } = router.query;
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`http://10.0.0.23:5000/api/pins/search?q=${encodeURIComponent(query)}`);
        setSearchResults(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to fetch search results');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">
          {query ? `Search results for "${query}"` : 'Search'}
        </h1>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
            {searchResults.map(pin => (
              <PinCard key={pin.id} pin={pin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 