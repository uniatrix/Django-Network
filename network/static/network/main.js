document.addEventListener('DOMContentLoaded', function() {
  const timeAgoElements = document.querySelectorAll('.time-ago');

  timeAgoElements.forEach(function(element) {
      const timestamp = parseInt(element.getAttribute('data-timestamp'));
      const now = Math.floor(Date.now() / 1000);
      const secondsAgo = now - timestamp;
      const minutesAgo = Math.floor(secondsAgo / 60);
      const hoursAgo = Math.floor(secondsAgo / 3600);
      const daysAgo = Math.floor(hoursAgo / 24);
      const weeksAgo = Math.floor(daysAgo / 7);
      const yearsAgo = Math.floor(weeksAgo / 52.1429);

      let timeText = "";
      if (yearsAgo >= 1) {
          timeText = `⠀• ${yearsAgo} y`;
      } else if (weeksAgo >= 1) {
          timeText = `⠀• ${weeksAgo} w`;
      } else if (daysAgo >= 1) {
          timeText = `⠀• ${daysAgo} d`;
      } else if (hoursAgo >= 1) {
          timeText = `⠀• ${hoursAgo} h`;
      } else {
          timeText = `⠀• ${minutesAgo} m`;
      }

      element.textContent = timeText;
  });
});

function editPost(postId) {
    const postContentDiv = document.getElementById(`post-content-${postId}`);
    const originalContent = postContentDiv.querySelector(".post-text").textContent.trim();

    // Hide the current content and show the textarea
    postContentDiv.querySelector(".post-text").style.display = "none";
    postContentDiv.querySelector(".edit-textarea").value = originalContent;
    postContentDiv.querySelector(".edit-textarea").style.display = "block";
    postContentDiv.querySelector(".save-btn").style.display = "inline-block";
}

function savePost(postId) {
    const postContentDiv = document.getElementById(`post-content-${postId}`);
    const newContent = postContentDiv.querySelector(".edit-textarea").value.trim();

    if (!newContent) {
        alert("Content cannot be empty.");
        return;
    }

    // Send AJAX request to update the post
    fetch(`/edit/${postId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": getCookie('csrftoken')
        },
        body: `content=${encodeURIComponent(newContent)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            postContentDiv.querySelector(".post-text").textContent = data.content;
            postContentDiv.querySelector(".post-text").style.display = "block";
            postContentDiv.querySelector(".edit-textarea").style.display = "none";
            postContentDiv.querySelector(".save-btn").style.display = "none";
        }
    })
    .catch(error => console.error("Error:", error));
}

function savePost(postId) {
    const postContentDiv = document.getElementById(`post-content-${postId}`);
    const newContent = postContentDiv.querySelector(".edit-textarea").value.trim();

    if (!newContent) {
        alert("Content cannot be empty.");
        return;
    }

    // Send AJAX request to update the post
    fetch(`/edit/${postId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-CSRFToken": getCookie('csrftoken')
        },
        body: `content=${encodeURIComponent(newContent)}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            postContentDiv.querySelector(".post-text").textContent = data.content;
            postContentDiv.querySelector(".post-text").style.display = "block";
            postContentDiv.querySelector(".edit-textarea").style.display = "none";
            postContentDiv.querySelector(".save-btn").style.display = "none";
        }
    })
    .catch(error => console.error("Error:", error));
}


  // Like button update
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.like-btn').forEach(function(button) {
      button.onclick = function(event) {
          event.preventDefault();  // Prevent the default action
          console.log("Like button clicked");

          const postId = this.getAttribute('data-post-id');
          const likeIcon = this.querySelector('i');
          const likeCount = this.parentElement.querySelector('.like-count'); // Correctly target the sibling span

          fetch(`/like/${postId}`, {
              method: 'POST',
              headers: {
                  'X-CSRFToken': getCookie('csrftoken'),
              }
          })
          .then(response => {
              console.log("Response received");
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
              console.log("Data received:", data);
              // Update the like count and the icon
              likeCount.textContent = data.likes_count;
              if (data.liked) {
                  likeIcon.classList.remove('bi-heart');
                  likeIcon.classList.add('bi-heart-fill');
                  likeIcon.style.color = 'red';
              } else {
                  likeIcon.classList.remove('bi-heart-fill');
                  likeIcon.classList.add('bi-heart');
                  likeIcon.style.color = '';
              }
          })
          .catch(error => console.error('Error:', error));
      };
  });
});

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
          }
      }
  }
  return cookieValue;
}

