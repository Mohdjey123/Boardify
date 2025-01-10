import Link from 'next/link';
import { LockClosedIcon } from '@heroicons/react/24/solid';
import { TrashIcon } from '@heroicons/react/24/outline';
import '../app/globals.css';

export default function BoardGrid({ boards, onDeleteBoard }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {boards.map((board) => (
        <div key={board.id} className="relative group">
          <Link
            href={`/board/${board.id}`}
            className="block"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden 
                          border-2 border-blue bg-peach/10
                          shadow-[6px_6px_0px_0px_#FFBE98]
                          group-hover:-translate-y-1 group-hover:shadow-[8px_8px_0px_0px_#FFBE98]
                          transition-all duration-200">
              {board.cover_image ? (
                <img
                  src={board.cover_image}
                  alt={board.title}
                  className="w-full h-full object-cover transition-all duration-200
                           group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <div className="w-16 h-16 rounded-xl bg-peach/30 border-2 border-blue
                                flex items-center justify-center mb-3">
                    <span className="text-2xl font-bold text-blue">+</span>
                  </div>
                  <p className="font-bold text-blue text-center">No pins yet</p>
                  <p className="text-sm text-teal text-center mt-1">Add your first pin!</p>
                </div>
              )}
              {board.is_private && (
                <div className="absolute top-3 right-3 p-2 rounded-xl 
                              bg-white/90 backdrop-blur-sm border-2 border-blue">
                  <LockClosedIcon className="w-4 h-4text-blue" />
                </div>
              )}
            </div>
            
            <div className="mt-4 pl-1">
              <h3 className="font-bold text-blue text-lg group-hover:text-pink transition-colors">
                {board.title}
              </h3>
              <p className="text-teal font-medium">
                {board.pin_count} {board.pin_count === 1 ? 'pin' : 'pins'}
              </p>
            </div>
          </Link>

          <button 
            onClick={() => onDeleteBoard(board.id)}
            className="absolute top-3 left-3 p-2.5 rounded-xl
                     bg-pink text-white font-bold
                     border-2 border-blue shadow-[3px_3px_0px_0px_#125B9A]
                     hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A]
                     active:translate-y-0 active:shadow-none
                     transition-all duration-200"
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}