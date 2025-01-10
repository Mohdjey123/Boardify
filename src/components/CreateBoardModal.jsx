import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import '../app/globals.css';

export default function CreateBoardModal({ isOpen, onClose, username, onBoardCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('http://10.0.0.23:5000/api/boards', {
        username,
        title: title.trim(),
        description: description.trim(),
        is_private: isPrivate
      });
      
      onBoardCreated(response.data);
      onClose();
      setTitle('');
      setDescription('');
      setIsPrivate(false);
    } catch (error) {
      console.error('Error creating board:', error);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black/80 backdrop-blur-sm" 
             onClick={onClose} />

        <div className="inline-block w-full max-w-md p-8 my-8 overflow-hidden 
                      text-left align-middle transition-all transform bg-white 
                      border-2 border-blue shadow-[8px_8px_0px_0px_#FFBE98] rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-blue">Create Board</h3>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl border-2 border-blue hover:-translate-y-1 
                       hover:border-pink transition-all duration-200"
            >
              <XMarkIcon className="w-4 h-4 text-blue hover:text-pink" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-lg font-bold text-blue mb-2">
                Name
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 bg-white border-2 border-blue rounded-xl
                          focus:border-pink focus:ring-4 focus:ring-peach/30
                          transition-all duration-200 placeholder:text-blue/50"
                placeholder="Like 'Places to Go' or 'Recipes to Make'"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-lg font-bold text-blue mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full p-4 bg-white border-2 border-blue rounded-xl
                          focus:border-pink focus:ring-4 focus:ring-peach/30
                          transition-all duration-200 placeholder:text-blue/50"
                placeholder="What's your board about?"
              />
            </div>

            <div className="bg-peach/10 border-2 border-blue rounded-xl p-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded-lg border-2 border-blue text-pink 
                           focus:ring-4 focus:ring-pink/30 h-5 w-5"
                />
                <span className="ml-3 text-blue font-bold">Make this board private</span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 font-bold text-blue border-2 border-blue rounded-xl
                         hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A]
                         active:translate-y-0 active:shadow-none
                         transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="px-6 py-3 font-bold text-white bg-pink border-2 border-blue rounded-xl
                         shadow-[4px_4px_0px_0px_#125B9A]
                         hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#125B9A]
                         active:translate-y-0 active:shadow-none
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200"
              >
                {loading ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}