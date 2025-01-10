import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import '../../app/globals.css';
import Navbar from '../../components/Navbar';
import PinCard from '../../components/PinCard';
import BoardGrid from '../../components/BoardGrid';
import CreateBoardModal from '../../components/CreateBoardModal';
import PinGrid from '../../components/PinGrid';
import { TrashIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('created');
  const [pins, setPins] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [stats, setStats] = useState({
    pins: 0,
    views: 0,
    likes: 0,
    followers: 0,
    following: 0
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (username) {
      fetchData();
      fetchUserStats();
    }
  }, [username, activeTab]);

  const fetchUserStats = async () => {
    try {
      const response = await api.get(`/api/users/${username}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let response;
      if (activeTab === 'boards') {
        response = await api.get(`/api/boards/${username}`);
        setBoards(response.data);
      } else {
        const endpoint = activeTab === 'saved' 
          ? `/api/pins/saved/${username}`
          : `/api/pins/created/${username}`;
        response = await api.get(`${endpoint}`);
        setPins(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleBoardCreated = (newBoard) => {
    setBoards([newBoard, ...boards]);
    setActiveTab('boards');
  };

  const deletePin = async (pinId) => {
    try {
      const response = await axios.delete(`/api/pins/${pinId}`);
      
      if (response.status === 200) {
        // Remove the pin from state
        setPins(prevPins => prevPins.filter(pin => pin.id !== pinId));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          pins: Math.max(0, prev.pins - 1)
        }));
        
      }
    } catch (error) {
      console.error('Error deleting pin:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        alert('Pin not found. It may have been already deleted.');
      } else {
        alert('Error deleting pin: ' + (error.response?.data?.error || 'Unknown error'));
      }
      
      // Refresh the pins list to ensure UI is in sync with server
      fetchData();
    }
  };

  const removePinFromBoard = async (pinId, boardId) => {
    try {
      await api.post(`/api/boards/${boardId}/remove-pin`, { pinId });
      setBoards(boards.map(board =>
        board.id === boardId ? { ...board, pin_count: board.pin_count - 1 } : board
      ));
    } catch (error) {
      console.error('Error removing pin from board:', error);
    }
  };

  const deleteBoard = async (boardId) => {
    try {
      await axios.delete(`/api/boards/${boardId}`);
      setBoards(boards.filter(board => board.id !== boardId));
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  const isOwnProfile = user?.displayName === username;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Boardify" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-gray-500">
            {username?.[0]?.toUpperCase()}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">@{username}</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 mb-1">Pins</p>
              <p className="text-2xl font-bold">{stats.pins}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 mb-1">Followers</p>
              <p className="text-2xl font-bold">{stats.followers}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 mb-1">Following</p>
              <p className="text-2xl font-bold">{stats.following}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-gray-600 mb-1">Views</p>
              <p className="text-2xl font-bold">{stats.views}</p>
            </div>
          </div>
  
          {/* Create Board Button */}
          {isOwnProfile && (
            <button
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="mt-4 px-6 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            >
              Create Board
            </button>
          )}
        </div>
  
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8 border-b">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'created'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'saved'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Saved
          </button>
          <button
            onClick={() => setActiveTab('boards')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'boards'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Boards
          </button>
        </div>
  
        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-xl mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : activeTab === 'boards' ? (
          <BoardGrid
            boards={boards}
            onDeleteBoard={deleteBoard}
            onRemovePinFromBoard={removePinFromBoard}
          />
        ) : (
          <PinGrid 
            pins={pins} 
            loading={loading} 
            boardTitle={activeTab === 'saved' ? 'Saved' : undefined} 
            onDeletePin={isOwnProfile ? deletePin : undefined}
          />
        )}
  
        {/* Create Board Modal */}
        <CreateBoardModal
          isOpen={isCreateBoardModalOpen}
          onClose={() => setIsCreateBoardModalOpen(false)}
          username={username}
          onBoardCreated={handleBoardCreated}
        />
      </div>
    </div>
  );
}
