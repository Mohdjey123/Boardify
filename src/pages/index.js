import { useEffect, useState } from 'react';
import axios from 'axios';
import '../app/globals.css';
import Navbar from '../components/Navbar';

export default function Home() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/pins');
        setPins(response.data);
      } catch (error) {
        setError('Error fetching pins.');
        console.error('Error fetching pins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPins();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-semibold text-primary mb-6">Explore Pins</h1>

        {loading ? (
          <div className="text-center text-xl text-primary">Loading pins...</div>
        ) : error ? (
          <div className="text-center text-xl text-secondary">{error}</div>
        ) : pins.length === 0 ? (
          <div className="text-center text-xl text-gray-500">No pins available</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pins.map((pin) => (
              <div key={pin.id} pin={pin} className="border p-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                <img
                  src={pin.image_url}
                  alt={pin.title}
                  className="w-full h-64 object-cover rounded-md mb-4"
                />
                <h2 className="text-xl font-bold text-primary mb-2">{pin.title}</h2>
                <p className="text-gray-600">{pin.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="font-medium">{pin.username || 'Unknown'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
