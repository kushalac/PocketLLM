"use client"

export default function MetricsChart({ metrics, onReset }) {
  const maxTime = Math.max(...(metrics?.responseTimes || [1]), 1000)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Response Times</h2>
        <button onClick={onReset} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
          Reset
        </button>
      </div>

      <div className="flex items-end justify-between h-48 gap-1">
        {metrics?.responseTimes?.slice(-50).map((time, index) => (
          <div
            key={index}
            className="flex-1 bg-blue-600 rounded-t"
            style={{ height: `${(time / maxTime) * 100}%` }}
            title={`${time}ms`}
          />
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Avg Response Time: {metrics?.averageResponseTime?.toFixed(0)}ms</p>
      </div>
    </div>
  )
}
