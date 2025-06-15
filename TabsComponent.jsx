import React, { useState } from "react";


export const Tab = ({ children }) => <div>{children}</div>;

export const Tabs = ({ children, defaultTab }) => {
  const [active, setActive] = useState(defaultTab);
  const tabs = React.Children.toArray(children).filter(child => child.type === Tab);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.props.label}
            onClick={() => setActive(tab.props.label)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              active === tab.props.label
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (tab.props.label === active ? tab : null))}
    </div>
  );
};
