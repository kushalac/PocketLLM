export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">PocketLLM Portal</h1>
          <p className="text-xl text-gray-600 mb-8">
            A production-ready full-stack chat application with LLM simulation, authentication, and admin dashboard
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-blue-600 mb-4">Features</h2>
              <ul className="space-y-2 text-gray-700">
                <li>✓ User authentication (Register/Login)</li>
                <li>✓ Real-time chat with streaming responses</li>
                <li>✓ Session management</li>
                <li>✓ Admin dashboard with metrics</li>
                <li>✓ LRU cache optimization</li>
                <li>✓ System logging</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-green-600 mb-4">Tech Stack</h2>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <strong>Frontend:</strong> React, Router, Axios, TailwindCSS
                </p>
                <p className="text-gray-700">
                  <strong>Backend:</strong> Node.js, Express, MongoDB (Mongoose)
                </p>
                <p className="text-gray-700">
                  <strong>Auth:</strong> JWT tokens
                </p>
                <p className="text-gray-700">
                  <strong>Deployment:</strong> Docker Compose
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Project Structure</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Backend</h3>
                <ul className="text-sm text-gray-600 space-y-1 font-mono">
                  <li>server.js - Express setup</li>
                  <li>db/connection.js - MongoDB connection (Mongoose)</li>
                  <li>routes/ - API endpoints</li>
                  <li>services/ - Business logic</li>
                  <li>controllers/ - Request handlers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Frontend</h3>
                <ul className="text-sm text-gray-600 space-y-1 font-mono">
                  <li>src/App.jsx - Main component</li>
                  <li>features/auth/ - Auth pages</li>
                  <li>features/chat/ - Chat UI</li>
                  <li>features/admin/ - Admin dashboard</li>
                  <li>core/ - Services</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Getting Started</h2>

            <div className="bg-gray-900 text-green-400 rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <p className="mb-2"># Using Docker Compose (Recommended)</p>
              <p className="text-blue-400">$ docker-compose up --build</p>
              <p className="mt-4 mb-2"># Frontend: http://localhost:3000</p>
              <p className="mb-4"># Backend: http://localhost:5000</p>

              <p className="mb-2 mt-6 border-t border-green-400 pt-4"># Local Development</p>
              <p className="text-blue-400">$ cd backend && npm install && npm run dev</p>
              <p className="text-blue-400">$ cd frontend && npm install && npm start</p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <h3 className="font-bold text-yellow-900 mb-2">Note</h3>
            <p className="text-yellow-800">
              This full-stack application requires running both frontend (React) and backend (Node.js) servers. The
              preview above shows the architecture and code structure. To run the complete application, download the
              code project and follow the setup instructions in the README.md file.
            </p>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-4">API Endpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-blue-600 mb-2">Auth</p>
                <p className="text-gray-700">POST /api/auth/register</p>
                <p className="text-gray-700">POST /api/auth/login</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">Chat</p>
                <p className="text-gray-700">POST /api/chat/start</p>
                <p className="text-gray-700">POST /api/chat/send</p>
                <p className="text-gray-700">GET /api/chat/sessions</p>
                <p className="text-gray-700">PATCH /api/chat/rename/:id</p>
                <p className="text-gray-700">DELETE /api/chat/session/:id</p>
              </div>
              <div>
                <p className="font-semibold text-blue-600 mb-2">Admin</p>
                <p className="text-gray-700">GET /api/admin/metrics</p>
                <p className="text-gray-700">GET /api/admin/logs</p>
                <p className="text-gray-700">GET /api/admin/cache</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center text-gray-600">
            <p className="mb-4">
              Check the code project files to view the complete implementation including Dockerfiles, tests, and
              documentation.
            </p>
            <p className="text-sm">PocketLLM Portal v1.0.0 - Ready for deployment</p>
          </div>
        </div>
      </div>
    </div>
  )
}
