import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import '../app/globals.css';
import api from '../lib/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Close search results when clicking outside
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);

    if (value.length > 1) {
      setIsSearching(true);
      try {
        const response = await api.get(`/api/search/users?query=${value}`);
        setResults(response.data);
      } catch (error) {
        console.error('Error searching:', error);
        setResults([]);
      }
      setIsSearching(false);
    } else {
      setResults([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowResults(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onKeyPress={handleKeyPress}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full focus:bg-white focus:border-gray-300 focus:ring-0 transition-colors"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (query.length > 1) && (
        <div className="absolute mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {isSearching ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div>
              {results.map((user) => (
                <Link
                  key={user.username}
                  href={`/profile/${user.username}`}
                  onClick={() => setShowResults(false)}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{user.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length > 1 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 