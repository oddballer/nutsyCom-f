import React from 'react';

function ImageApp({ initialImage }) {
  if (!initialImage) return null;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: 0, margin: 0 }}>
      <img
        src={initialImage}
        alt="Loaded"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', margin: 0, padding: 0, border: 'none', background: 'transparent' }}
      />
    </div>
  );
}

export default ImageApp; 