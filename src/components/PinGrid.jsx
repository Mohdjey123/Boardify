import React from 'react';
import { getAuth } from 'firebase/auth';
import PinCard from './PinCard';
import '../app/globals.css';

export default function PinGrid({ pins, boardTitle = null, loading = false, onDeletePin = null }) {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const handleDeletePin = (pinId) => {
    // Only allow deletion if onDeletePin is provided and the user owns the pin
    if (typeof onDeletePin === 'function') {
      return onDeletePin(pinId);
    }
    return Promise.reject(new Error('Delete operation not allowed'));
  };

  if (loading) {
    return (
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div 
            key={n} 
            className="break-inside-avoid mb-6 animate-pulse bg-white rounded-2xl overflow-hidden
                       border-2 border-blue shadow-[6px_6px_0px_0px_#FFBE98]"
          >
            <div className="bg-peach/20 h-64 rounded-t-xl"></div>
            <div className="p-4">
              <div className="h-4 bg-peach/30 rounded-full w-3/4 mb-2"></div>
              <div className="h-4 bg-peach/30 rounded-full w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!pins?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-2xl text-blue font-bold mb-4">No pins found</p>
        <p className="text-teal font-medium">Try creating some new pins!</p>
      </div>
    );
  }

  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-6">
      {pins.map(pin => {
        // Only pass onDeletePin if the current user owns the pin
        const canDelete = currentUser && 
                         pin.username === currentUser.displayName && 
                         typeof onDeletePin === 'function';

        return (
          <PinCard 
            key={pin.id} 
            pin={pin} 
            boardTitle={boardTitle}
            onDeletePin={canDelete ? handleDeletePin : undefined}
          />
        );
      })}
    </div>
  );
}