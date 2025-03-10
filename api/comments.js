import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin once
if (!globalThis.firebase) {
    globalThis.firebase = initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
    });
}

const db = getFirestore();
const RATE_LIMIT_MS = 60 * 60 * 1000; // 1 hour in milliseconds

export default async function handler(req, res) {
    const userIp = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
    const hashedIp = Buffer.from(userIp).toString('base64');

    try {
        if (req.method === 'GET') {
            // Get comments and visitor count
            console.log('Received request:', req.method);
            const [commentsSnap, statsSnap] = await Promise.all([
                db.collection('comments').orderBy('timestamp', 'desc').get(),
                db.collection('stats').doc('visitor_count').get()
            ]);

            // Initialize visitor count if it doesn't exist
            if (!statsSnap.exists) {
                await db.collection('stats').doc('visitor_count').set({ count: 0 });
            }

            const visitorCount = statsSnap.exists ? statsSnap.data().count : 0;

            // Handle new visitor
            await handleNewVisitor(hashedIp);

            const comments = commentsSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate().toISOString()
            }));

            // Get rate limit status for this IP
            const rateLimitDoc = await db.collection('rateLimits').doc(hashedIp).get();
            const isRateLimited = rateLimitDoc.exists &&
                (Date.now() - rateLimitDoc.data().timestamp.toDate()) < RATE_LIMIT_MS;

            return res.status(200).json({
                comments,
                visitorCount,
                rateLimit: {
                    isLimited: isRateLimited,
                    remainingMinutes: isRateLimited ?
                        Math.ceil((RATE_LIMIT_MS - (Date.now() - rateLimitDoc.data().timestamp.toDate())) / 60000) : 0
                }
            });
        }

        if (req.method === 'POST') {
            console.log('Received request:', req.method);
            const { name, text } = req.body;

            if (!name?.trim() || !text?.trim()) {
                return res.status(400).json({ error: 'Name and text are required' });
            }

            // Check rate limit
            const rateLimitRef = db.collection('rateLimits').doc(hashedIp);
            const rateLimitDoc = await rateLimitRef.get();

            if (rateLimitDoc.exists) {
                const lastComment = rateLimitDoc.data().timestamp.toDate();
                const timeSinceLastComment = Date.now() - lastComment;
                if (timeSinceLastComment < RATE_LIMIT_MS) {
                    const remainingMinutes = Math.ceil((RATE_LIMIT_MS - timeSinceLastComment) / 60000);
                    return res.status(429).json({
                        error: 'Rate limit exceeded',
                        details: `Please wait ${remainingMinutes} minutes before posting again.`
                    });
                }
            }

            const newComment = {
                name: name.trim(),
                text: text.trim(),
                timestamp: new Date()
            };

            const docRef = await db.collection('comments').add(newComment);

            // Update rate limit
            await rateLimitRef.set({
                timestamp: new Date()
            });

            return res.status(200).json({
                comment: {
                    id: docRef.id,
                    ...newComment,
                    timestamp: newComment.timestamp.toISOString()
                },
                rateLimit: {
                    isLimited: true,
                    remainingMinutes: RATE_LIMIT_MS / 60000
                }
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Detailed API Error:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        });
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}

async function handleNewVisitor(hashedIp) {
    const ipRef = db.collection('visitor_ips').doc(hashedIp);
    const ipDoc = await ipRef.get();

    if (!ipDoc.exists) {
        await db.runTransaction(async (transaction) => {
            // Add hashed IP
            transaction.set(ipRef, { timestamp: new Date() });
            // Increment counter atomically
            transaction.update(db.collection('stats').doc('visitor_count'), {
                count: FieldValue.increment(1)
            }, { create: true }); // This will create the document if it doesn't exist
        });
    }
}
