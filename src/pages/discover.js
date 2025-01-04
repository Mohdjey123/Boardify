import { useState, useEffect } from 'react';
import axios from 'axios';
import PinCard from '../components/PinCard';
import Navbar from '../components/Navbar';

export default function Discover() {
  const [trendingPins, setTrendingPins] = useState([]);
  const [recommendedPins, setRecommendedPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        // Fetch all pins
        const response = await axios.get('http://localhost:5000/api/pins');
        const allPins = response.data;

        // Sort pins by popularity (you can modify this algorithm)
        const sortedByPopularity = [...allPins].sort((a, b) => {
          // Example scoring: could include likes, views, saves, etc.
          const scoreA = calculatePopularityScore(a);
          const scoreB = calculatePopularityScore(b);
          return scoreB - scoreA;
        });

        // Get trending pins (top 6)
        setTrendingPins(sortedByPopularity.slice(0, 6));

        // Get personalized recommendations
        const recommendations = generateRecommendations(allPins);
        setRecommendedPins(recommendations);

      } catch (err) {
        setError('Error fetching pins');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPins();
  }, []);

  // Calculate popularity score (example algorithm)
  const calculatePopularityScore = (pin) => {
    // You can modify this algorithm based on your needs
    const views = pin.views || 0;
    const likes = pin.likes || 0;
    const saves = pin.saves || 0;
    const recency = Date.now() - new Date(pin.created_at).getTime();
    
    return (views * 0.4) + (likes * 0.3) + (saves * 0.3) - (recency * 0.00001);
  };

  // Generate personalized recommendations (example algorithm)
  const generateRecommendations = (pins) => {
    // This is a simple example - you can make it more sophisticated
    return pins
      .sort(() => 0.5 - Math.random()) // Random shuffle for now
      .slice(0, 6); // Get 6 random pins
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto p-6">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-primary mb-6 gradient-text">
            Trending Now
          </h2>
          {loading ? (
            <div className="loading-gradient h-64 rounded-xl animate-pulse" />
          ) : error ? (
            <div className="text-center text-secondary">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {trendingPins.map((pin) => (
                <PinCard key={pin.id} pin={pin} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-3xl font-bold text-primary mb-6 gradient-text">
            Recommended for You
          </h2>
          {loading ? (
            <div className="loading-gradient h-64 rounded-xl animate-pulse" />
          ) : error ? (
            <div className="text-center text-secondary">{error}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recommendedPins.map((pin) => (
                <PinCard key={pin.id} pin={pin} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
} 