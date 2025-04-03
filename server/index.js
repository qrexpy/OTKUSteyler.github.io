import express from 'express';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

app.use(express.static('public'));
app.use(express.json());

let cachedStatus = null;
let lastFetch = 0;
const CACHE_DURATION = 10000;

async function fetchDiscordStatus() {
    const now = Date.now();
    if (cachedStatus && now - lastFetch < CACHE_DURATION) {
        return cachedStatus;
    }

    try {
        const response = await fetch('https://api.lanyard.rest/v1/users/554071670143451176');
        if (!response.ok) throw new Error('Failed to fetch status');
        
        const data = await response.json();
        if (!data.success) throw new Error('Invalid response');

        cachedStatus = data;
        lastFetch = now;
        return data;
    } catch (error) {
        console.error('Error fetching Discord status:', error);
        throw error;
    }
}

app.get('/api/status', async (req, res) => {
    try {
        const status = await fetchDiscordStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Discord status' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 