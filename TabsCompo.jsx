import { useState } from "react";

const TabsComponent = ({ tabs, activeTab = tabs[0] }) => {
  const [active, setActive] = useState(activeTab);

  return (
    <>
      <div className="flex gap-2 mb-4 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              active === tab
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="text-center text-gray-500 dark:text-gray-300">
        <p>Ενεργό Tab: <strong>{active}</strong></p>
      </div>
    </>
  );
};

export default TabsComponent;
