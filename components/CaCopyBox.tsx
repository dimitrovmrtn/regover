
import React, { useState } from 'react';

interface CaCopyBoxProps {
  address: string;
}

const CaCopyBox: React.FC<CaCopyBoxProps> = ({ address }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  };

  return (
  <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-xl mx-auto text-center mt-8 shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Contract Address</h3>
      <div className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-100">
        <code className="text-green-700 text-sm md:text-base whitespace-nowrap mr-4">{address}</code>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 w-24 flex-shrink-0 ${
            isCopied
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
};

export default CaCopyBox;
