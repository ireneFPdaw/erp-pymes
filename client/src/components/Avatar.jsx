// src/components/Avatar.jsx
import React, { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function Avatar({ id, nombres = '', apellidos = '', visible }) {
  const [error, setError] = useState(false);

  if (!visible) {
    // Fallback con iniciales si no hay foto
    const iniciales = `${(nombres[0] || '')}${(apellidos[0] || '')}`.toUpperCase();
    return (
      <div className="avatar fallback" aria-hidden>
        {iniciales || '👤'}
      </div>
    );
  }

  const src = `${API}/api/empleados/${id}/foto`;

  return error ? (
    <div className="avatar fallback" aria-hidden>
      {`${(nombres[0] || '')}${(apellidos[0] || '')}`.toUpperCase() || '👤'}
    </div>
  ) : (
    <img
      className="avatar"
      src={src}
      alt={`${nombres} ${apellidos}`}
      onError={() => setError(true)}
      loading="lazy"
      width={40}
      height={40}
    />
  );
}
