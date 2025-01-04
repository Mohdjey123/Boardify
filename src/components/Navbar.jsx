import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase'; 

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Check the user's authentication status
  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(setUser);

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      router.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="glass-effect sticky top-0 z-50 py-4">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <div className="text-xl font-semibold">
          <Link href="/" className="text-primary hover:opacity-80 transition-opacity">
            Pinterest Clone
          </Link>
        </div>
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-gray-700 hover:text-primary transition-colors">Home</Link>
          <Link href="/create" className="text-gray-700 hover:text-primary transition-colors">Create Pin</Link>
          <Link href="/profile" className="text-gray-700 hover:text-primary transition-colors">Profile</Link>
          
          {user && (
            <Link 
              href="/discover" 
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Discover
            </Link>
          )}

          {user ? (
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-full transition-colors"
            >
              Logout
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="bg-primary text-white hover:bg-blue-600 py-2 px-4 rounded-full transition-colors"
              >
                Login
              </Link>
              <Link 
                href="/signup" 
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-full transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
