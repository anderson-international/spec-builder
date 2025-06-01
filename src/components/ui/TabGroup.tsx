import React from 'react';

export interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabGroupProps {
  tabs: Tab[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  activeTabId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-border ${className}`}>
      <nav className="flex -mb-px overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                py-4 px-1 mr-8 border-b-2 font-medium text-sm whitespace-nowrap
                flex items-center
                ${isActive
                  ? 'border-button-blue text-button-blue'
                  : 'border-transparent text-divider hover:text-text hover:border-border'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span 
                  className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    isActive ? 'bg-opacity-10 bg-button-blue text-button-blue' : 'bg-opacity-10 bg-border text-divider'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabGroup;
