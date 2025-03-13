// pages/api/comments.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  // Your Firebase config
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // Handle adding a comment
    try {
      const { name, message, pageId } = req.body;
      const docRef = await addDoc(collection(db, "comments"), {
        name,
        message,
        pageId,
        timestamp: serverTimestamp()
      });
      
      res.status(200).json({ success: true, id: docRef.id });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else if (req.method === 'GET') {
    // Handle getting comments
    try {
      const { pageId } = req.query;
      const q = query(collection(db, "comments"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      
      const comments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.pageId === pageId) {
          comments.push({
            id: doc.id,
            name: data.name,
            message: data.message,
            timestamp: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Just now"
          });
        }
      });
      
      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
