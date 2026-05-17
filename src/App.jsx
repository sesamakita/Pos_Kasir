import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import InventoryScreen from './screens/InventoryScreen';

export default function App() {
  return (
    <div className="app-layout">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/inventory" element={<InventoryScreen />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
