import '@fontsource-variable/inter'
import '@fontsource/instrument-serif'
import '@fontsource/instrument-serif/400-italic.css'
import './index.css'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster, TooltipProvider } from './components/primitives'
import { router } from './router'
import { registerRomie } from './tokens/fonts'

registerRomie()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  </StrictMode>,
)
