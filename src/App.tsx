import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { getTelegramUserId } from './telegram';
import { Layout } from './components/Layout';
import { BottomNav } from './components/BottomNav';
import { PageLoader } from './components/PageLoader';
import './App.css';

import { Home } from './pages/Home';
import { ModuleDetail } from './pages/ModuleDetail';
import { FlashCards } from './pages/FlashCards';

const Trainer = lazy(() => import('./pages/Trainer').then((m) => ({ default: m.Trainer })));
const Builder = lazy(() => import('./pages/Builder').then((m) => ({ default: m.Builder })));
const Listen = lazy(() => import('./pages/Listen').then((m) => ({ default: m.Listen })));
const Pronounce = lazy(() => import('./pages/Pronounce').then((m) => ({ default: m.Pronounce })));
const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })));
const Topics = lazy(() => import('./pages/Topics').then((m) => ({ default: m.Topics })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })));
const Privacy = lazy(() => import('./pages/Privacy').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Terms').then((m) => ({ default: m.Terms })));
const Search = lazy(() => import('./pages/Search').then((m) => ({ default: m.Search })));

function TelegramSync() {
  const { setTelegramId } = useApp();
  useEffect(() => {
    setTelegramId(getTelegramUserId());
  }, [setTelegramId]);
  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/module/:moduleId" element={<Layout><ModuleDetail /></Layout>} />
        <Route path="/module/:moduleId/flash" element={<Layout><FlashCards /></Layout>} />
        <Route path="/module/:moduleId/trainer" element={<Layout><Trainer /></Layout>} />
        <Route path="/module/:moduleId/builder" element={<Layout><Builder /></Layout>} />
        <Route path="/module/:moduleId/listen" element={<Layout><Listen /></Layout>} />
        <Route path="/module/:moduleId/pronounce" element={<Layout><Pronounce /></Layout>} />
        <Route path="/topics" element={<Layout><Topics /></Layout>} />
        <Route path="/search" element={<Layout><Search /></Layout>} />
        <Route path="/stats" element={<Layout><Stats /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
        <Route path="/terms" element={<Layout><Terms /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <div className="app">
      <AppProvider>
        <TelegramSync />
        <BrowserRouter>
          <AppRoutes />
          <BottomNav />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}
