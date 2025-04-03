import fetch from 'node-fetch';

let cachedStatus = null;
let lastFetch = 0;
const CACHE_DURATION = 10000; // 10 seconds cache

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

export default async function handler(req, res) {
    try {
        const status = await fetchDiscordStatus();
        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Discord status' });
    }
} 