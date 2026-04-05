'use client';

import { useState, useEffect } from 'react';
import { saveGame, loadGame, listSaves, deleteSave } from '@/lib/saveLoad';

export function SaveLoadPanel() {
  const [saves, setSaves] = useState<Array<{ name: string; savedAt: string }>>([]);
  const [newSlotName, setNewSlotName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSaves(listSaves());
  }, []);

  const handleSave = () => {
    const name = newSlotName.trim() || `save-${Date.now()}`;
    saveGame(name);
    setNewSlotName('');
    setSaves(listSaves());
    showMessage(`Saved: ${name}`);
  };

  const handleLoad = (name: string) => {
    const success = loadGame(name);
    showMessage(success ? `Loaded: ${name}` : 'Failed to load');
  };

  const handleDelete = (name: string) => {
    deleteSave(name);
    setSaves(listSaves());
    showMessage(`Deleted: ${name}`);
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="p-3 space-y-3">
      <h4 className="text-xs font-bold text-[var(--color-text-dim)] uppercase">Save / Load</h4>

      {message && (
        <div className="text-xs p-1.5 bg-[var(--color-accent-soft)] rounded">{message}</div>
      )}

      <div className="flex gap-2">
        <input
          value={newSlotName}
          onChange={(e) => setNewSlotName(e.target.value)}
          placeholder="Save name..."
          className="flex-1 text-xs bg-[var(--color-bg)] px-2 py-1 rounded border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        <button
          onClick={handleSave}
          className="text-xs px-3 py-1 bg-[var(--color-success)] text-black rounded hover:opacity-90"
        >
          Save
        </button>
      </div>

      <div className="space-y-1.5">
        {saves.length === 0 && (
          <p className="text-xs text-[var(--color-text-dim)]">No saves yet</p>
        )}
        {saves.map((s) => (
          <div
            key={s.name}
            className="flex items-center justify-between p-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-border)]"
          >
            <div className="text-xs">
              <div className="font-bold">{s.name}</div>
              <div className="text-[var(--color-text-dim)]">
                {new Date(s.savedAt).toLocaleString()}
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => handleLoad(s.name)}
                className="text-[10px] px-2 py-0.5 bg-[var(--color-accent)] text-white rounded hover:opacity-90"
              >
                Load
              </button>
              <button
                onClick={() => handleDelete(s.name)}
                className="text-[10px] px-2 py-0.5 bg-[var(--color-danger)] text-white rounded hover:opacity-90"
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
