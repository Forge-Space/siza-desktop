import { useEffect, useState } from 'react';

export default function App() {
  const [ping, setPing] = useState('checking...');

  useEffect(() => {
    window.desktop
      .ping()
      .then(setPing)
      .catch(() => setPing('unavailable'));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Siza Desktop</h1>
      <p>Electron + React foundation is active.</p>
      <p>Main process ping: {ping}</p>
    </main>
  );
}
