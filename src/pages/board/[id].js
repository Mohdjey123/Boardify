import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import Navbar from '../../components/Navbar';
import PinGrid from '../../components/PinGrid';
import '../../app/globals.css';
import api from '../lib/api';

export default function BoardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [board, setBoard] = useState(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBoardData = async () => {
      if (!id) return;

      try {
        const [boardResponse, pinsResponse] = await Promise.all([
          api.get(`/api/boards/${id}`),
          api.get(`/api/boards/${id}/pins`)
        ]);

        setBoard(boardResponse.data);
        setPins(pinsResponse.data);
      } catch (error) {
        console.error('Error fetching board:', error);
        setError('Error loading board');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Boardify" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="aspect-square bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar title="Boardify" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <p className="text-xl text-red-500">{error || 'Board not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Boardify" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{board.title}</h1>
          {board.description && (
            <p className="text-gray-600">{board.description}</p>
          )}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span>{pins.length} pins</span>
            {board.is_private && (
              <span className="ml-4 flex items-center">
                <LockClosedIcon className="w-4 h-4mr-1" />
                Private board
              </span>
            )}
          </div>
        </div>

        <div className="mt-8">
          <PinGrid pins={pins} loading={loading} boardTitle={board?.title} />
        </div>
      </div>
    </div>
  );
} 