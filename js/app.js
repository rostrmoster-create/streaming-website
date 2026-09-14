// Initialize channels array from localStorage or use default channels
let channels = JSON.parse(localStorage.getItem('channels')) || [
    {
        id: 1,
        name: "BBC News Live",
        url: "https://d2vnbkvjbims7j.cloudfront.net/containerA/LTN/playlist.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/BBC_News_2019.svg/320px-BBC_News_2019.svg.png",
        category: "news",
        description: "24/7 Breaking News Coverage",
        streamType: "m3u8",
        active: true
    },
    {
        id: 2,
        name: "NASA TV",
        url: "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png",
        category: "documentary",
        description: "NASA's Official Live Stream",
        streamType: "m3u8",
        active: true
    },
    {
        id: 3,
        name: "Red Bull TV",
        url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
        logo: "https://i.imgur.com/7GackIk.png",
        category: "sports",
        description: "Extreme Sports & Entertainment",
        streamType: "m3u8",
        active: true
    },
    {
        id: 4,
        name: "Al Jazeera English",
        url: "https://live-hls-web-aje.getaj.net/AJE/index.m3u8",
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Aljazeera_eng.svg/240px-Aljazeera_eng.svg.png",
        category: "news",
        description: "International News Channel",
        streamType: "m3u8",
        active: true
    },
    {
        id: 5,
        name: "Lofi Girl Radio",
        url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
        logo: "https://yt3.googleusercontent.com/2YQXS_emon2PnADRRIB9JGrGGhbnCgAIWcuXzXdZa0FTKqdTA2Jt6om0A-fD8PXJ6cGbT_NJcg=s176-c-k-c0x00ffffff-no-rj",
        category: "music",
        description: "24/7 Lofi Hip Hop Music",
        streamType: "youtube",
        active: true
    }
];

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
            (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    if (filteredChannels.length === 0) {
        channelsGrid.innerHTML = `
            <div class="no-channels" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-tv" style="font-size: 4rem; opacity: 0.3; display: block; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.2rem; opacity: 0.7;">No channels found</p>
            </div>
        `;
        return;
    }

    const streamIcon = {
        'm3u8': 'fa-stream',
        'youtube': 'fa-youtube',
        'mp4': 'fa-film',
        'embed': 'fa-code'
    };

    channelsGrid.innerHTML = filteredChannels.map((channel) => {
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
    if (channelName) channelName.textContent = channel.name;
    if (channelDesc) channelDesc.textContent = channel.description || '';
    if (streamTypeBadge) {
        streamTypeBadge.textContent = channel.streamType.toUpperCase();
        streamTypeBadge.className = `stream-type-badge ${channel.streamType}`;
    }

    // Show player
    playerSection.style.display = 'flex';

    // Hide all players first
    if (videoPlayer) videoPlayer.style.display = 'none';
    if (youtubePlayerDiv) youtubePlayerDiv.style.display = 'none';
    if (embedPlayer) embedPlayer.style.display = 'none';

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
            if (videoPlayer) {
                videoPlayer.style.display = 'block';
                playM3U8(channel.url, videoPlayer);
            }
            break;
            
        case 'youtube':
            if (youtubePlayerDiv) {
                youtubePlayerDiv.style.display = 'block';
                playYouTube(channel.url, youtubePlayerDiv);
            }
            break;
            
        case 'mp4':
            if (videoPlayer) {
                videoPlayer.style.display = 'block';
                videoPlayer.src = channel.url;
                videoPlayer.play().catch(e => console.error('Playback error:', e));
            }
            break;
            
        case 'embed':
            if (embedPlayer) {
                embedPlayer.style.display = 'block';
                embedPlayer.src = channel.url;
            }
            break;
    }
}

// Play M3U8 stream
function playM3U8(url, videoElement) {
    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
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
                alert('Error loading stream. The stream might be offline or the URL is incorrect.');
            }
        });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // For Safari
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', function() {
            videoElement.play().catch(e => console.error('Playback error:', e));
        });
    } else {
        alert('Your browser does not support HLS playback. Please try a different browser.');
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
                    alert('Error loading YouTube stream. The video might be unavailable.');
                }
            }
        });
    } else {
        // Fallback to iframe
        playerDiv.innerHTML = `
            <iframe width="100%" height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" allowfullscreen allow="autoplay">
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
    if (activeChannels.length === 0) return;
    
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
    if (activeChannels.length === 0) return;
    
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
    const name = document.getElementById('channelName').value.trim();
    const url = document.getElementById('channelUrl').value.trim();
    const logo = document.getElementById('channelLogo').value.trim();
    const category = document.getElementById('channelCategory').value;
    const description = document.getElementById('channelDesc').value.trim();
    const streamType = document.getElementById('streamType').value;
    const active = document.getElementById('channelActive').checked;

    if (!name || !url || !category || !streamType) {
        alert('Please fill in all required fields!');
        return;
    }

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
    const form = document.getElementById('channelForm');
    if (form) form.reset();
    
    const editId = document.getElementById('editChannelId');
    if (editId) editId.value = '';
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Channel';
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Channel';
    
    const cancelBtn = document.getElementById('cancelEdit');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
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
            (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    if (filteredChannels.length === 0) {
        channelsList.innerHTML = '<p class="no-data" style="text-align: center; padding: 2rem; opacity: 0.7;">No channels found.</p>';
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
        const editingId = document.getElementById('editChannelId');
        if (editingId && editingId.value && parseInt(editingId.value) === id) {
            resetForm();
        }
    }
}

// Update URL help text based on stream type
function updateUrlHelp() {
    const streamType = document.getElementById('streamType');
    const urlHelp = document.getElementById('urlHelp');
    
    if (!urlHelp || !streamType) return;

    const helpTexts = {
        'm3u8': 'Enter M3U8/HLS stream URL (e.g., https://example.com/stream.m3u8)',
        'youtube': 'Enter YouTube video or live stream URL (e.g., https://youtube.com/watch?v=...)',
        'mp4': 'Enter direct MP4 video URL (e.g., https://example.com/video.mp4)',
        'embed': 'Enter embed URL or iframe source URL'
    };

    urlHelp.innerHTML = `<i class="fas fa-info-circle"></i> ${helpTexts[streamType.value] || 'Select a stream type first'}`;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    console.log('Total channels:', channels.length);
    
    // Main page
    if (document.getElementById('channelsGrid')) {
        console.log('Main page detected');
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
        const closeBtn = document.getElementById('closePlayer');
        if (closeBtn) {
            closeBtn.addEventListener('click', closePlayer);
        }
        
        const nextBtn = document.getElementById('nextChannel');
        if (nextBtn) {
            nextBtn.addEventListener('click', nextChannel);
        }
        
        const prevBtn = document.getElementById('prevChannel');
        if (prevBtn) {
            prevBtn.addEventListener('click', prevChannel);
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            const playerSection = document.getElementById('playerSection');
            if (e.key === 'Escape' && playerSection && playerSection.style.display === 'flex') {
                closePlayer();
            }
            if (playerSection && playerSection.style.display === 'flex') {
                if (e.key === 'ArrowRight') nextChannel();
                if (e.key === 'ArrowLeft') prevChannel();
            }
        });
    }

    // Admin page
    if (document.getElementById('channelForm')) {
        console.log('Admin page detected');
        
        const form = document.getElementById('channelForm');
        if (form) {
            form.addEventListener('submit', submitChannel);
        }
        
        const cancelBtn = document.getElementById('cancelEdit');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', resetForm);
        }
        
        const streamTypeSelect = document.getElementById('streamType');
        if (streamTypeSelect) {
            streamTypeSelect.addEventListener('change', updateUrlHelp);
        }
        
        // Admin search
        const adminSearch = document.getElementById('adminSearch');
        if (adminSearch) {
            adminSearch.addEventListener('input', function() {
                const category = document.getElementById('filterCategory').value;
                displayAdminChannels(category, this.value);
            });
        }
        
        // Admin category filter
        const filterCategory = document.getElementById('filterCategory');
        if (filterCategory) {
            filterCategory.addEventListener('change', function() {
                const search = document.getElementById('adminSearch').value;
                displayAdminChannels(this.value, search);
            });
        }
        
        displayAdminChannels();
        updateStats();
    }
});

// Make functions globally accessible for onclick handlers
window.editChannel = editChannel;
window.deleteChannel = deleteChannel;
