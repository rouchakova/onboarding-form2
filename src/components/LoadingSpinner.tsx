export const LoadingSpinner = () => (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
      <p className="text-gray-700">Saving...</p>
    </div>
  </div>
); 