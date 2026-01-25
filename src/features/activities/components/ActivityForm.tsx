import { useMemo, useRef, useState } from 'react';
import { useCreateActivity } from '../hooks';
import { ACTIVITY_SUGGESTIONS } from '../types';
import { useRegisterCommand } from '@/features/command-palette';

type ActivityFormProps = {
  onCreated?: (id: string) => void;
};

export function ActivityForm({ onCreated }: ActivityFormProps) {
  const [name, setName] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const createActivity = useCreateActivity();
  const inputRef = useRef<HTMLInputElement>(null);

  const newActivityCommand = useMemo(
    () => ({
      id: 'activities.new',
      group: 'Actions',
      label: 'New Activity',
      run: () => inputRef.current?.focus(),
    }),
    []
  );

  useRegisterCommand(newActivityCommand);

  const filteredSuggestions = ACTIVITY_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(name.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createActivity.mutate(
      { name: name.trim() },
      {
        onSuccess: (activity) => {
          setName('');
          onCreated?.(activity.id);
        },
      }
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    setName(suggestion);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Enter activity name..."
          maxLength={255}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
        {showSuggestions && filteredSuggestions.length > 0 && name.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
            <div className="p-2 text-xs text-gray-500">Suggestions:</div>
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={!name.trim() || createActivity.isPending}
        className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {createActivity.isPending ? 'Creating...' : 'Create Activity'}
      </button>
    </form>
  );
}
