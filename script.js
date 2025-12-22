// Utility Functions
function showLoading(show) {
    const loadingEl = document.getElementById('loading');
    if (show) {
        loadingEl.classList.remove('hidden');
        loadingEl.style.display = 'block';
    } else {
        loadingEl.classList.add('hidden');
        loadingEl.style.display = 'none';
    }
}
function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}
function clearError() {
    document.getElementById('error').classList.add('hidden');
}
function clearResults() {
    document.getElementById('results').innerHTML = '';
}
function disableInputs(disabled) {
    document.getElementById('searchBtn').disabled = disabled;
    document.getElementById('loginBtn').disabled = disabled;
    document.getElementById('searchInput').disabled = disabled;
}

// OAuth 2.0 Login
function loginWithFacebook() {
    const authUrl = `https://www.facebook.com/${FB_CONFIG.API_VERSION}/dialog/oauth?client_id=${FB_CONFIG.APP_ID}&redirect_uri=${encodeURIComponent(FB_CONFIG.REDIRECT_URI)}&response_type=token&scope=public_profile,email,user_friends,user_posts,user_photos,user_videos,user_likes,user_events,user_birthday,user_hometown,user_location`;
    window.location.href = authUrl;
}

// Parse access token from URL hash
function parseAccessToken() {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        ACCESS_TOKEN = params.get('access_token');
        window.location.hash = '';
    }
}

// API Call (modular)
async function fetchFromFacebook(endpoint, params = {}) {
    if (!ACCESS_TOKEN) throw new Error('Not authenticated. Please login.');
    const url = new URL(`https://graph.facebook.com/${FB_CONFIG.API_VERSION}/${endpoint}`);
    url.search = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN });
    const res = await fetch(url);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `API Error: ${res.status}`);
    }
    return res.json();
}

// DOM Rendering
function renderUserCard(user, pictureUrl) {
    return `<div class="card">
        <img src="${pictureUrl}" alt="Profile Picture">
        <h2>${user.name}</h2>
        <p>ID: ${user.id}</p>
    </div>`;
}
function renderFriendsList(friends) {
    if (!friends.length) return '';
    return `<div class="card"><h3>Friends</h3><ul>${friends.map(f => `<li>${f.name}</li>`).join('')}</ul></div>`;
}
function renderPosts(posts) {
    // Only show posts with text, image, or video, and exclude shared posts (posts with a 'story' field are usually shares)
    const filtered = posts.filter(p => {
        const hasText = !!p.message;
        const hasMedia = p.attachments && p.attachments.data && p.attachments.data.some(att => (att.media && (att.media.image || att.media.source)));
        // Exclude posts that have a 'story' field (these are typically shared posts)
        return (hasText || hasMedia) && !p.story;
    });
    if (!filtered.length) return '<div class="card"><h3>User Posts</h3><p>No posts found.</p></div>';
    return `<div class="card"><h3>User Posts</h3><ul>${filtered.map(p => renderPostItem(p)).join('')}</ul></div>`;
}

function renderPostItem(post) {
    let textContent = '';
    let mediaContent = '';
    let dateContent = '';
    // Message or story
    if (post.message) {
        textContent += `<div class="post-message" style="display:block;margin-bottom:1.5rem;">${post.message}</div>`;
    } else if (post.story) {
        textContent += `<div class="post-story" style="display:block;margin-bottom:1.5rem;">${post.story}</div>`;
    }
    // Attachments (images/videos, including shared posts)
    if (post.attachments && post.attachments.data && post.attachments.data.length > 0) {
        mediaContent += post.attachments.data.map(att => {
            // If this is a shared post, recursively render its subattachments
            if (att.subattachments && att.subattachments.data && att.subattachments.data.length > 0) {
                return att.subattachments.data.map(sub => renderAttachment(sub)).join('');
            }
            return renderAttachment(att);
        }).join('');
        // Wrap media in a block
        mediaContent = `<div style="display:block;margin-bottom:1.5rem;">${mediaContent}</div>`;
    }
    // Date
    dateContent += `<div class="post-date" style="display:block;margin-top:1rem;font-size:1.1rem;color:#555;"><small>${post.created_time ? new Date(post.created_time).toLocaleString() : ''}</small></div>`;
    // Stack vertically
    return `<li style="display:flex;flex-direction:column;align-items:flex-start;">${textContent}${mediaContent}${dateContent}</li>`;
}

function renderAttachment(att) {
    if (att.media && att.media.image) {
        return `<img src="${att.media.image.src}" alt="Post Image" style="max-width:1000px;max-height:1000px;width:100%;height:auto;margin:8px 0;border-radius:18px;box-shadow:0 4px 24px rgba(24,119,242,0.13);">`;
    }
    if (att.media && att.media.source) {
        // Video
        return `<video controls style="max-width:1000px;max-height:1000px;width:100%;height:auto;margin:8px 0;border-radius:18px;box-shadow:0 4px 24px rgba(24,119,242,0.13);"><source src="${att.media.source}"></video>`;
    }
    return '';
}

// Main Search Handler
async function handleSearch() {
    clearError();
    clearResults();
    const input = document.getElementById('searchInput').value.trim();
    if (!input) {
        showError('Input cannot be empty.');
        return;
    }
    if (/[^\w.]/.test(input)) {
        showError('Invalid characters in input.');
        return;
    }
    disableInputs(true);
    showLoading(true);
    try {
        // Get user profile (all possible fields)
        const user = await fetchFromFacebook(input, { fields: 'id,name,first_name,last_name,email,gender,locale,age_range,birthday,hometown,location,website,about,link,picture.type(large)' });
        document.getElementById('results').innerHTML += renderUserProfileCard(user);
        // Get friends
        const friendsRes = await fetchFromFacebook(`${input}/friends`);
        document.getElementById('results').innerHTML += renderFriendsList(friendsRes.data || []);
        // Get posts (including shared posts) with attachments and subattachments
        const postsRes = await fetchFromFacebook(`${input}/posts`, { fields: 'message,story,created_time,attachments{media,subattachments}' });
        document.getElementById('results').innerHTML += renderPosts(postsRes.data || []);
        // Get photos
        const photosRes = await fetchFromFacebook(`${input}/photos`, { fields: 'name,created_time,images' });
        document.getElementById('results').innerHTML += renderPhotosGallery(photosRes.data || []);
        // Get videos
        const videosRes = await fetchFromFacebook(`${input}/videos`, { fields: 'description,created_time,source,thumbnails' });
        document.getElementById('results').innerHTML += renderVideosGallery(videosRes.data || []);
        // Get likes
        const likesRes = await fetchFromFacebook(`${input}/likes`, { fields: 'name,category,created_time' });
        document.getElementById('results').innerHTML += renderLikesList(likesRes.data || []);
        // Get events
        const eventsRes = await fetchFromFacebook(`${input}/events`, { fields: 'name,description,start_time,end_time,place' });
        document.getElementById('results').innerHTML += renderEventsList(eventsRes.data || []);
    // Render extended user profile card
    function renderUserProfileCard(user) {
        let details = '';
        if (user.email) details += `<p style="margin:0 0 0.2rem 0;"><b>Email:</b> ${user.email}</p>`;
        if (user.birthday) details += `<p style="margin:0 0 0.2rem 0;"><b>Birthday:</b> ${user.birthday}</p>`;
        if (user.gender) details += `<p style="margin:0 0 0.2rem 0;"><b>Gender:</b> ${user.gender}</p>`;
        if (user.locale) details += `<p style="margin:0 0 0.2rem 0;"><b>Locale:</b> ${user.locale}</p>`;
        if (user.hometown?.name) details += `<p style="margin:0 0 0.2rem 0;"><b>Hometown:</b> ${user.hometown.name}</p>`;
        if (user.location?.name) details += `<p style="margin:0 0 0.2rem 0;"><b>Location:</b> ${user.location.name}</p>`;
        if (user.website) details += `<p style="margin:0 0 0.2rem 0;"><b>Website:</b> ${user.website}</p>`;
        if (user.about) details += `<p style="margin:0 0 0.2rem 0;"><b>About:</b> ${user.about}</p>`;
        if (user.link) details += `<p style="margin:0 0 0.2rem 0;"><b>Profile Link:</b> <a href="${user.link}" target="_blank">View Profile</a></p>`;
        return `<div class="card" style="text-align:left;max-width:600px;">
            <div style="display:flex;align-items:center;gap:1.5rem;">
                <img src="${user.picture?.data?.url || ''}" alt="Profile Picture" style="width:110px;height:110px;border-radius:50%;object-fit:cover;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <div>
                    <h2 style="margin:0 0 0.2rem 0;">${user.name || ''}</h2>
                    ${details}
                </div>
            </div>
        </div>`;
    }

    // Render photos gallery
    function renderPhotosGallery(photos) {
        if (!photos.length) return '';
        return `<div class="card"><h3>User Photos</h3><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">${photos.map(photo => `<img src="${photo.images?.[0]?.source || ''}" alt="Photo" style="width:120px;height:120px;object-fit:cover;border-radius:8px;box-shadow:0 1px 4px rgba(66,103,178,0.08);">`).join('')}</div></div>`;
    }

    // Render videos gallery
    function renderVideosGallery(videos) {
        if (!videos.length) return '';
        return `<div class="card"><h3>User Videos</h3><div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">${videos.map(video => `<video controls style="width:180px;height:120px;border-radius:8px;box-shadow:0 1px 4px rgba(66,103,178,0.08);margin-bottom:8px;"><source src="${video.source}"></video>`).join('')}</div></div>`;
    }

    // Render likes list
    function renderLikesList(likes) {
        if (!likes.length) return '';
        return `<div class="card"><h3>User Likes</h3><ul>${likes.map(like => `<li><b>${like.name}</b> <span style="color:#888;">(${like.category || ''})</span></li>`).join('')}</ul></div>`;
    }

    // Render events list
    function renderEventsList(events) {
        if (!events.length) return '';
        return `<div class="card"><h3>User Events</h3><ul>${events.map(event => `<li><b>${event.name}</b><br><span style="color:#888;">${event.start_time ? new Date(event.start_time).toLocaleString() : ''} - ${event.end_time ? new Date(event.end_time).toLocaleString() : ''}</span><br>${event.place?.name || ''}<br>${event.description || ''}</li>`).join('')}</ul></div>`;
    }

    // Render tagged places list
    function renderTaggedPlacesList(tagged) {
        if (!tagged.length) return '';
        return `<div class="card"><h3>Tagged Places</h3><ul>${tagged.map(tp => `<li><b>${tp.place?.name || ''}</b><br><span style="color:#888;">${tp.created_time ? new Date(tp.created_time).toLocaleString() : ''}</span></li>`).join('')}</ul></div>`;
    }
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
        disableInputs(false);
    }
}

// Event Listeners
window.addEventListener('DOMContentLoaded', () => {
    parseAccessToken();
    document.getElementById('loginBtn').addEventListener('click', loginWithFacebook);
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('searchInput').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleSearch();
    });
});
