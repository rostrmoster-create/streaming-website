// Initialize channels array from localStorage or use default
let channels = JSON.parse(localStorage.getItem('channels')) || [];

let currentChannelIndex = 0;
let currentCategory = 'all';
let hls = null;
let youtubePlayer = null;
let isEditMode = false;

// Save channels to localStorage
function saveChannels() {
    localStorage.setItem('channels', JSON.stringify(channels));
    updateStats();
}

// Update statistics
function updateStats() {
    const totalElement = document.getElementById('totalChannels');
    const activeElement = document.getElementById('activeChannels');
    
    if (totalElement) {
        totalElement.textContent = channels.length;
    }
    
    if (activeElement) {
        const activeCount = channels.filter(ch => ch.active !== false).length;
        activeElement.textContent = activeCount;
    }
}

// Get YouTube video ID from URL
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Display channels (Main page)
function displayChannels(filter = 'all', searchQuery = '') {
    const channelsGrid = document.getElementById('channelsGrid');
    if (!channelsGrid) return;

    let filteredChannels = channels.filter(ch => ch.active !== false);

    // Filter by category
    if (filter !== 'all') {
        filteredChannels = filteredChannels.filter(ch => ch.category === filter);
    }

    // Filter by search query
    if (searchQuery) {
        filteredChannels = filteredChannels.filter(ch => 
            ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ch.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (filteredChannels.length === 0) {
        channelsGrid.innerHTML = `
            <div class="no-channels">
                <i class="fas fa-tv"></i>
                <p>No channels found</p>
            </div>
        `;
        return;
    }

    channelsGrid.innerHTML = filteredChannels.map((channel) => {
        const streamIcon = {
            'm3u8': 'fa-stream',
            'youtube': 'fa-youtube',
            'mp4': 'fa-film',
            'embed': 'fa-code'
        };

        return `
            <div class="channel-card" data-id="${channel.id}">
                <div class="channel-logo">
                    ${channel.logo ? 
                        `<img src="${channel.logo}" alt="${channel.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='<i class=\\'fas fa-tv\\'></i>'">` : 
                        `<i class="fas fa-tv"></i>`
                    }
                </div>
                <div class="channel-info">
                    <h3 class="channel-name">${channel.name}</h3>
                    <div class="channel-tags">
                        <span class="channel-category">${channel.category}</span>
                        <span class="stream-type">
                            <i class="fas ${streamIcon[channel.streamType] || 'fa-broadcast-tower'}"></i>
                            ${channel.streamType.toUpperCase()}
                        </span>
                    </div>
                    <p class="channel-desc">${channel.description || 'No description available'}</p>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners to channel cards
    document.querySelectorAll('.channel-card').forEach(card => {
        card.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const index = channels.findIndex(ch => ch.id === id);
            if (index !== -1) {
                playChannel(index);
            }
        });
    });
}

// Play channel with multiple stream type support
function playChannel(index) {
    currentChannelIndex = index;
    const channel = channels[index];
    
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const youtubePlayerDiv = document.getElementById('youtubePlayer');
    const embedPlayer = document.getElementById('embedPlayer');
    const channelName = document.getElementById('currentChannelName');
    const channelDesc = document.getElementById('currentChannelDesc');
    const streamTypeBadge = document.getElementById('streamTypeBadge');

    if (!playerSection) return;

    // Update channel info
    channelName.textContent = channel.name;
    channelDesc.textContent = channel.description;
    streamTypeBadge.textContent = channel.streamType.toUpperCase();
    streamTypeBadge.className = `stream-type-badge ${channel.streamType}`;

    // Show player
    playerSection.style.display = 'flex';

    // Hide all players first
    videoPlayer.style.display = 'none';
    youtubePlayerDiv.style.display = 'none';
    embedPlayer.style.display = 'none';

    // Stop any existing playback
    if (hls) {
        hls.destroy();
        hls = null;
    }
    if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }

    // Load appropriate player based on stream type
    switch(channel.streamType) {
        case 'm3u8':
            videoPlayer.style.display = 'block';
            playM3U8(channel.url, videoPlayer);
            break;
            
        case 'youtube':
            youtubePlayerDiv.style.display = 'block';
            playYouTube(channel.url, youtubePlayerDiv);
            break;
            
        case 'mp4':
            videoPlayer.style.display = 'block';
            videoPlayer.src = channel.url;
            videoPlayer.play();
            break;
            
        case 'embed':
            embedPlayer.style.display = 'block';
            embedPlayer.src = channel.url;
            break;
    }
}

// Play M3U8 stream
function playM3U8(url, videoElement) {
    if (Hls.isSupported()) {
        hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
        });
        hls.loadSource(url);
        hls.attachMedia(videoElement);
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            videoElement.play().catch(e => console.error('Playback error:', e));
        });
        hls.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                console.error('HLS Error:', data);
                alert('Error loading stream. Please try another channel.');
            }
        });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', function() {
            videoElement.play();
        });
    } else {
        alert('Your browser does not support HLS playback.');
    }
}

// Play YouTube stream
function playYouTube(url, containerElement) {
    const videoId = getYouTubeVideoId(url);
    
    if (!videoId) {
        alert('Invalid YouTube URL');
        return;
    }

    // Clear container
    containerElement.innerHTML = '';
    
    // Create unique player div
    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-' + Date.now();
    containerElement.appendChild(playerDiv);

    // Initialize YouTube player
    if (typeof YT !== 'undefined' && YT.Player) {
        youtubePlayer = new YT.Player(playerDiv.id, {
            width: '100%',
            height: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'showinfo': 0,
                'modestbranding': 1
            },
            events: {
                'onError': function(event) {
                    console.error('YouTube Player Error:', event.data);
                    alert('Error loading YouTube stream.');
                }
            }
        });
    } else {
        // Fallback to iframe
        playerDiv.innerHTML = `
            <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" allowfullscreen>
            </iframe>
        `;
    }
}

// Close player
function closePlayer() {
    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (playerSection) {
        playerSection.style.display = 'none';
    }
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.src = '';
    }
    
    if (hls) {
        hls.destroy();
        hls = null;
    }
    
    if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }
    
    const embedPlayer = document.getElementById('embedPlayer');
    if (embedPlayer) {
        embedPlayer.src = '';
    }
}

// Next channel
function nextChannel() {
    const activeChannels = channels.filter(ch => ch.active !== false);
    const currentChannel = channels[currentChannelIndex];
    const currentActiveIndex = activeChannels.findIndex(ch => ch.id === currentChannel.id);
    const nextActiveIndex = (currentActiveIndex + 1) % activeChannels.length;
    const nextChannel = activeChannels[nextActiveIndex];
    const nextIndex = channels.findIndex(ch => ch.id === nextChannel.id);
    playChannel(nextIndex);
}

// Previous channel
function prevChannel() {
    const activeChannels = channels.filter(ch => ch.active !== false);
    const currentChannel = channels[currentChannelIndex];
    const currentActiveIndex = activeChannels.findIndex(ch => ch.id === currentChannel.id);
    const prevActiveIndex = (currentActiveIndex - 1 + activeChannels.length) % activeChannels.length;
    const prevChannel = activeChannels[prevActiveIndex];
    const prevIndex = channels.findIndex(ch => ch.id === prevChannel.id);
    playChannel(prevIndex);
}

// Admin: Add/Edit channel
function submitChannel(e) {
    e.preventDefault();
    
    const id = document.getElementById('editChannelId').value;
    const name = document.getElementById('channelName').value;
    const url = document.getElementById('channelUrl').value;
    const logo = document.getElementById('channelLogo').value;
    const category = document.getElementById('channelCategory').value;
    const description = document.getElementById('channelDesc').value;
    const streamType = document.getElementById('streamType').value;
    const active = document.getElementById('channelActive').checked;

    const channelData = {
        name,
        url,
        logo,
        category,
        description,
        streamType,
        active
    };

    if (id) {
        // Edit existing channel
        const index = channels.findIndex(ch => ch.id === parseInt(id));
        if (index !== -1) {
            channels[index] = { ...channels[index], ...channelData };
        }
    } else {
        // Add new channel
        channelData.id = Date.now();
        channels.push(channelData);
    }

    saveChannels();
    resetForm();
    displayAdminChannels();
    
    alert(id ? 'Channel updated successfully!' : 'Channel added successfully!');
}

// Reset form
function resetForm() {
    document.getElementById('channelForm').reset();
    document.getElementById('editChannelId').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Channel';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-plus"></i> Add Channel';
    document.getElementById('cancelEdit').style.display = 'none';
    isEditMode = false;
}

// Edit channel
function editChannel(id) {
    const channel = channels.find(ch => ch.id === id);
    if (!channel) return;

    document.getElementById('editChannelId').value = channel.id;
    document.getElementById('channelName').value = channel.name;
    document.getElementById('channelUrl').value = channel.url;
    document.getElementById('channelLogo').value = channel.logo || '';
    document.getElementById('channelCategory').value = channel.category;
    document.getElementById('channelDesc').value = channel.description || '';
    document.getElementById('streamType').value = channel.streamType;
    document.getElementById('channelActive').checked = channel.active !== false;

    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Channel';
    document.getElementById('submitBtn').innerHTML = '<i class="fas fa-save"></i> Update Channel';
    document.getElementById('cancelEdit').style.display = 'inline-block';
    
    isEditMode = true;

    // Scroll to form
    document.querySelector('.admin-card').scrollIntoView({ behavior: 'smooth' });
}

// Admin: Display channels list
function displayAdminChannels(filterCategory = '', searchQuery = '') {
    const channelsList = document.getElementById('channelsList');
    if (!channelsList) return;

    let filteredChannels = [...channels];

    // Filter by category
    if (filterCategory) {
        filteredChannels = filteredChannels.filter(ch => ch.category === filterCategory);
    }

    // Filter by search
    if (searchQuery) {
        filteredChannels = filteredChannels.filter(ch => 
            ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ch.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (filteredChannels.length === 0) {
        channelsList.innerHTML = '<p class="no-data">No channels found.</p>';
        return;
    }

    channelsList.innerHTML = filteredChannels.map(channel => `
        <div class="channel-item ${channel.active === false ? 'inactive' : ''}">
            <div class="channel-item-logo">
                ${channel.logo ? 
                    `<img src="${channel.logo}" alt="${channel.name}">` : 
                    `<i class="fas fa-tv"></i>`
                }
            </div>
            <div class="channel-item-info">
                <h3>${channel.name}</h3>
                <div class="channel-meta">
                    <span class="meta-item">
                        <i class="fas fa-folder"></i> ${channel.category}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-broadcast-tower"></i> ${channel.streamType}
                    </span>
                    <span class="meta-item ${channel.active !== false ? 'active' : 'inactive'}">
                        <i class="fas fa-circle"></i> 
                        ${channel.active !== false ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <p>${channel.description || 'No description'}</p>
            </div>
            <div class="channel-item-actions">
                <button class="btn-edit" onclick="editChannel(${channel.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteChannel(${channel.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Admin: Delete channel
function deleteChannel(id) {
    if (confirm('Are you sure you want to delete this channel?')) {
        channels = channels.filter(ch => ch.id !== id);
        saveChannels();
        displayAdminChannels();
        
        // Reset form if editing this channel
        const editingId = document.getElementById('editChannelId').value;
        if (editingId && parseInt(editingId) === id) {
            resetForm();
        }
    }
}

// Update URL help text based on stream type
function updateUrlHelp() {
    const streamType = document.getElementById('streamType')?.value;
    const urlHelp = document.getElementById('urlHelp');
    
    if (!urlHelp) return;

    const helpTexts = {
        'm3u8': 'Enter M3U8/HLS stream URL (e.g., https://example.com/stream.m3u8)',
        'youtube': 'Enter YouTube video or live stream URL (e.g., https://youtube.com/watch?v=...)',
        'mp4': 'Enter direct MP4 video URL (e.g., https://example.com/video.mp4)',
        'embed': 'Enter embed URL or iframe source URL'
    };

    urlHelp.innerHTML = `<i class="fas fa-info-circle"></i> ${helpTexts[streamType] || 'Select a stream type first'}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Main page
    if (document.getElementById('channelsGrid')) {
        displayChannels();

        // Category filter
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                currentCategory = this.dataset.category;
                displayChannels(currentCategory);
            });
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                displayChannels(currentCategory, this.value);
            });
        }

        // Player controls
        document.getElementById('closePlayer')?.addEventListener('click', closePlayer);
        document.getElementById('nextChannel')?.addEventListener('click', nextChannel);
        document.getElementById('prevChannel')?.addEventListener('click', prevChannel);

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closePlayer();
            if (document.getElementById('playerSection').style.display === 'flex') {
                if (e.key === 'ArrowRight') nextChannel();
                if (e.key === 'ArrowLeft') prevChannel();
            }
        });
    }

    // Admin page
    if (document.getElementById('channelForm')) {
        document.getElementById('channelForm').addEventListener('submit', submitChannel);
        
        document.getElementById('cancelEdit')?.addEventListener('click', resetForm);
        
        document.getElementById('streamType')?.addEventListener('change', updateUrlHelp);
        
        // Admin search
        document.getElementById('adminSearch')?.addEventListener('input', function() {
            const category = document.getElementById('filterCategory').value;
            displayAdminChannels(category, this.value);
        });
        
        // Admin category filter
        document.getElementById('filterCategory')?.addEventListener('change', function() {
            const search = document.getElementById('adminSearch').value;
            displayAdminChannels(this.value, search);
        });
        
        displayAdminChannels();
        updateStats();
    }
});
