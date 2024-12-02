import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

interface Suggestion {
  suggestion: string;
  type: 'product' | 'history';
  count?: number;
}

interface SearchBoxProps {
  onSearch: (term: string) => void;
  initialValue?: string;
}

export default function SearchBox({ onSearch, initialValue = '' }: SearchBoxProps) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: suggestions } = useQuery<{ products: Suggestion[]; popular: Suggestion[] }>({
    queryKey: ['search-suggestions', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return { products: [], popular: [] };
      const response = await fetch(
        `http://localhost:8787/api/search/suggestions?q=${encodeURIComponent(searchTerm)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: searchTerm.length > 0,
  });

  const { data: searchHistory } = useQuery<{ keyword: string; last_searched: string }[]>({
    queryKey: ['search-history'],
    queryFn: async () => {
      const response = await fetch('http://localhost:8787/api/search/history', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch search history');
      return response.json();
    },
  });

  const saveSearchMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await fetch('http://localhost:8787/api/search/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ keyword }),
      });
      if (!response.ok) throw new Error('Failed to save search');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['search-history']);
    },
  });

  const deleteHistoryMutation = useMutation({
    mutationFn: async (keyword: string) => {
      const response = await fetch(
        `http://localhost:8787/api/search/history/${encodeURIComponent(keyword)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to delete history');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['search-history']);
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch(term);
    setShowSuggestions(false);
    saveSearchMutation.mutate(term);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      handleSearch(searchTerm);
    }
  };

  return (
    <div ref={searchBoxRef} className="relative w-full">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyPress={handleKeyPress}
          className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="搜索产品..."
        />
      </div>

      {showSuggestions && (searchTerm || (searchHistory && searchHistory.length > 0)) && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <div className="py-1">
            {searchTerm && suggestions?.products.map((suggestion, index) => (
              <button
                key={`product-${index}`}
                onClick={() => handleSearch(suggestion.suggestion)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                <MagnifyingGlassIcon className="mr-2 inline-block h-4 w-4 text-gray-400" />
                {suggestion.suggestion}
              </button>
            ))}

            {searchTerm && suggestions?.popular.map((suggestion, index) => (
              <button
                key={`popular-${index}`}
                onClick={() => handleSearch(suggestion.suggestion)}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
              >
                <span className="text-gray-500">热门：</span>
                {suggestion.suggestion}
                <span className="ml-2 text-xs text-gray-400">
                  {suggestion.count}次搜索
                </span>
              </button>
            ))}

            {!searchTerm && searchHistory?.map((item, index) => (
              <div
                key={`history-${index}`}
                className="flex items-center justify-between px-4 py-2 hover:bg-gray-100"
              >
                <button
                  onClick={() => handleSearch(item.keyword)}
                  className="flex items-center text-left text-sm"
                >
                  <ClockIcon className="mr-2 h-4 w-4 text-gray-400" />
                  {item.keyword}
                </button>
                <button
                  onClick={() => deleteHistoryMutation.mutate(item.keyword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 