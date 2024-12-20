import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import Dashboard from './components/dashboard-sample/index.tsx'
import { Toaster } from "@/components/ui/toaster"
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>

      <App />

    <Toaster />
  </StrictMode>,
)
