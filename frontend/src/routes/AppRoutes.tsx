import { Routes, Route, Navigate } from "react-router-dom";
import { StartPage } from "../pages/StartPage/StartPage";
import FormPage from "../pages/FormPage/FormPage";
import { LoginPage } from "../pages/LoginPage/LoginPage";
import { ArchivePage } from "../pages/ArchivePage/ArchivePage";
import { MainPage } from "../pages/MainPage/MainPage";

export const AppRoutes = () => {
  return (
    <Routes>

      <Route path="/" element={<Navigate to="/start" replace />} />


      <Route path="/start" element={<StartPage />} />
      <Route path="/form" element={<FormPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/main" element={<MainPage />} />


      <Route path="*" element={<Navigate to="/start" replace />} />
    </Routes>
  );
};
