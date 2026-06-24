import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Intercept fetch requests to Hugging Face spaces to override credentials mode
// This prevents CORS preflight errors caused by `credentials: "include"`
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : (input && typeof input === 'object' && 'url' in input)
        ? (input as any).url
        : '';

  if (url && (url.includes('hf.space') || url.includes('huggingface.co'))) {
    const hasCredentialsInclude = (init && init.credentials === 'include') || 
      (input && typeof input === 'object' && 'credentials' in input && (input as any).credentials === 'include');
      
    if (hasCredentialsInclude) {
      init = { ...init, credentials: 'same-origin' };
    }
  }
  return originalFetch.call(this, input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
