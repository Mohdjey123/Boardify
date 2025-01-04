import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Login() {
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

  // Handle email/password login
  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/'); // Redirect to homepage after successful login
    } catch (err) {
      setError(err.message); // Display Firebase error message
      console.error(err.message);
    }
    setLoading(false);
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/'); // Redirect to homepage after successful login
    } catch (err) {
      setError('Error logging in with Google');
      console.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-sm mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-primary mb-6">Login</h1>
        
        <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
          <div>
            <label className="block font-semibold" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block font-semibold" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className={`w-full p-3 bg-primary text-white rounded-lg ${loading ? 'opacity-50' : ''}`}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login with Email'}
          </button>
        </form>

        <div className="my-4 flex items-center justify-between">
          <hr className="w-full" />
          <span className="mx-4 text-gray-600">or</span>
          <hr className="w-full" />
        </div>

        <button
          onClick={handleGoogleLogin}
          className={`w-full p-3 bg-red-600 text-white rounded-lg mb-4 ${loading ? 'opacity-50' : ''}`}
          disabled={loading}
        >
          {loading ? 'Signing in with Google...' : 'Login with Google'}
        </button>

        <div className="text-center mt-6">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
