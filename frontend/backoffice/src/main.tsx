import './lib/axiosConfig'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { basePath } from './context/constants.ts'
// Remixicon will be loaded via CSS link in HTML or from scss if available
// import 'remixicon/fonts/remixicon.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basePath}>
    <App />
    </BrowserRouter>
  </StrictMode>,
)
