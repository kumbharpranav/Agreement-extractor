import React, { useState } from 'react';

function App() {
  const [excelData, setExcelData] = useState('');
  const [fields, setFields] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [extractedTableData, setExtractedTableData] = useState([]);
  const [downloadLink, setDownloadLink] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleExcelDataChange = (e) => {
    setExcelData(e.target.value);
  };

  const parseExcelData = () => {
    const lines = excelData.trim().split('\n');
    if (lines.length > 0) {
      const header = lines[0].split('\t').map(h => h.trim()); // Assuming tab-separated for pasted Excel
      setFields(header);
      setStep(2);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleExtractData = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append('fields', JSON.stringify(fields));
    images.forEach(image => formData.append('images', image));

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadLink(url);

      // For displaying in HTML table (assuming backend sends JSON for table display)
      // This part needs backend modification to send JSON for display alongside Excel
      // For now, we'll just show the download link.
      setExtractedTableData([]); // Clear previous table data

      setStep(4);
    } catch (error) {
      console.error('Extraction failed:', error);
      alert('Failed to extract data. Please check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="p-8 bg-gray-800 bg-opacity-75 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Step 1: Paste Excel Data</h2>
            <textarea
              className="w-full h-48 p-2 rounded bg-gray-700 text-white mb-4"
              placeholder="Paste your Excel data here. The first row will be used as field names."
              value={excelData}
              onChange={handleExcelDataChange}
            ></textarea>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={parseExcelData}
              disabled={!excelData.trim()}
            >
              Next: Confirm Fields
            </button>
          </div>
        );
      case 2:
        return (
          <div className="p-8 bg-gray-800 bg-opacity-75 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Step 2: Confirm Fields</h2>
            <p className="mb-4">The following fields were extracted from your data:</p>
            <div className="flex flex-wrap justify-center mb-4">
              {fields.map((field, index) => (
                <span key={index} className="bg-blue-500 text-white px-3 py-1 rounded-full m-1">
                  {field}
                </span>
              ))}
            </div>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={() => setStep(3)}
            >
              Next: Upload Images
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setStep(1)}
            >
              Back
            </button>
          </div>
        );
      case 3:
        return (
          <div className="p-8 bg-gray-800 bg-opacity-75 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Step 3: Upload Images</h2>
            <input
              type="file"
              multiple
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              onChange={handleImageChange}
            />
            <div className="flex flex-wrap justify-center mb-4">
              {imagePreviews.map((src, index) => (
                <img key={index} src={src} alt="preview" className="w-24 h-24 object-cover m-2 rounded" />
              ))}
            </div>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={handleExtractData}
              disabled={images.length === 0 || loading}
            >
              {loading ? 'Extracting...' : 'Extract Data'}
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setStep(2)}
            >
              Back
            </button>
          </div>
        );
      case 4:
        return (
          <div className="p-8 bg-gray-800 bg-opacity-75 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Extraction Complete!</h2>
            {downloadLink ? (
              <a
                href={downloadLink}
                download="extracted_data.xlsx"
                className="text-blue-400 hover:underline text-lg"
              >
                Download Excel File
              </a>
            ) : (
              <p>Error: No download link available.</p>
            )}
            {extractedTableData.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full bg-gray-700 rounded-lg">
                  <thead>
                    <tr>
                      {fields.map((field, index) => (
                        <th key={index} className="py-2 px-4 border-b border-gray-600 text-left">
                          {field}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedTableData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {fields.map((field, colIndex) => (
                          <td key={colIndex} className="py-2 px-4 border-b border-gray-600 text-left">
                            {row[field]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                setStep(1);
                setExcelData('');
                setFields([]);
                setImages([]);
                setImagePreviews([]);
                setExtractedTableData([]);
                setDownloadLink('');
              }}
            >
              Start Over
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      {renderStep()}
    </div>
  );
}

export default App;