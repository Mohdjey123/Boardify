import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { getAuth } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Navbar from '../components/Navbar';

export default function CreatePin() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // To hold user state
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in when the component mounts
    const unsubscribe = getAuth().onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login'); // Redirect to login if the user is not authenticated
      } else {
        setUser(currentUser); // Set user if authenticated
      }
    });

    return () => unsubscribe(); // Clean up on component unmount
  }, [router]);

   const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
   
      try {
      const newPin = {
         title,
         description,
         image_url: imageUrl,
         username: user.displayName,
      };
   
      // Send data to the backend API to create a new pin
      await axios.post('http://localhost:5000/api/pins', newPin);
      router.push('/');
      } catch (error) {
      setError('Error creating pin. Please try again later.');
      console.error('Error creating pin:', error);
      }
   
      setLoading(false);
   };
 

  if (!user) {
    // If no user is logged in, do not allow form submission
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6 text-primary">Create a Pin</h1>
          <div className="text-red-500">
            You must be logged in to create a pin. Please log in first.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-primary">Create a Pin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold text-primary" htmlFor="title">
              Pin Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white"
              placeholder="Enter pin title"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-primary" htmlFor="description">
              Pin Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white"
              placeholder="Enter pin description"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-primary" htmlFor="imageUrl">
              Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full p-3 border rounded-lg bg-white"
              placeholder="Enter image URL"
              required
            />
          </div>

          {error && (
            <div className="text-secondary font-semibold mt-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full p-3 bg-primary text-white rounded-lg ${loading ? 'opacity-50' : ''}`}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Pin'}
          </button>
        </form>
      </div>
    </div>
  );
}
