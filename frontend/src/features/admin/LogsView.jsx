"use client"

export default function LogsView({ logs, onClear }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">System Logs</h2>
        <button onClick={onClear} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
          Clear Logs
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto bg-gray-50 rounded p-4 font-mono text-sm">
        {logs?.length > 0 ? (
          logs.map((log, index) => (
            <div
              key={index}
              className={`py-1 ${
                log.level === "error" ? "text-red-600" : log.level === "warn" ? "text-yellow-600" : "text-green-600"
              }`}
            >
              <span className="text-gray-500">[{log.level.toUpperCase()}]</span> {log.message}
            </div>
          ))
        ) : (
          <p className="text-gray-400">No logs available</p>
        )}
      </div>
    </div>
  )
}
