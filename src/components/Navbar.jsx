import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { 
  Bars3Icon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline';
import { auth } from '../lib/firebase';
import '../app/globals.css';
import axios from 'axios';
import { debounce } from 'lodash';

const NavLink = ({ href, children, onClick }) => {
  const router = useRouter();
  const isActive = router.pathname === href;
  
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        px-4 py-2 rounded-xl text-base font-bold transition-all
        ${isActive 
          ? 'bg-peach text-blue border-2 border-blue shadow-[4px_4px_0px_0px_#125B9A]' 
          : 'text-blue hover:bg-peach/20 hover:-translate-y-1'
        }
      `}
    >
      {children}
    </Link>
  );
};

export default function Navbar({ title }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleSearchInput = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length >= 2) {
      setIsSearching(true);
      try {
        const response = await axios.get(`http://10.0.0.23:5000/api/pins?search=${encodeURIComponent(query)}`);
        
        const filteredResults = response.data
          .map(pin => {
            const titleMatch = pin.title.toLowerCase().includes(query.toLowerCase());
            const descMatch = pin.description?.toLowerCase().includes(query.toLowerCase());
            const usernameMatch = pin.username.toLowerCase().includes(query.toLowerCase());
            
            let score = 0;
            if (titleMatch) score += 3;
            if (descMatch) score += 1;
            if (usernameMatch) score += 2;
            
            return { ...pin, score };
          })
          .filter(pin => pin.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        setSearchResults(filteredResults);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => handleSearchInput(query), 300),
    []
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.search-container')) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b-3 border-blue sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-peach/20 rounded-xl border-2 border-transparent hover:border-blue transition-all"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-4 h-4 text-blue" />
              ) : (
                <Bars3Icon className="w-4 h-4 text-blue" />
              )}
            </button>
            
            <Link href="/" className="text-2xl font-black text-pink hover:-translate-y-1 transition-transform">
                Boardify
            </Link>
          </div>

          {/* Center: Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink href="/">Discover</NavLink>
            {user && <NavLink href="/feed">Following</NavLink>}
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4 relative search-container">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4text-blue" />
              <input
                type="search"
                placeholder="Search pins, people, or boards"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debouncedSearch(e);
                }}
                onFocus={() => setShowResults(true)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border-2 border-blue 
                          focus:ring-4 focus:ring-peach/30 focus:border-pink transition-all
                          placeholder:text-blue/50"
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-blue 
                            shadow-[6px_6px_0px_0px_#FFBE98] max-h-[60vh] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-blue">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((pin) => (
                      <Link
                        key={pin.id}
                        href={`/pin/${pin.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-peach/10 group"
                        onClick={() => {
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                      >
                        {pin.image_url && (
                          <img
                            src={pin.image_url}
                            alt=""
                            className="w-12 h-12 object-cover rounded-xl border-2 border-blue"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-blue truncate group-hover:text-pink">
                            {pin.title}
                          </h3>
                          <p className="text-sm text-teal truncate">
                            by {pin.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                    
                    {searchResults.length === 5 && (
                      <Link
                        href={`/search?q=${encodeURIComponent(searchQuery)}`}
                        className="block px-4 py-3 text-sm font-bold text-pink hover:bg-peach/10 text-center border-t-2 border-blue"
                        onClick={() => setShowResults(false)}
                      >
                        View all results
                      </Link>
                    )}
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="p-4 text-center text-blue">
                    No results found
                  </div>
                ) : (
                  <div className="p-4 text-center text-blue">
                    Type at least 2 characters to search
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: User Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/create"
                  className="px-6 py-2 bg-pink text-white font-bold rounded-xl border-2 border-blue 
                            hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A] transition-all"
                >
                  Create Post
                </Link>
                
                <Link
                  href={`/profile/${user.displayName}`}
                  className="p-2 hover:bg-peach/20 rounded-xl border-2 border-transparent 
                            hover:border-blue hover:-translate-y-1 transition-all"
                >
                  <UserCircleIcon className="w-4 h-4 text-blue" />
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-blue font-bold hover:bg-peach/20 rounded-xl 
                            border-2 border-transparent hover:border-blue hover:-translate-y-1 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-blue font-bold hover:bg-peach/20 rounded-xl 
                            border-2 border-transparent hover:border-blue hover:-translate-y-1 transition-all"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2 bg-pink text-white font-bold rounded-xl border-2 border-blue 
                            hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#125B9A] transition-all"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t-2 border-blue bg-white">
          <div className="p-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearchInput} className="mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4text-blue" />
                <input
                  type="search"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border-2 border-blue 
                            focus:ring-4 focus:ring-peach/30 focus:border-pink transition-all
                            placeholder:text-blue/50"
                />
              </div>
            </form>

            {/* Mobile Navigation */}
            <div className="flex flex-col gap-2">
              <NavLink href="/" onClick={() => setIsMenuOpen(false)}>
                Discover
              </NavLink>
              
              {user && (
                <NavLink href="/feed" onClick={() => setIsMenuOpen(false)}>
                  Following
                </NavLink>
              )}

              {user ? (
                <>
                  <NavLink href="/create" onClick={() => setIsMenuOpen(false)}>
                    Create
                  </NavLink>
                  <NavLink href={`/profile/${user.displayName}`} onClick={() => setIsMenuOpen(false)}>
                    Profile
                  </NavLink>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 text-blue font-bold hover:bg-peach/20 rounded-xl 
                              border-2 border-transparent hover:border-blue text-left transition-all"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink href="/login" onClick={() => setIsMenuOpen(false)}>
                    Log in
                  </NavLink>
                  <Link
                    href="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-6 py-2 bg-pink text-white font-bold rounded-xl border-2 border-blue 
                              hover:shadow-[4px_4px_0px_0px_#125B9A] text-center transition-all"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}