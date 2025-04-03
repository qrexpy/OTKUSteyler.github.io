async function updateStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('Failed to fetch status');
    const data = await response.json();
    
    if (!data.success || !data.data) {
      console.error('Invalid response format:', data);
      return;
    }

    const user = data.data.discord_user;
    if (!user) {
      console.error('No user data in response');
      return;
    }

    const avatarUrl = user.avatar 
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` 
      : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    const avatarElement = document.getElementById("userAvatar");
    if (avatarElement) {
      avatarElement.src = avatarUrl;
      avatarElement.style.opacity = data.data.discord_status === "dnd" ? "0.5" : "1";
    }

    const usernameElement = document.getElementById("username");
    if (usernameElement) {
      usernameElement.textContent = user.global_name || user.username;
    }

    const statusElement = document.getElementById("status");
    if (statusElement) {
      statusElement.textContent = data.data.discord_status.toUpperCase();
    }

    const statusColors = {
      online: "lime",
      idle: "#ffac00",
      dnd: "red",
      offline: "#747f8d"
    };

    document.documentElement.style.setProperty("--status-color", statusColors[data.data.discord_status] || "#747f8d");

    const spotifyContainer = document.getElementById("spotifyContainer");
    if (spotifyContainer) {
      if (data.data.listening_to_spotify && data.data.spotify) {
        spotifyContainer.style.display = "block";
        const songElement = document.getElementById("spotifySong");
        const artistElement = document.getElementById("spotifyArtist");
        if (songElement) songElement.textContent = data.data.spotify.song;
        if (artistElement) artistElement.textContent = data.data.spotify.artist;
      } else {
        spotifyContainer.style.display = "none";
      }
    }

    const activityContainer = document.getElementById("activityContainer");
    if (activityContainer && data.data.activities && data.data.activities.length > 0) {
      const activity = data.data.activities[0];
      activityContainer.style.display = "block";
      const activityNameElement = document.getElementById("activityName");
      const activityDetailsElement = document.getElementById("activityDetails");
      const activityStateElement = document.getElementById("activityState");
      
      if (activityNameElement) activityNameElement.textContent = activity.name;
      if (activityDetailsElement) activityDetailsElement.textContent = activity.details || "";
      if (activityStateElement) activityStateElement.textContent = activity.state || "";
    } else if (activityContainer) {
      activityContainer.style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching status:", error);
  }
}

// Initial update
updateStatus();

// Update every 30 seconds
setInterval(updateStatus, 30000); 