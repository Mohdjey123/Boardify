import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import '../app/globals.css';
import api from '../lib/api';

export default function SavePinModal({ isOpen, onClose, pin, username }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');

  useEffect(() => {
    if (isOpen && username) {
      fetchBoards();
    }
  }, [isOpen, username]);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/boards/${username}`);
      setBoards(response.data);
    } catch (error) {
      console.error('Error fetching boards:', error);
    }
    setLoading(false);
  };

  const handleSaveToBoard = async (boardId) => {
    setSaving(true);
    try {
      const response = await api.post(`/api/boards/${boardId}/pins`, {
        pinId: pin.id
      });
      
      if (response.data.alreadySaved) {
        alert('Pin is already saved to this board');
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error saving pin:', error);
      alert('Error saving pin to board');
    }
    setSaving(false);
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    setSaving(true);
    try {
      const response = await api.post('/api/boards', {
        username,
        title: newBoardTitle.trim(),
        description: '',
        is_private: false
      });
      await handleSaveToBoard(response.data.id);
      setNewBoardTitle('');
      setShowCreateBoard(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-primary">Save to board</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-4 text-center text-gray-500">Loading boards...</div>
          ) : (
            <>
              {showCreateBoard ? (
                <form onSubmit={handleCreateBoard} className="mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newBoardTitle}
                      onChange={(e) => setNewBoardTitle(e.target.value)}
                      placeholder="Board name"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      required
                    />
                    <button
                      type="submit"
                      disabled={saving || !newBoardTitle.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="flex items-center w-full px-4 py-3 mb-4 text-left hover:bg-gray-50 rounded-lg"
                >
                  <PlusIcon className="w-4 h-4mr-2 text-gray-500" />
                  <span>Create new board</span>
                </button>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {boards.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => handleSaveToBoard(board.id)}
                    disabled={saving}
                    className="flex items-center w-full px-4 py-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg mr-3">
                      {board.cover_image && (
                        <img
                          src={board.cover_image}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{board.title}</div>
                      <div className="text-sm text-gray-500">
                        {board.pin_count} pins
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 