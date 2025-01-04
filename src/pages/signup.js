import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getAuth, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Navbar from '../components/Navbar';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      if (user) {
        router.push('/'); // Redirect to home if already logged in
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, [router]);

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // After successful signup, redirect to login page
      router.push('/login');
    } catch (err) {
      setError(err.message);
      console.error(err.message);
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err) {
      setError('Error signing up with Google');
      console.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-primary mb-8 text-center">Sign Up</h1>
        
        <form onSubmit={handleEmailSignup} className="space-y-6">
          <div>
            <label className="block text-lg font-medium mb-2" htmlFor="name">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Create a password"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full p-4 bg-primary text-white rounded-xl font-medium text-lg hover:bg-primary/90 transform hover:scale-[0.99] transition-all duration-200"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="my-8 flex items-center justify-between">
          <hr className="w-full border-gray-200" />
          <span className="px-4 text-gray-500 text-sm">or</span>
          <hr className="w-full border-gray-200" />
        </div>

        <button
          onClick={handleGoogleSignup}
          className="w-full p-4 bg-red-500 text-white rounded-xl font-medium text-lg hover:bg-red-600 transform hover:scale-[0.99] transition-all duration-200"
          disabled={loading}
        >
          {loading ? 'Signing up...' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
} 