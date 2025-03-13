import admin from "firebase-admin";

// Ensure Firebase is initialized only once
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("🔥 Firebase Initialization Error:", error);
    }
}

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            return res.status(200).end(); // Preflight request response
        }

        if (req.method === "GET") {
            const snapshot = await db.collection("comments").orderBy("createdAt", "desc").get();
            const comments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
            }));
            return res.status(200).json({ comments });
        } 
        
        if (req.method === "POST") {
            const { text, user } = req.body;

            if (!text || !user) {
                return res.status(400).json({ error: "❌ Missing required fields" });
            }

            const newComment = await db.collection("comments").add({
                text,
                user,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return res.status(201).json({ message: "✅ Comment Added", id: newComment.id });
        } 
        
        return res.status(405).json({ error: "🚫 Method Not Allowed" });

    } catch (error) {
        console.error("🔥 Firebase Error:", error);
        return res.status(500).json({ error: "🔥 Internal Server Error" });
    }
}
