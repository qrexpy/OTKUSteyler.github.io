import admin from "firebase-admin";

// Ensure Firebase is initialized only once
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
}

const db = admin.firestore();

export default async function handler(req, res) {
    try {
        if (req.method === "GET") {
            const snapshot = await db.collection("comments").get();
            const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return res.status(200).json(comments);
        } 
        
        else if (req.method === "POST") {
            const { text, user } = req.body;
            if (!text || !user) {
                return res.status(400).json({ error: "Missing required fields" });
            }

            const newComment = await db.collection("comments").add({ text, user, createdAt: admin.firestore.FieldValue.serverTimestamp() });
            return res.status(201).json({ id: newComment.id });
        } 
        
        else {
            return res.status(405).json({ error: "Method not allowed" });
        }
    } 
    
    catch (error) {
        console.error("Firebase error:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}
