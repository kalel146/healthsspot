import { useState } from "react";

const CollapsibleSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="border border-yellow-300 rounded bg-yellow-50 dark:bg-gray-800 p-4 mb-4">
      <header className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{title}</h2>
        <span className="text-2xl">
          {isOpen ? "🔽" : "▶️"}
        </span>
      </header>
      {isOpen && <div className="mt-4">{children}</div>}
    </section>
  );
};

export default CollapsibleSection;
