import React, { useState, useEffect } from 'react';

function App() {
  const [agreementTypes, setAgreementTypes] = useState({});
  const [selectedAgreementType, setSelectedAgreementType] = useState('');
  const [newAgreementTypeName, setNewAgreementTypeName] = useState('');
  const [newAgreementTypeFields, setNewAgreementTypeFields] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');

  useEffect(() => {
    fetchAgreementTypes();
  }, []);

  const fetchAgreementTypes = async () => {
    const response = await fetch('/api/agreement-types');
    const data = await response.json();
    setAgreementTypes(data);
    if (Object.keys(data).length > 0) {
      setSelectedAgreementType(Object.keys(data)[0]);
    }
  };

  const handleAddAgreementType = async () => {
    const fieldsArray = newAgreementTypeFields.split(',').map(s => s.trim());
    if (newAgreementTypeName && fieldsArray.length > 0) {
      await fetch('/api/agreement-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgreementTypeName, fields: fieldsArray })
      });
      fetchAgreementTypes();
      setNewAgreementTypeName('');
      setNewAgreementTypeFields('');
      setStep(1);
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
    formData.append('agreementType', selectedAgreementType);
    images.forEach(image => formData.append('images', image));

    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    });
    const blob = await response.blob();
    setDownloadLink(URL.createObjectURL(blob));
    setLoading(false);
    setStep(4);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="p-8 bg-gray-800 bg-opacity-75 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Select Agreement Type</h2>
            <select
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              value={selectedAgreementType}
              onChange={(e) => setSelectedAgreementType(e.target.value)}
            >
              {Object.keys(agreementTypes).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={() => setStep(2)}
            >
              Add New Type
            </button>
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => setStep(3)}
            >
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div className="p-8 bg-gray-800 bg-opacity-75 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Create New Agreement Type</h2>
            <input
              type="text"
              placeholder="Agreement Type Name"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              value={newAgreementTypeName}
              onChange={(e) => setNewAgreementTypeName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Fields (comma-separated)"
              className="w-full p-2 rounded bg-gray-700 text-white mb-4"
              value={newAgreementTypeFields}
              onChange={(e) => setNewAgreementTypeFields(e.target.value)}
            />
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={handleAddAgreementType}
            >
              Save
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
            <h2 className="text-2xl font-bold mb-4">Upload Images</h2>
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
              onClick={() => setStep(1)}
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
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                setStep(1);
                setImages([]);
                setImagePreviews([]);
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
    <div className="relative z-10 flex items-center justify-center min-h-screen">
      {renderStep()}
    </div>
  );
}

export default App;
