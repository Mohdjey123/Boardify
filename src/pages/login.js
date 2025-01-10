import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import '../app/globals.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = getAuth().onAuthStateChanged((user) => {
      if (user) {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleEmailPasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err) {
      setError(err.message);
      console.error(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err) {
      setError('Error logging in with Google');
      console.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-peach/10">
      <Navbar title="Boardify" />
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border-2 border-blue shadow-[8px_8px_0px_0px_#FFBE98] p-8">
          <h1 className="text-4xl font-black text-blue mb-8 text-center">Welcome Back!</h1>
          
          <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
            <div>
              <label className="block font-bold text-blue mb-2" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-white border-2 border-blue rounded-xl
                          focus:border-pink focus:ring-4 focus:ring-peach/30
                          transition-all duration-200 placeholder:text-blue/50"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-blue mb-2" htmlFor="password">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-white border-2 border-blue rounded-xl
                          focus:border-pink focus:ring-4 focus:ring-peach/30
                          transition-all duration-200 placeholder:text-blue/50"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-pink/10 border-2 border-pink rounded-xl">
                <p className="text-pink font-medium text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              className={`w-full p-4 bg-pink text-white font-bold rounded-xl
                        border-2 border-blue shadow-[4px_4px_0px_0px_#125B9A]
                        hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#125B9A]
                        active:translate-y-0 active:shadow-none
                        transition-all duration-200
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login with Email'}
            </button>
          </form>

          <div className="my-8 flex items-center justify-between">
            <div className="flex-1 border-b-2 border-blue/20"></div>
            <span className="px-4 font-bold text-blue/60">or</span>
            <div className="flex-1 border-b-2 border-blue/20"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className={`w-full p-4 bg-teal text-white font-bold rounded-xl
                      border-2 border-blue shadow-[4px_4px_0px_0px_#125B9A]
                      hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#125B9A]
                      active:translate-y-0 active:shadow-none
                      transition-all duration-200 mb-8
                      ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={loading}
          >
            {loading ? 'Signing in with Google...' : 'Login with Google'}
          </button>

          <div className="text-center">
            <p className="text-blue">
              Don't have an account?{' '}
              <Link 
                href="/signup" 
                className="font-bold text-pink hover:-translate-y-1 hover:underline inline-block transition-transform"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}