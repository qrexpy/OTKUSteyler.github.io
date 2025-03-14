// Firebase Configuration
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const commentsCollection = db.collection("comments");

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
  const commentForm = document.getElementById('comment-form');
  const commentText = document.getElementById('comment-text');
  const commentFile = document.getElementById('comment-file');
  const commentThread = document.getElementById('comment-thread');
  const errorMessage = document.getElementById('error-message');

  // Load existing comments
  loadComments();

  // Comment form submission
  if (commentForm) {
    commentForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Validate inputs
      if (!commentText.value.trim()) {
        showError("Comment text cannot be empty");
        return;
      }
      
      // Generate anonymous ID (similar to 4chan)
      const anonymousId = generateAnonymousId();
      
      try {
        // Handle file upload if present
        let imageUrl = null;
        
        if (commentFile.files.length > 0) {
          const file = commentFile.files[0];
          
          // Validate file type
          if (!file.type.match('image.*')) {
            showError("Only image files are allowed");
            return;
          }
          
          // Validate file size (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            showError("File size must be less than 5MB");
            return;
          }
          
          // Upload file to Firebase Storage
          const storageRef = firebase.storage().ref();
          const fileRef = storageRef.child(`comments/${Date.now()}_${file.name}`);
          await fileRef.put(file);
          imageUrl = await fileRef.getDownloadURL();
        }
        
        // Save comment to Firebase
        const commentData = {
          text: commentText.value.trim(),
          imageUrl: imageUrl,
          anonymousId: anonymousId,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          replies: []
        };
        
        await commentsCollection.add(commentData);
        
        // Reset form
        commentText.value = '';
        commentFile.value = '';
        
        // Reload comments
        loadComments();
        
      } catch (error) {
        console.error("Error adding comment:", error);
        showError("Failed to post comment. Please try again.");
      }
    });
  }
  
  // Reply to comment function
  window.replyToComment = async function(parentId) {
    const replyText = document.getElementById(`reply-text-${parentId}`).value;
    
    if (!replyText.trim()) {
      showError("Reply text cannot be empty");
      return;
    }
    
    try {
      const anonymousId = generateAnonymousId();
      
      // Get parent comment
      const parentDoc = await commentsCollection.doc(parentId).get();
      
      if (parentDoc.exists) {
        const parentData = parentDoc.data();
        const replies = parentData.replies || [];
        
        // Add new reply
        replies.push({
          text: replyText.trim(),
          anonymousId: anonymousId,
          timestamp: new Date().toISOString()
        });
        
        // Update parent document
        await commentsCollection.doc(parentId).update({ replies: replies });
        
        // Reload comments
        loadComments();
        
        // Clear reply field
        document.getElementById(`reply-text-${parentId}`).value = '';
        
      } else {
        showError("Comment not found");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      showError("Failed to post reply. Please try again.");
    }
  };
  
  // Load comments from Firebase
  function loadComments() {
    if (!commentThread) return;
    
    commentThread.innerHTML = '<p>Loading comments...</p>';
    
    commentsCollection.orderBy('timestamp', 'desc').get().then(snapshot => {
      if (snapshot.empty) {
        commentThread.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        return;
      }
      
      commentThread.innerHTML = '';
      
      snapshot.forEach(doc => {
        const comment = doc.data();
        const commentId = doc.id;
        const commentElement = createCommentElement(comment, commentId);
        commentThread.appendChild(commentElement);
      });
    }).catch(error => {
      console.error("Error loading comments:", error);
      commentThread.innerHTML = '<p>Error loading comments. Please refresh the page.</p>';
    });
  }
  
  // Create comment element
  function createCommentElement(comment, commentId) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.id = `comment-${commentId}`;
    
    // Comment header with anonymous ID
    const header = document.createElement('div');
    header.className = 'comment-header';
    
    const anonymousTag = document.createElement('span');
    anonymousTag.className = 'anonymous-tag';
    anonymousTag.textContent = `Anonymous (${comment.anonymousId})`;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = comment.timestamp ? 
      new Date(comment.timestamp.toDate()).toLocaleString() : 
      'Just now';
    
    header.appendChild(anonymousTag);
    header.appendChild(timestamp);
    commentDiv.appendChild(header);
    
    // Comment content
    const content = document.createElement('div');
    content.className = 'comment-content';
    
    // Add image if present
    if (comment.imageUrl) {
      const image = document.createElement('img');
      image.src = comment.imageUrl;
      image.className = 'comment-image';
      image.addEventListener('click', function() {
        window.open(comment.imageUrl, '_blank');
      });
      content.appendChild(image);
    }
    
    // Add text
    const text = document.createElement('p');
    text.textContent = comment.text;
    content.appendChild(text);
    
    commentDiv.appendChild(content);
    
    // Replies section
    if (comment.replies && comment.replies.length > 0) {
      const repliesDiv = document.createElement('div');
      repliesDiv.className = 'comment-replies';
      
      comment.replies.forEach(reply => {
        const replyDiv = document.createElement('div');
        replyDiv.className = 'comment-reply';
        
        const replyHeader = document.createElement('div');
        replyHeader.className = 'reply-header';
        
        const replyAnonymousTag = document.createElement('span');
        replyAnonymousTag.className = 'anonymous-tag';
        replyAnonymousTag.textContent = `Anonymous (${reply.anonymousId})`;
        
        const replyTimestamp = document.createElement('span');
        replyTimestamp.className = 'timestamp';
        replyTimestamp.textContent = new Date(reply.timestamp).toLocaleString();
        
        replyHeader.appendChild(replyAnonymousTag);
        replyHeader.appendChild(replyTimestamp);
        replyDiv.appendChild(replyHeader);
        
        const replyText = document.createElement('p');
        replyText.textContent = reply.text;
        replyDiv.appendChild(replyText);
        
        repliesDiv.appendChild(replyDiv);
      });
      
      commentDiv.appendChild(repliesDiv);
    }
    
    // Reply form
    const replyForm = document.createElement('div');
    replyForm.className = 'reply-form';
    
    const replyInput = document.createElement('textarea');
    replyInput.id = `reply-text-${commentId}`;
    replyInput.placeholder = 'Write a reply...';
    replyForm.appendChild(replyInput);
    
    const replyButton = document.createElement('button');
    replyButton.textContent = 'Reply';
    replyButton.onclick = function() {
      replyToComment(commentId);
    };
    replyForm.appendChild(replyButton);
    
    commentDiv.appendChild(replyForm);
    
    return commentDiv;
  }
  
  // Generate anonymous ID (similar to 4chan)
  function generateAnonymousId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }
  
  // Show error message
  function showError(message) {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
      
      // Hide after 3 seconds
      setTimeout(() => {
        errorMessage.style.display = 'none';
      }, 3000);
    } else {
      alert(message);
    }
  }
});

// Add CSS to match 4chan style
const style = document.createElement('style');
style.textContent = `
  .comment {
    background-color: #f0e0d6;
    border: 1px solid #d9bfb7;
    border-radius: 2px;
    margin-bottom: 20px;
    padding: 10px;
  }
  
  .comment-header {
    color: #117743;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .anonymous-tag {
    margin-right: 10px;
  }
  
  .timestamp {
    color: #666;
    font-size: 0.8em;
  }
  
  .comment-content {
    margin-bottom: 10px;
  }
  
  .comment-image {
    max-width: 200px;
    max-height: 200px;
    margin-bottom: 10px;
    cursor: pointer;
  }
  
  .comment-replies {
    margin-left: 20px;
    border-left: 2px solid #d9bfb7;
    padding-left: 10px;
  }
  
  .comment-reply {
    background-color: #d6daf0;
    border: 1px solid #b7c5d9;
    border-radius: 2px;
    margin-bottom: 10px;
    padding: 8px;
  }
  
  .reply-form textarea {
    width: 100%;
    padding: 5px;
    margin-bottom: 5px;
    min-height: 60px;
  }
  
  .reply-form button {
    background-color: #d6daf0;
    border: 1px solid #b7c5d9;
    border-radius: 2px;
    cursor: pointer;
    padding: 5px 10px;
  }
  
  #comment-form {
    background-color: #eef2ff;
    border: 1px solid #b7c5d9;
    border-radius: 2px;
    margin-bottom: 20px;
    padding: 10px;
  }
  
  #comment-text {
    width: 100%;
    padding: 5px;
    margin-bottom: 10px;
    min-height: 100px;
  }
  
  #error-message {
    background-color: #f0d6d6;
    border: 1px solid #d9b7b7;
    color: #c00;
    display: none;
    margin-bottom: 10px;
    padding: 10px;
  }
`;
document.head.appendChild(style);

// HTML Structure (Add this to your HTML)
/*
<div class="comment-section">
  <h2>Comments</h2>
  
  <div id="error-message"></div>
  
  <form id="comment-form">
    <textarea id="comment-text" placeholder="Write your comment here..."></textarea>
    <div class="form-footer">
      <input type="file" id="comment-file" accept="image/*">
      <button type="submit">Post Comment</button>
    </div>
  </form>
  
  <div id="comment-thread">
    <!-- Comments will be loaded here -->
  </div>
</div>
*/
