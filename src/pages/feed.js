import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PinGrid from '../components/PinGrid';
import '../app/globals.css';
import api from '../lib/api';

export default function Feed() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (!user) {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchPins = async () => {
      if (!user) return;
      
      try {
        const response = await api.get('/api/feed', {
          params: {
            username: user.displayName
          }
        });
        setPins(response.data);
      } catch (error) {
        setError('Error fetching feed.');
        console.error('Error fetching feed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPins();
  }, [user]);

  const handleDeletePin = async (pinId) => {
    try {
      const response = await axios.delete(`/api/pins/${pinId}`);
      
      if (response.status === 200) {
        // Remove the pin from state
        setPins(prevPins => prevPins.filter(pin => pin.id !== pinId));
      }
    } catch (error) {
      console.error('Error deleting pin:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Pin not found. It may have been already deleted.');
      } else {
        throw new Error(error.response?.data?.error || 'Failed to delete pin');
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Boardify" />
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-primary mb-8 gradient-text">
          Your Feed
        </h1>

        {loading ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div 
                key={n} 
                className="break-inside-avoid mb-4 animate-pulse bg-white rounded-xl overflow-hidden"
              >
                <div className="bg-gray-200 h-64 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-xl text-red-500">{error}</p>
          </div>
        ) : pins.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 mb-4">Your feed is empty</p>
            <p className="text-gray-600">Follow some users to see their pins here!</p>
          </div>
        ) : (
          <PinGrid 
            pins={pins} 
            onDeletePin={handleDeletePin}
          />
        )}
      </div>
    </div>
  );
}