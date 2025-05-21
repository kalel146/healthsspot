import React from "react";
import { useUser } from "@clerk/clerk-react";
import { motion } from "framer-motion";

export default function AdminPanel() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-red-500">Access Denied: Admins Only</h2>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen px-6 py-10 bg-black text-white"
    >
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">🔐 Admin Panel</h1>

      <div className="space-y-8">
        {/* Users Section */}
        <section>
          <h2 className="text-xl font-semibold mb-2">📋 Signed-up Users</h2>
          <div className="p-4 bg-gray-800 rounded shadow">
            <p className="text-sm text-gray-400">[Mock Data] User list loading...</p>
          </div>
        </section>

        {/* Logs Section */}
        <section>
          <h2 className="text-xl font-semibold mb-2">📊 Usage Logs</h2>
          <div className="p-4 bg-gray-800 rounded shadow">
            <p className="text-sm text-gray-400">[Mock Data] Log data loading...</p>
          </div>
        </section>

        {/* Errors Section */}
        <section>
          <h2 className="text-xl font-semibold mb-2">🚨 Error Reports</h2>
          <div className="p-4 bg-gray-800 rounded shadow">
            <p className="text-sm text-gray-400">[Mock Data] No critical errors reported.</p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
