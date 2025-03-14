// Discord Status API integration
const discordUserID = "554071670143451176"; // Replace with your actual Discord user ID
let discordStatusData = null;

// Firebase configuration - Replace with your actual Firebase config
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
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase only if the SDK is loaded
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    initializeComments();
  } else {
    console.error("Firebase SDK not loaded. Make sure to include it in your HTML.");
  }

  // Load Discord status
  loadDiscordStatus();
  
  // Set up a socket connection for real-time Discord status updates
  setupDiscordSocket();

  // Handle theme toggle
  setupThemeToggle();
});

// Initialize comments system
function initializeComments() {
  const db = firebase.firestore();
  const commentsCollection = db.collection("comments");
  const commentForm = document.getElementById('comment-form');
  const commentText = document.getElementById('comment-text');
  const commentFile = document.getElementById('comment-file');
  const commentThread = document.getElementById('comment-thread');
  const errorMessage = document.getElementById('error-message');

  // Only proceed if the comments elements exist
  if (!commentThread) {
    // Create comment section if it doesn't exist
    createCommentSection();
    return;
  }

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
        
        if (commentFile && commentFile.files.length > 0) {
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
          replies: [],
          profilePicture: getRandomProfilePicture()
        };
        
        await commentsCollection.add(commentData);
        
        // Reset form
        commentText.value = '';
        if (commentFile) commentFile.value = '';
        
        // Reload comments
        loadComments();
        
      } catch (error) {
        console.error("Error adding comment:", error);
        showError("Failed to post comment. Please try again.");
      }
    });
  }

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

  // Create comment section if it doesn't exist
  function createCommentSection() {
    const main = document.querySelector('main');
    if (!main) return;
    
    const commentSection = document.createElement('div');
    commentSection.className = 'comment-section';
    commentSection.innerHTML = `
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
    `;
    
    main.appendChild(commentSection);
    
    // Reinitialize comments
    setTimeout(initializeComments, 100);
  }

  // Create comment element
  function createCommentElement(comment, commentId) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';
    commentDiv.id = `comment-${commentId}`;
    
    // Comment header with anonymous ID and profile picture
    const header = document.createElement('div');
    header.className = 'comment-header';
    
    // Add profile picture
    if (comment.profilePicture) {
      const profilePic = document.createElement('img');
      profilePic.className = 'comment-profile-pic';
      profilePic.src = comment.profilePicture;
      profilePic.alt = 'Profile';
      header.appendChild(profilePic);
    }
    
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
        
        // Add profile picture for reply
        if (reply.profilePicture) {
          const replyProfilePic = document.createElement('img');
          replyProfilePic.className = 'comment-profile-pic';
          replyProfilePic.src = reply.profilePicture;
          replyProfilePic.alt = 'Profile';
          replyHeader.appendChild(replyProfilePic);
        }
        
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
          timestamp: new Date().toISOString(),
          profilePicture: getRandomProfilePicture()
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

// Get random profile picture
function getRandomProfilePicture() {
  const pictures = [
    'https://i.pravatar.cc/150?img=1',
    'https://i.pravatar.cc/150?img=2',
    'https://i.pravatar.cc/150?img=3',
    'https://i.pravatar.cc/150?img=4',
    'https://i.pravatar.cc/150?img=5',
    'https://i.pravatar.cc/150?img=6',
    'https://i.pravatar.cc/150?img=7',
    'https://i.pravatar.cc/150?img=8'
  ];
  return pictures[Math.floor(Math.random() * pictures.length)];
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById('error-message');
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

// Load Discord status via Lanyard API
function loadDiscordStatus() {
  if (!discordUserID || discordUserID === '554071670143451176') return;
  
  fetch(`https://api.lanyard.rest/v1/554071670143451176/${discordUserID}`)
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        discordStatusData = data.data;
        updateDiscordStatus();
      }
    })
    .catch(error => {
      console.error("Error loading Discord status:", error);
    });
}

// Set up Discord WebSocket for real-time updates
function setupDiscordSocket() {
  if (!discordUserID || discordUserID === '554071670143451176') return;
  
  const ws = new WebSocket('wss://api.lanyard.rest/socket');
  
  ws.onopen = () => {
    // Subscribe to Discord user ID updates
    ws.send(JSON.stringify({
      op: 2,
      d: {
        subscribe_to_id: discordUserID
      }
    }));
  };
  
  ws.onmessage = event => {
    const data = JSON.parse(event.data);
    
    // Handle heartbeat
    if (data.op === 1) {
      ws.send(JSON.stringify({
        op: 3
      }));
    }
    
    // Handle presence update
    if (data.op === 0 && data.t === 'PRESENCE_UPDATE' && data.d.user_id === discordUserID) {
      discordStatusData = data.d;
      updateDiscordStatus();
    }
  };
  
  ws.onclose = () => {
    // Reconnect after 5 seconds
    setTimeout(setupDiscordSocket, 5000);
  };
}

// Update Discord status display
function updateDiscordStatus() {
  const statusElement = document.getElementById('discord-status');
  if (!statusElement || !discordStatusData) return;
  
  // Clear previous content
  statusElement.innerHTML = '';
  
  // Create status container
  const statusContainer = document.createElement('div');
  statusContainer.className = 'discord-status-container';
  
  // Add avatar
  const avatar = document.createElement('img');
  avatar.className = 'discord-avatar';
  avatar.src = discordStatusData.discord_user?.avatar 
    ? `https://cdn.discordapp.com/avatars/${discordUserID}/${discordStatusData.discord_user.avatar}.png?size=128`
    : 'https://cdn.discordapp.com/
