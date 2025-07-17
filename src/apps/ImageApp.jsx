import React, { useState, useRef } from 'react';
import { Button, TextInput } from 'react95';

function ImageApp({ initialImage }) {
  const [imageSrc, setImageSrc] = useState(initialImage || '');
  const [inputUrl, setInputUrl] = useState(initialImage || '');
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');

  const handleUrlChange = (e) => {
    setInputUrl(e.target.value);
    setError('');
  };

  const handleUrlLoad = () => {
    if (!inputUrl) return;
    setImageSrc(inputUrl);
    setError('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageSrc(ev.target.result);
        setError('');
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file.');
    }
  };

  return (
    <div style={{ padding: 16, width: 400, height: 350, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Image Viewer</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <TextInput
          value={inputUrl}
          onChange={handleUrlChange}
          placeholder="Paste image URL..."
          style={{ flex: 1 }}
        />
        <Button onClick={handleUrlLoad} disabled={!inputUrl}>Load URL</Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button onClick={() => fileInputRef.current.click()}>Choose File</Button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
      {error && <div style={{ color: 'red', fontSize: 12 }}>{error}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc', background: '#fafafa', minHeight: 150, minWidth: 150 }}>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt="Loaded"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 4 }}
            onError={() => setError('Failed to load image.')}
          />
        ) : (
          <span style={{ color: '#888' }}>No image loaded</span>
        )}
      </div>
    </div>
  );
}

export default ImageApp; 