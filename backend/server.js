import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import dns from 'dns';

// Fix for Node.js IPv6 DNS resolution issue (ECONNREFUSED)
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
