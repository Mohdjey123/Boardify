import Link from 'next/link';
import Navbar from '../components/Navbar';
import '../app/globals.css';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-peach/10">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-xl mx-auto">
          <div className="text-center bg-white rounded-2xl border-2 border-blue 
                         shadow-[8px_8px_0px_0px_#FFBE98] p-8 sm:p-12">
            {/* 404 Badge */}
            <div className="inline-block bg-peach/20 border-2 border-blue rounded-xl 
                          px-4 py-2 mb-6">
              <p className="font-black text-blue text-lg">404</p>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black text-blue mb-6">
              Oops! Page not found
            </h1>
            
            {/* Description */}
            <p className="text-lg font-bold text-teal mb-8">
              Sorry, we couldn't find the page you're looking for.
            </p>
            
            {/* Action Button */}
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-pink text-white font-bold rounded-xl
                        border-2 border-blue shadow-[4px_4px_0px_0px_#125B9A]
                        hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#125B9A]
                        active:translate-y-0 active:shadow-none
                        transition-all duration-200"
            >
              Go back home
            </Link>

            {/* Fun Illustration Container */}
            <div className="mt-12 relative">
              {/* Decorative circles in the background */}
              <div className="absolute inset-0 -m-8 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-peach/20 blur-xl"></div>
                <div className="w-40 h-40 rounded-full bg-pink/10 blur-xl -ml-10"></div>
              </div>
              
              {/* Illustration */}
              <div className="relative">
                <img
                  src="/404-illustration.png"
                  alt="Page not found illustration"
                  className="mx-auto h-64 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}