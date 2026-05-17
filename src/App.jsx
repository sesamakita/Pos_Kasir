import React from 'react';
import InventoryScreen from './screens/InventoryScreen';

export default function App() {
  return (
    <div className="app-layout">
      {/* Jika ada router, taruh di sini. Untuk demo langsung ke InventoryScreen */}
      <InventoryScreen />
    </div>
  );
}
