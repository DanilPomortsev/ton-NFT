import { useEffect, useMemo, useState } from 'react';

import { DebugEntry, isDebugEnabled, subscribeDebugEntries } from '@/shared/lib/debug';

const formatPayload = (payload: unknown): string => {
  if (payload === undefined) {
    return '';
  }

  if (typeof payload === 'string') {
    return payload;
  }

  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [entries, setEntries] = useState<DebugEntry[]>([]);

  useEffect(() => {
    if (!isDebugEnabled()) {
      return;
    }

    return subscribeDebugEntries(setEntries);
  }, []);

  const tail = useMemo(() => entries.slice(-40), [entries]);

  if (!isDebugEnabled()) {
    return null;
  }

  return (
    <div className="debug-panel">
      <button type="button" className="btn btn-secondary debug-toggle" onClick={() => setIsOpen((v) => !v)}>
        {isOpen ? 'Hide Debug' : 'Show Debug'} ({entries.length})
      </button>

      {isOpen ? (
        <div className="debug-body">
          {tail.map((entry) => (
            <div key={entry.id} className={`debug-line debug-${entry.level}`}>
              <div className="debug-meta">
                {entry.timestamp} [{entry.scope}] {entry.message}
              </div>
              {entry.payload !== undefined ? <pre>{formatPayload(entry.payload)}</pre> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};
