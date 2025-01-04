import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import axios from 'axios';
import { auth } from '../lib/firebase';
import Navbar from '../components/Navbar';
import PinCard from '../components/PinCard';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userPins, setUserPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        try {
          // Fetch user's pins
          const response = await axios.get(`http://localhost:5000/api/pins?username=${currentUser.displayName}`);
          setUserPins(response.data);
        } catch (err) {
          setError('Error fetching your pins');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="loading-gradient h-64 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-6">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl text-primary">
                  {user?.displayName?.[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">{user?.displayName}</h1>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* User's Gallery */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary mb-6 gradient-text">
            Your Gallery
          </h2>
          {error ? (
            <div className="text-center text-secondary">{error}</div>
          ) : userPins.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p className="mb-4">You haven't created any pins yet.</p>
              <button
                onClick={() => router.push('/create')}
                className="button-primary hover-lift"
              >
                Create Your First Pin
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {userPins.map((pin) => (
                <PinCard key={pin.id} pin={pin} />
              ))}
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Total Pins</h3>
            <p className="text-3xl font-bold text-primary">{userPins.length}</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Total Likes</h3>
            <p className="text-3xl font-bold text-secondary">
              {userPins.reduce((acc, pin) => acc + (pin.likes || 0), 0)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Total Views</h3>
            <p className="text-3xl font-bold text-accent">
              {userPins.reduce((acc, pin) => acc + (pin.views || 0), 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
