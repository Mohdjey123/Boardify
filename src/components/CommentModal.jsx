import { useState, useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline, BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import { getAuth } from 'firebase/auth';
import axios from 'axios';
import '../app/globals.css';
import api from '../lib/api';

export default function CommentModal({ 
  pin, 
  isOpen, 
  onClose, 
  currentImageIndex = 0,
  setCurrentImageIndex,
  images = [],
  onSaveClick  
}) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likes, setLikes] = useState(pin.likes || 0);
  const [isLiked, setIsLiked] = useState(pin.liked_by_user || false);
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  useEffect(() => {
    const fetchComments = async () => {
      if (isOpen && pin.id) {
        try {
          const response = await api.get(`/api/pins/${pin.id}/comments`);
          setComments(response.data);
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      }
    };
    fetchComments();
  }, [isOpen, pin.id]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/api/pins/${pin.id}/comments`, {
        username: auth.currentUser.displayName,
        content: newComment
      });

      setComments(prevComments => [response.data, ...prevComments]);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
    setIsSubmitting(false);
  };

  const handleLike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await api.post(`/api/pins/${pin.id}/like`, {
        username: currentUser.displayName,
      });
      
      setIsLiked(response.data.liked);
      setLikes(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error liking pin:', error);
    }
    setLoading(false);
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    
    // Call the parent component's onSaveClick handler
    if (onSaveClick) {
      onSaveClick();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className={`w-full bg-white rounded-2xl shadow-2xl overflow-hidden
            transform transition-all duration-300
            ${images.length > 0 ? 'max-w-5xl' : 'max-w-2xl'}`}>
            
            <div className={`grid grid-cols-1 ${images.length > 0 ? 'md:grid-cols-2' : ''}`}>
              {/* Image Section */}
              {images.length > 0 && (
                <div className="relative bg-gray-50">
                  <img
                    src={images[currentImageIndex]}
                    alt={pin.title}
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '80vh' }}
                    onDoubleClick={handleLike}
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full
                          bg-white/90 hover:bg-white shadow-lg transition-all duration-200
                          hover:scale-110"
                      >
                        <ChevronLeftIcon className="w-4 h-4text-gray-700" />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full
                          bg-white/90 hover:bg-white shadow-lg transition-all duration-200
                          hover:scale-110"
                      >
                        <ChevronRightIcon className="w-4 h-4text-gray-700" />
                      </button>
                      
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 
                        flex space-x-2 bg-white/20 backdrop-blur-sm rounded-full p-2">
                        {images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300
                              ${currentImageIndex === index 
                                ? 'bg-white scale-125' 
                                : 'bg-white/50 hover:bg-white/75'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Content Section */}
              <div className={`flex flex-col h-full ${images.length === 0 ? 'md:col-span-2' : ''}`}>
                {/* Header */}
                <div className="p-6 border-b">
                  {/* Author Info and Action Buttons */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 
                        flex items-center justify-center text-primary font-medium text-lg">
                        {pin.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">@{pin.username}</h3>
                        <p className="text-sm text-gray-500">Original poster</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleLike}
                        disabled={loading}
                        className="p-2 rounded-full hover:bg-gray-100 
                          transition-colors duration-200"
                      >
                        {isLiked ? (
                          <HeartIconSolid className={`w-4 h-4 text-red-500 ${loading ? 'animate-pulse' : ''}`} />
                        ) : (
                          <HeartIconOutline className={`w-4 h-4 text-gray-500 hover:text-red-500 ${loading ? 'animate-pulse' : ''}`} />
                        )}
                      </button>
                      
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="p-2 rounded-full hover:bg-gray-100 
                          transition-colors duration-200"
                      >
                        <BookmarkIconOutline className={`w-4 h-4 text-gray-500 hover:text-primary ${loading ? 'animate-pulse' : ''}`} />
                      </button>

                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full 
                          transition-colors duration-200"
                      >
                        <XMarkIcon className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <Dialog.Title className="text-xl font-semibold text-gray-900 mb-3">
                    {pin.title}
                  </Dialog.Title>
                  
                  <div className="prose prose-sm max-w-none text-gray-600" 
                    dangerouslySetInnerHTML={{ __html: pin.description }} 
                  />
                </div>
                
                {/* Comments Section */}
                <div className="flex-1 overflow-hidden flex flex-col p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Comments</h3>
                  
                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                    {comments.map((comment, index) => (
                      <div key={index} className="flex space-x-3 group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 
                          flex items-center justify-center flex-shrink-0 text-primary font-medium">
                          {comment.username[0].toUpperCase()}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm text-gray-900">{comment.username}</p>
                          <p className="text-gray-600 text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                        <p>No comments yet</p>
                        <p className="text-sm">Be the first to share your thoughts!</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Comment Form */}
                  {auth.currentUser ? (
                    <form onSubmit={handleSubmitComment} className="mt-auto">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 bg-gray-50 border-0 rounded-full px-4 py-2.5
                            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white
                            transition-all duration-200"
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting || !newComment.trim()}
                          className="px-6 py-2.5 bg-primary text-white rounded-full
                            hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200 font-medium text-sm"
                        >
                          Post
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-auto text-center py-4 bg-gray-50 rounded-xl">
                      <p className="text-gray-600">
                        Please log in to join the conversation
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}