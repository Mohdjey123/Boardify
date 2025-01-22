import { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  HeartIcon as HeartIconSolid, 
  EyeIcon as EyeIconSolid, 
  ChatBubbleLeftIcon, 
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import CommentModal from './CommentModal';
import SavePinModal from './SavePinModal';
import { Dialog } from '@headlessui/react';
import api from '../lib/api';

export default function PinCard({ pin, boardTitle, onDeletePin }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [likes, setLikes] = useState(pin.likes || 0);
  const [views, setViews] = useState(pin.views || 0);
  const [isLiked, setIsLiked] = useState(pin.liked_by_user || false);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const [showComments, setShowComments] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  const user = getAuth().currentUser;

  const images = [pin.image_url, ...(pin.additional_images || [])].filter(url => 
    url && !url.includes('placeholder.com')
  );

  const hasImages = images.length > 0;

  useEffect(() => {
    const recordView = async () => {
      try {
        const response = await api.post(`/pins/${pin.id}/view`);
        setViews(response.data.views);
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };
    recordView();
  }, [pin.id]);

  const handleLike = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/pins/${pin.id}/like`, {
        username: user.displayName
      });
      
      setIsLiked(response.data.liked);
      setLikes(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error updating like:', error);
    }
    setLoading(false);
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    setShowComments(true);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDeletePin) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await onDeletePin(pin.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      setDeleteError(error?.response?.data?.error || 'Error deleting pin');
    } finally {
      setDeleteLoading(false);
    }
  };

  const ActionButton = ({ onClick, children, className = "" }) => (
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-xl bg-white border-2 border-blue shadow-[3px_3px_0px_0px_#125B9A]
                hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A] 
                active:translate-y-0 active:shadow-[2px_2px_0px_0px_#125B9A]
                transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  );

  const DeleteConfirmationModal = () => (
    <Dialog
      open={showDeleteConfirm}
      onClose={() => !deleteLoading && setShowDeleteConfirm(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm bg-white rounded-2xl p-6 border-2 border-blue shadow-[6px_6px_0px_0px_#FFBE98]">
          <Dialog.Title className="text-xl font-bold text-blue mb-4">
            Delete Pin
          </Dialog.Title>

          <p className="text-blue/80 mb-6">
            Are you sure you want to delete this pin? This action cannot be undone.
          </p>

          {deleteError && (
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600">
              {deleteError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteLoading}
              className="px-4 py-2 font-bold text-blue border-2 border-blue rounded-xl
                       hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A]
                       active:translate-y-0 active:shadow-none
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="px-4 py-2 font-bold text-white bg-pink border-2 border-blue rounded-xl
                       shadow-[4px_4px_0px_0px_#125B9A]
                       hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#125B9A]
                       active:translate-y-0 active:shadow-none
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );

  return (
    <>
      <div 
        onClick={handleCardClick}
        className={`
          group relative bg-white rounded-2xl overflow-hidden cursor-pointer
          transform transition-all duration-300 ease-in-out
          border-2 border-blue shadow-[6px_6px_0px_0px_#FFBE98]
          hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_#FFBE98]
          ${!hasImages ? 'p-4' : ''}
          break-inside-avoid mb-6
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Action Buttons */}
        <div className="absolute top-4 right-4 z-20 flex flex-col space-y-2.5
          md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
          {user && pin.username === user.displayName && (
            <ActionButton 
              onClick={handleDeleteClick}
              className="bg-pink hover:bg-pink/90"
            >
              <TrashIcon className="w-4 h-4text-white" />
            </ActionButton>
          )}

          <ActionButton onClick={handleLike}>
            {isLiked ? (
              <HeartIconSolid className={`w-4 h-4text-pink ${loading ? 'animate-pulse' : ''}`} />
            ) : (
              <HeartIconOutline className={`w-4 h-4text-blue group-hover/button:text-pink ${loading ? 'animate-pulse' : ''}`} />
            )}
          </ActionButton>

          <ActionButton onClick={() => setShowComments(true)}>
            <ChatBubbleLeftIcon className="w-4 h-4text-blue group-hover/button:text-teal" />
          </ActionButton>

          <ActionButton onClick={() => setShowSaveModal(true)}>
            <BookmarkIcon className="w-4 h-4text-blue group-hover/button:text-teal" />
          </ActionButton>
        </div>

        {/* Image Section */}
        {hasImages && (
          <div className="relative">
            <img
              src={images[currentImageIndex]}
              alt={pin.title}
              className="w-full object-cover"
              style={{ aspectRatio: '4/5', objectFit: 'cover' }}
              onDoubleClick={handleLike}
            />
            
            {/* Image Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 
                    rounded-xl bg-white/90 border-2 border-blue
                    opacity-0 group-hover:opacity-100 transition-all duration-300
                    hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A]"
                >
                  <ChevronLeftIcon className="w-4 h-4text-blue" />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 
                    rounded-xl bg-white/90 border-2 border-blue
                    opacity-0 group-hover:opacity-100 transition-all duration-300
                    hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A]"
                >
                  <ChevronRightIcon className="w-4 h-4text-blue" />
                </button>

                {/* Image Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2.5 h-2.5 rounded-lg transition-all duration-300 border border-blue
                        ${currentImageIndex === index 
                          ? 'bg-peach scale-125' 
                          : 'bg-white hover:bg-peach/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className={`flex flex-col gap-3 ${hasImages ? 'p-4' : ''} relative z-10`}>
          <Link 
            href={`/profile/${pin.username}`}
            className="inline-block text-sm font-bold text-teal hover:text-pink transition-colors"
          >
            @{pin.username || 'Unknown'}
          </Link>

          <h3 className="text-xl font-bold text-blue group-hover:text-pink transition-colors">
            {pin.title}
          </h3>
          
          <div className="prose prose-sm max-w-none text-blue/80
            line-clamp-3 group-hover:line-clamp-none transition-all">
            <div dangerouslySetInnerHTML={{ __html: pin.description }} />
          </div>
          
          {boardTitle && (
            <p className="text-sm text-teal">
              Saved to <span className="font-bold text-pink">{boardTitle}</span>
            </p>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t-2 border-blue/10">
            <div className="text-sm font-bold text-blue">
              {likes} likes
            </div>

            <div className="flex items-center gap-2 text-sm font-bold text-blue">
              <EyeIconSolid className="w-4 h-4text-teal" />
              <span>{views}</span>
            </div>
          </div>
        </div>
      </div>

      <CommentModal
        pin={pin}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        images={images}
      />

      <SavePinModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        pin={pin}
        username={auth.currentUser?.displayName}
      />

      <DeleteConfirmationModal />
    </>
  );
}