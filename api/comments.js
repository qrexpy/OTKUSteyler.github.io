// Firebase Comments Module with Fixed Paths
// This should be placed at /api/comments.js in your project

// Use absolute URLs for Firebase imports to avoid path issues
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Function to add a new comment
async function addComment(name, message, pageId) {
  try {
    const commentsCollection = collection(db, "comments");
    const docRef = await addDoc(commentsCollection, {
      name: name,
      message: message,
      pageId: pageId,
      timestamp: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, error: error.message };
  }
}

// Function to get comments
async function getComments(pageId) {
  try {
    const commentsCollection = collection(db, "comments");
    const q = query(
      commentsCollection,
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const comments = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include comments for the current page
      if (data.pageId === pageId) {
        comments.push({
          id: doc.id,
          name: data.name,
          message: data.message,
          timestamp: data.timestamp ? new Date(data.timestamp.toDate()).toLocaleString() : "Just now"
        });
      }
    });
    
    return comments;
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
}

// Function to initialize comments UI
function initComments(containerId, pageId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Comment container with id "${containerId}" not found`);
    return;
  }
  
  // Create comment form
  const formHtml = `
    <div class="comment-form">
      <h3>Leave a Comment</h3>
      <div class="form-group">
        <input type="text" id="comment-name" placeholder="Your Name" required>
      </div>
      <div class="form-group">
        <textarea id="comment-message" placeholder="Your Comment" required></textarea>
      </div>
      <button id="submit-comment">Submit</button>
    </div>
    <div class="comments-list">
      <h3>Comments</h3>
      <div id="comments-container">Loading comments...</div>
    </div>
  `;
  
  container.innerHTML = formHtml;
  
  // Add event listener to submit button
  document.getElementById("submit-comment").addEventListener("click", async () => {
    const nameInput = document.getElementById("comment-name");
    const messageInput = document.getElementById("comment-message");
    
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    
    if (name && message) {
      const result = await addComment(name, message, pageId);
      if (result.success) {
        // Clear form fields
        nameInput.value = "";
        messageInput.value = "";
        
        // Refresh comments
        await loadComments(pageId);
      } else {
        alert("Failed to add comment: " + result.error);
      }
    } else {
      alert("Please fill in all fields");
    }
  });
  
  // Load initial comments
  loadComments(pageId);
}

// Function to display comments
async function loadComments(pageId) {
  const commentsContainer = document.getElementById("comments-container");
  if (!commentsContainer) return;
  
  commentsContainer.innerHTML = "Loading comments...";
  
  const comments = await getComments(pageId);
  
  if (comments.length === 0) {
    commentsContainer.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
    return;
  }
  
  let commentsHtml = "";
  
  comments.forEach(comment => {
    commentsHtml += `
      <div class="comment">
        <div class="comment-header">
          <strong>${comment.name}</strong>
          <span class="comment-date">${comment.timestamp}</span>
        </div>
        <div class="comment-body">
          ${comment.message}
        </div>
      </div>
    `;
  });
  
  commentsContainer.innerHTML = commentsHtml;
}

// Export functions using both named and default exports for flexibility
export { initComments, addComment, getComments };
export default { initComments, addComment, getComments };
