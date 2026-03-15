🛡️ CloudShield SaaS
Universal Edge Monitoring & Infrastructure Analytics
CloudShield is a full-stack Infrastructure-as-a-Service (IaaS) platform that allows any developer to monitor their website's health, global traffic, and bandwidth efficiency by simply adding a single <script> tag.

🚀 Key Features
Universal Integration: A drop-in <script> that works with React, Vue, WordPress, or plain HTML.

Real-time Telemetry: Tracks global hits, misses, and origin latency via a centralized Node.js collector.

Infrastructure Controls: Dynamic TTL (Time-To-Live) management and Global Cache Purging.

Health Sentinel: Automated incident logging for latency spikes and connection drops.

Visual Analytics: Interactive global traffic map, bandwidth savings counter (MB), and velocity charts.

SaaS Ready: GitHub OAuth authentication and public report sharing.

🛠️ The Tech Stack
Frontend: React, Tailwind CSS, Framer Motion (Animations), Recharts, Lucide Icons.

Backend: Node.js, Express, response-time middleware, Axios.

Database/Auth: Supabase (PostgreSQL & GitHub OAuth).

Deployment: Vercel (Frontend), Render (Backend).

📡 How It Works (Architecture)
CloudShield operates as a third-party monitoring layer between the end-user and the developer's origin server.

The Shield Script: When a visitor loads a "shielded" site, the script captures the client ID and origin metadata.

Telemetry Collection: Data is sent via a cross-origin (CORS) POST request to the CloudShield Backend.

Data Aggregation: The backend processes the hit, simulates cache logic, and updates the global traffic state.

Live Dashboard: The developer sees real-time updates on their private dashboard, including a health pulse and a global map of their traffic.

💻 Quick Start (For Developers)
1. Clone & Install
Bash
git clone https://github.com/your-username/cloudshield.git
cd cloudshield

# Install Backend
cd backend && npm install

# Install Frontend
cd ../frontend && npm install
2. Environment Variables
Create a .env in the backend folder:

Plaintext
PORT=5000
BACKEND_URL=https://your-render-app.com
DISCORD_WEBHOOK_URL=your_optional_webhook
Create a .env in the frontend folder:

Plaintext
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
REACT_APP_API_URL=https://your-render-app.com
3. Run Locally
Bash
# In /backend
npm start

# In /frontend
npm start
🛡️ Integrating with your Website
Simply paste this snippet into the <head> of your site:

HTML
<script 
  src="https://cloudshield-backend.onrender.com/shield.js" 
  data-client-id="YOUR_UNIQUE_ID" 
  async>
</script>

📄 License
Distributed under the MIT License. See LICENSE for more information.