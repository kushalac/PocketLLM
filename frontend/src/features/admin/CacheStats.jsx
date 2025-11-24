"use client"

export default function CacheStats({ stats, onClear }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Cache Statistics</h2>
        <button onClick={onClear} className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
          Clear
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700 font-medium">Cache Size</span>
            <span className="text-gray-600">
              {stats?.size || 0} / {stats?.maxSize || 100}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${((stats?.size || 0) / (stats?.maxSize || 100)) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">Cached Keys:</p>
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
            {stats?.keys?.length > 0 ? (
              stats.keys.map((key, index) => (
                <p key={index} className="text-xs truncate">
                  {key}
                </p>
              ))
            ) : (
              <p className="text-gray-400">No cached items</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
