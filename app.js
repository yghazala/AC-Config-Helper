const { ipcRenderer } = require('electron');

function App() {
  const [entryListPath, setEntryListPath] = React.useState('');
  const [modifyCmContent, setModifyCmContent] = React.useState(false);
  const [carCount, setCarCount] = React.useState(2);
  const [sortByAI, setSortByAI] = React.useState(true);
  const [result, setResult] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileSelect = async () => {
    const filePath = await ipcRenderer.invoke('select-file');
    if (filePath) {
      setEntryListPath(filePath);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const response = await ipcRenderer.invoke('process-car-config', entryListPath, modifyCmContent, carCount, sortByAI);
    setResult(response);
    setIsProcessing(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold mb-6 text-center">AC Config Helper</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="entryListPath" className="block text-gray-700 text-sm font-bold mb-2">
            Select entry_list.ini file:
          </label>
          <div className="flex">
            <input
              type="text"
              id="entryListPath"
              value={entryListPath}
              className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              readOnly
            />
            <button
              type="button"
              onClick={handleFileSelect}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r focus:outline-none focus:shadow-outline"
            >
              Browse
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="carCount" className="block text-gray-700 text-sm font-bold mb-2">
            Number of each car model:
          </label>
          <input
            type="number"
            id="carCount"
            value={carCount}
            onChange={(e) => setCarCount(parseInt(e.target.value))}
            min="1"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sortByAI}
              onChange={(e) => setSortByAI(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Sort by AI (fixed on top)</span>
          </label>
        </div>
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={modifyCmContent}
              onChange={(e) => setModifyCmContent(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Modify cm_content</span>
          </label>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              !entryListPath || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={!entryListPath || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process Config'}
          </button>
        </div>
      </form>
      {result && (
        <div className={`p-4 rounded ${result.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {result.error || result.success}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));

