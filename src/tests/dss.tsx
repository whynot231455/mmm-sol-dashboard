import React, { useState } from 'react';
import axios from 'axios';

const FileUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file first.');
      return;
    }

    setLoading(true);
    setStatus('Uploading to Dataiku through proxy...');

    try {
      // Read file as text
      const csvContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (result) resolve(result as string);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsText(file);
      });

      // ✅ Use VITE_AGENT_BACKEND_URL — this goes to your backend proxy
      // Your backend then forwards to Dataiku at localhost:11200
      const backendUrl = import.meta.env.VITE_AGENT_BACKEND_URL;

      if (!backendUrl) {
        setStatus('❌ VITE_AGENT_BACKEND_URL is not set in .env');
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/dataiku/upload?fileName=${encodeURIComponent(file.name)}`,
        csvContent,
        {
          headers: {
            'Content-Type': 'text/csv',
          },
        }
      );

      console.log('Upload response:', response.data);
      setStatus(`✅ "${file.name}" uploaded successfully to Dataiku!`);

    } catch (err: any) {
      const errorMessage = err.response?.data?.details || err.message;
      setStatus(`❌ Upload failed: ${typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage}`);
    } finally {
      setLoading(false); // ✅ Always runs
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dataiku Proxy Upload Test</h2>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ marginBottom: '1rem' }}
      />

      {file && (
        <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
          Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        style={{
          backgroundColor: '#4f46e5',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: (loading || !file) ? 'not-allowed' : 'pointer',
          opacity: (loading || !file) ? 0.7 : 1,
          border: 'none',
          marginTop: '1rem',
        }}
      >
        {loading ? 'Uploading...' : 'Upload via Dashboard Proxy'}
      </button>

      {status && (
        <div style={{
          marginTop: '1rem',
          padding: '8px',
          borderRadius: '6px',
          fontSize: '0.875rem',
          backgroundColor: status.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
          color: status.startsWith('✅') ? '#166534' : '#991b1b',
          border: '1px solid currentColor',
        }}>
          {status}
        </div>
      )}
    </div>
  );
};

export default FileUploader;