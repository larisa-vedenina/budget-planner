import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ChecklistPage from '../pages/ChecklistPage';
import FontTest from '../components/FontTest';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ChecklistPage />} />
      <Route path="/form" element={<div>Форма (скоро)</div>} />
      <Route path="/start" element={<div>Стартовая страница (скоро)</div>} />
      <Route path="/archive" element={<div>Архив (скоро)</div>} />
      <Route path="/font-test" element={<FontTest />} />
    </Routes>
  );
};

export default AppRoutes;