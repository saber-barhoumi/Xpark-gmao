import './lib/axiosConfig'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { basePath } from './context/constants.ts'
import 'remixicon/fonts/remixicon.css'

// Register icon sets offline so Iconify never fetches from external CDN
import { addCollection } from '@iconify/react'
import riIcons from '@iconify-json/ri/icons.json'
import tablerIcons from '@iconify-json/tabler/icons.json'
import solarIcons from '@iconify-json/solar/icons.json'
import bxIcons from '@iconify-json/bx/icons.json'
import lineMdIcons from '@iconify-json/line-md/icons.json'

addCollection(riIcons)
addCollection(tablerIcons)
addCollection(solarIcons)
addCollection(bxIcons)
addCollection(lineMdIcons)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basePath}>
    <App />
    </BrowserRouter>
  </StrictMode>,
)
