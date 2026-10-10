import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Vite config — https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'resend-api',
      configureServer(server) {
        server.middlewares.use('/api/send-email', (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const apiKey = data.apiKey || process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'No Resend API key provided. Please provide apiKey in request or VITE_RESEND_API_KEY in .env.local' }));
                return;
              }
              const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${apiKey.trim()}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  from: data.from || 'onboarding@resend.dev',
                  to: Array.isArray(data.to) ? data.to : [data.to],
                  subject: data.subject,
                  html: data.html || `<p>${data.text || ''}</p>`
                })
              });
              const json = await response.json();
              res.statusCode = response.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(json));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '5173'),
  },
})
