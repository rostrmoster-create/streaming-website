// ===== Translation System =====
const translations = {
    en: {
        // Header & Navigation
        siteName: "StreamHub",
        allChannels: "All Channels",
        sports: "Sports",
        news: "News",
        entertainment: "Entertainment",
        movies: "Movies",
        music: "Music",
        documentary: "Documentary",
        kids: "Kids",
        searchPlaceholder: "Search channels...",
        
        // Main Content
        liveTV: "Live TV Channels",
        loadingChannels: "Loading channels...",
        noChannelsFound: "No channels found",
        noDescription: "No description available",
        
        // Player
        previous: "Previous",
        next: "Next",
        
        // Footer
        copyright: "© 2024 StreamHub. All rights reserved.",
        adminLogin: "Admin Login",
        
        // Messages
        streamError: "Error loading stream. The stream might be offline.",
        invalidYouTube: "Invalid YouTube URL"
    },
    ar: {
        // Header & Navigation
        siteName: "ستريم هاب",
        allChannels: "جميع القنوات",
        sports: "رياضة",
        news: "أخبار",
        entertainment: "ترفيه",
        movies: "أفلام",
        music: "موسيقى",
        documentary: "وثائقي",
        kids: "أطفال",
        searchPlaceholder: "البحث عن القنوات...",
        
        // Main Content
        liveTV: "قنوات البث المباشر",
        loadingChannels: "جاري تحميل القنوات...",
        noChannelsFound: "لم يتم العثور على قنوات",
        noDescription: "لا يوجد وصف",
        
        // Player
        previous: "السابق",
        next: "التالي",
        
        // Footer
        copyright: "© 2024 ستريم هاب. جميع الحقوق محفوظة.",
        adminLogin: "دخول المسؤول",
        
        // Messages
        streamError: "خطأ في تحميل البث. قد يكون البث غير متصل.",
        invalidYouTube: "رابط يوتيوب غير صالح"
    }
};

// Language management functions
function getCurrentLanguage() {
    return localStorage.getItem('language') || 'en';
}

function setCurrentLanguage(lang) {
    localStorage.setItem('language', lang);
    updateLanguage();
}

function updateLanguage() {
    const lang = getCurrentLanguage();

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            // Check if element is a button with icon
            const icon = el.querySelector('i');
            if (icon) {
                const iconHTML = icon.outerHTML;
                el.innerHTML = key === 'previous' 
                    ? `${iconHTML} <span data-i18n="${key}">${translations[lang][key]}</span>`
                    : `<span data-i18n="${key}">${translations[lang][key]}</span> ${iconHTML}`;
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    // Update document language and direction
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update active button in language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Update page title
    if (translations[lang].siteName) {
        document.title = `${translations[lang].siteName} - Live TV Channels`;
    }
}

// ===== Channels Data =====
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

// Save channels to localStorage
function saveChannels() {
    localStorage.setItem('channels', JSON.stringify(channels));
}

// Get YouTube video ID from URL
function getYouTubeVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Display channels
function displayChannels(filter = 'all', searchQuery = '') {
    const lang = getCurrentLanguage();
    const channelsGrid = document.getElementById('channelsGrid');
    let filteredChannels = channels.filter(ch => ch.active !== false);

    if (filter !== 'all') {
        filteredChannels = filteredChannels.filter(ch => ch.category === filter);
    }

    if (searchQuery) {
        filteredChannels = filteredChannels.filter(ch =>
            ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (ch.description && ch.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    if (filteredChannels.length === 0) {
        channelsGrid.innerHTML = `
            <div class="no-channels">
                <i class="fas fa-tv"></i>
                <p>${translations[lang].noChannelsFound}</p>
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

    channelsGrid.innerHTML = filteredChannels.map((channel) => `
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
                    <span class="channel-category">${translations[lang][channel.category] || channel.category}</span>
                    <span class="stream-type">
                        <i class="fas ${streamIcon[channel.streamType] || 'fa-broadcast-tower'}"></i>
                        ${channel.streamType.toUpperCase()}
                    </span>
                </div>
                <p class="channel-desc">${channel.description || translations[lang].noDescription}</p>
            </div>
        </div>
    `).join('');

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

// Play channel
function playChannel(index) {
    currentChannelIndex = index;
    const channel = channels[index];
    const lang = getCurrentLanguage();

    const playerSection = document.getElementById('playerSection');
    const videoPlayer = document.getElementById('videoPlayer');
    const youtubePlayerDiv = document.getElementById('youtubePlayer');
    const embedPlayer = document.getElementById('embedPlayer');

    document.getElementById('currentChannelName').textContent = channel.name;
    document.getElementById('currentChannelDesc').textContent = channel.description || translations[lang].noDescription;

    const badge = document.getElementById('streamTypeBadge');
    badge.textContent = channel.streamType.toUpperCase();
    badge.className = `stream-type-badge ${channel.streamType}`;

    playerSection.style.display = 'flex';

    videoPlayer.style.display = 'none';
    youtubePlayerDiv.style.display = 'none';
    embedPlayer.style.display = 'none';

    if (hls) {
        hls.destroy();
        hls = null;
    }
    if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }

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
            videoPlayer.play().catch(e => console.error('Playback error:', e));
            break;
        case 'embed':
            embedPlayer.style.display = 'block';
            embedPlayer.src = channel.url;
            break;
    }
}

// Play M3U8
function playM3U8(url, videoElement) {
    const lang = getCurrentLanguage();
    
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
                alert(translations[lang].streamError);
            }
        });
    } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = url;
        videoElement.addEventListener('loadedmetadata', function() {
            videoElement.play().catch(e => console.error('Playback error:', e));
        });
    } else {
        alert(lang === 'ar' ? 
            'المتصفح الخاص بك لا يدعم تشغيل HLS. يرجى استخدام متصفح آخر.' :
            'Your browser does not support HLS playback. Please try a different browser.');
    }
}

// Play YouTube
function playYouTube(url, containerElement) {
    const lang = getCurrentLanguage();
    const videoId = getYouTubeVideoId(url);
    
    if (!videoId) {
        alert(translations[lang].invalidYouTube);
        return;
    }

    containerElement.innerHTML = '';
    const playerDiv = document.createElement('div');
    playerDiv.id = 'yt-player-' + Date.now();
    containerElement.appendChild(playerDiv);

    if (typeof YT !== 'undefined' && YT.Player) {
        youtubePlayer = new YT.Player(playerDiv.id, {
            width: '100%',
            height: '100%',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'rel': 0,
                'modestbranding': 1
            },
            events: {
                'onError': function(event) {
                    console.error('YouTube Player Error:', event.data);
                    alert(translations[lang].streamError);
                }
            }
        });
    } else {
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
    document.getElementById('playerSection').style.display = 'none';
    const videoPlayer = document.getElementById('videoPlayer');
    videoPlayer.pause();
    videoPlayer.src = '';
    
    if (hls) {
        hls.destroy();
        hls = null;
    }
    if (youtubePlayer) {
        youtubePlayer.destroy();
        youtubePlayer = null;
    }
    document.getElementById('embedPlayer').src = '';
}

// Next/Previous channel
function nextChannel() {
    const activeChannels = channels.filter(ch => ch.active !== false);
    if (activeChannels.length === 0) return;
    
    const currentChannel = channels[currentChannelIndex];
    const currentActiveIndex = activeChannels.findIndex(ch => ch.id === currentChannel.id);
    const nextActiveIndex = (currentActiveIndex + 1) % activeChannels.length;
    const nextCh = activeChannels[nextActiveIndex];
    const nextIndex = channels.findIndex(ch => ch.id === nextCh.id);
    playChannel(nextIndex);
}

function prevChannel() {
    const activeChannels = channels.filter(ch => ch.active !== false);
    if (activeChannels.length === 0) return;
    
    const currentChannel = channels[currentChannelIndex];
    const currentActiveIndex = activeChannels.findIndex(ch => ch.id === currentChannel.id);
    const prevActiveIndex = (currentActiveIndex - 1 + activeChannels.length) % activeChannels.length;
    const prevCh = activeChannels[prevActiveIndex];
    const prevIndex = channels.findIndex(ch => ch.id === prevCh.id);
    playChannel(prevIndex);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language
    updateLanguage();

    // Add language switcher event listeners
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setCurrentLanguage(this.getAttribute('data-lang'));
            displayChannels(currentCategory); // Refresh channels with new language
        });
    });

    // Save initial channels to localStorage if empty
    if (!localStorage.getItem('channels')) {
        saveChannels();
    }

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
});
