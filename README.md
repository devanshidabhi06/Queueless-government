# QueueLess Government Office

A smart, virtual token system with live ETAs and simulated WhatsApp/SMS reminders designed to reduce physical waiting times at government offices.

> **Note:** This is a frontend prototype built for a hackathon. Data is simulated in-memory and there is no real government integration.

## Features

- **Citizen Portal**: Users can request a virtual token remotely or on-site, check live token status, and see their estimated wait time.
- **Officer Dashboard**: Admins can view the active queues across multiple offices, call the next token, and mark them as served.
- **Live Display Board**: A simulated large-screen view to show the live status of the queue.
- **Multilingual Support**: Supports 22+ languages with built-in translations for core terms.

## Repository Structure

- `client/` - The core application codebase.
  - `index.html` - The main entry point (V2 frontend).
  - `assets/`
    - `engine.js` - The deterministic state engine simulating the backend.
    - `app_v2.js` - The frontend application logic mapping to the engine.

## Running Locally

Because this prototype is fully client-side and simulated using `engine.js`, you do not need to install any heavy dependencies.

1. Clone the repository.
2. Serve the `client/` directory using any static file server.
   
   Using Python:
   ```bash
   cd client
   python -m http.server 3000
   ```
   
   Using Node.js:
   ```bash
   npx serve client
   ```
3. Open `http://localhost:3000` in your browser.

## Deployment

This repository is ready to be deployed to GitHub Pages, Vercel, or Netlify right out of the box. Simply point the deployment root to the `client/` folder.
