async function updateStatus() {
  try {
    const response = await fetch('/api/status');
    if (!response.ok) throw new Error('Failed to fetch status');
    const { data } = await response.json();

    const user = data.discord_user;
    const avatarUrl = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}` : 'https://cdn.discordapp.com/embed/avatars/0.png';
    
    const avatarElement = document.getElementById("userAvatar");
    if (avatarElement) {
      avatarElement.src = avatarUrl;
      avatarElement.style.opacity = data.discord_status === "dnd" ? "0.5" : "1";
    }

    const usernameElement = document.getElementById("username");
    if (usernameElement) {
      usernameElement.textContent = user.display_name || user.global_name || user.username;
    }

    const statusElement = document.getElementById("status");
    if (statusElement) {
      statusElement.textContent = data.discord_status.toUpperCase();
    }

    const statusColors = {
      online: "lime",
      idle: "#ffac00",
      dnd: "red",
      offline: "#747f8d"
    };

    document.documentElement.style.setProperty("--status-color", statusColors[data.discord_status] || "#747f8d");

    const spotifyContainer = document.getElementById("spotifyContainer");
    if (spotifyContainer) {
      if (data.listening_to_spotify && data.spotify) {
        spotifyContainer.style.display = "block";
        const songElement = document.getElementById("spotifySong");
        const artistElement = document.getElementById("spotifyArtist");
        if (songElement) songElement.textContent = data.spotify.song;
        if (artistElement) artistElement.textContent = data.spotify.artist;
      } else {
        spotifyContainer.style.display = "none";
      }
    }

    const activityContainer = document.getElementById("activityContainer");
    if (activityContainer && data.activities && data.activities.length > 0) {
      const activity = data.activities[0];
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

updateStatus();
setInterval(updateStatus, 30000); 