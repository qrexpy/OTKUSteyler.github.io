import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyAE7SJVhS-FLBueWNAQxYA6Gi838YN55wU",
  authDomain: "gustebook-aba1d.firebaseapp.com",
  projectId: "gustebook-aba1d",
  storageBucket: "gustebook-aba1d.firebasestorage.app",
  messagingSenderId: "282519660063",
  appId: "1:282519660063:web:d0ebdb62917160d4f6d72a",
  measurementId: "G-15H56JYDZ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { name, comment, page } = req.body;
      
      // Validate required fields - email is not required
      if (!name || !comment || !page) {
        return res.status(400).json({ error: 'Name, comment, and page are required' });
      }
      
      // Add new comment to Firestore without requiring email
      const docRef = await addDoc(collection(db, "comments"), {
        name,
        comment,
        page,
        createdAt: serverTimestamp()
      });
      
      res.status(201).json({ id: docRef.id, message: 'Comment added successfully' });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  } else if (req.method === 'GET') {
    try {
      const { page } = req.query;
      
      if (!page) {
        return res.status(400).json({ error: 'Page parameter is required' });
      }
      
      // Query comments for specific page, ordered by timestamp
      const commentsQuery = query(
        collection(db, "comments"), 
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(commentsQuery);
      
      // Filter for the specific page
      const comments = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.page === page) {
          comments.push({
            id: doc.id,
            name: data.name,
            comment: data.comment,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
          });
        }
      });
      
      res.status(200).json(comments);
    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({ error: 'Failed to retrieve comments' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
