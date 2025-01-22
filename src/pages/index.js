import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import Navbar from '../components/Navbar';
import PinGrid from '../components/PinGrid';
import '../app/globals.css';
import api from '../lib/api';

export default function Home() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const response = await api.get('/pins');
        setPins(response.data);
      } catch (error) {
        console.error('Error fetching pins:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPins();
  }, []);

  const handleDeletePin = async (pinId) => {
    try {
      const response = await axios.delete(`/pins/${pinId}`);
      
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Boardify" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PinGrid 
          pins={pins} 
          loading={loading} 
          onDeletePin={user ? handleDeletePin : undefined}
        />
      </div>
    </div>
  );
}