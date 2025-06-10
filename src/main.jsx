import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TimeTracker from './TimeTracker.tsx'
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TimeTracker />
  </StrictMode>,
)
