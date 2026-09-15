// ============================================================
// STREAMHUB - APP.JS
// Supabase channel database version
// ============================================================


// ============================================================
// TRANSLATION SYSTEM
// ============================================================

const translations = {

    en: {

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

        liveTV: "Live TV Channels",
        loadingChannels: "Loading channels...",
        noChannelsFound: "No channels found",
        noDescription: "No description available",

        previous: "Previous",
        next: "Next",

        copyright: "© 2024 StreamHub. All rights reserved.",
        adminLogin: "Admin Login",

        streamError: "Error loading stream. The stream might be offline.",
        invalidYouTube: "Invalid YouTube URL"

    },

    ar: {

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

        liveTV: "قنوات البث المباشر",
        loadingChannels: "جاري تحميل القنوات...",
        noChannelsFound: "لم يتم العثور على قنوات",
        noDescription: "لا يوجد وصف",

        previous: "السابق",
        next: "التالي",

        copyright: "© 2024 ستريم هاب. جميع الحقوق محفوظة.",
        adminLogin: "دخول المسؤول",

        streamError: "خطأ في تحميل البث. قد يكون البث غير متصل.",
        invalidYouTube: "رابط يوتيوب غير صالح"

    }

};


// ============================================================
// LANGUAGE
// ============================================================

function getCurrentLanguage() {

    return localStorage.getItem("language") || "en";

}


function setCurrentLanguage(lang) {

    localStorage.setItem("language", lang);

    updateLanguage();

}


function updateLanguage() {

    const lang = getCurrentLanguage();

    document.querySelectorAll("[data-i18n]").forEach(el => {

        const key = el.getAttribute("data-i18n");

        if (
            translations[lang] &&
            translations[lang][key]
        ) {

            const icon = el.querySelector("i");

            if (icon) {

                const iconHTML = icon.outerHTML;

                if (key === "previous") {

                    el.innerHTML =
                        `${iconHTML}
                        <span data-i18n="${key}">
                        ${translations[lang][key]}
                        </span>`;

                } else {

                    el.innerHTML =
                        `<span data-i18n="${key}">
                        ${translations[lang][key]}
                        </span>
                        ${iconHTML}`;

                }

            } else {

                el.textContent =
                    translations[lang][key];

            }

        }

    });


    document
        .querySelectorAll("[data-i18n-placeholder]")
        .forEach(el => {

            const key =
                el.getAttribute("data-i18n-placeholder");

            if (
                translations[lang] &&
                translations[lang][key]
            ) {

                el.placeholder =
                    translations[lang][key];

            }

        });


    document.documentElement.lang = lang;

    document.documentElement.dir =
        lang === "ar"
            ? "rtl"
            : "ltr";


    document
        .querySelectorAll(".lang-btn")
        .forEach(btn => {

            btn.classList.toggle(
                "active",
                btn.getAttribute("data-lang") === lang
            );

        });


    document.title =
        `${translations[lang].siteName} - Live TV Channels`;

}


// ============================================================
// CHANNEL DATA
// ============================================================

let channels = [];

let currentChannelIndex = 0;

let currentCategory = "all";

let hls = null;

let youtubePlayer = null;


// ============================================================
// LOAD CHANNELS FROM SUPABASE
// ============================================================

async function loadChannelsFromSupabase() {

    const channelsGrid =
        document.getElementById("channelsGrid");

    try {

        channelsGrid.innerHTML = `
            <p style="grid-column:1/-1;text-align:center;">
                ${translations[getCurrentLanguage()].loadingChannels}
            </p>
        `;


        const {
            data,
            error
        } = await supabaseClient
            .from("channels")
            .select("*")
            .eq("active", true)
            .order("id", {
                ascending: true
            });


        if (error) {

            console.error(
                "Supabase channel error:",
                error
            );

            throw error;

        }


        channels = (data || []).map(channel => ({

            id: channel.id,

            name: channel.name || "",

            url: channel.url || "",

            logo: channel.logo || "",

            category: channel.category || "entertainment",

            description:
                channel.description || "",

            streamType:
                channel.stream_type || "m3u8",

            active:
                channel.active !== false

        }));


        console.log(
            "Channels loaded from Supabase:",
            channels
        );


        displayChannels(
            currentCategory
        );


    } catch (error) {

        console.error(
            "Could not load channels:",
            error
        );


        channels = [];


        channelsGrid.innerHTML = `
            <div class="no-channels"
                 style="grid-column:1/-1;text-align:center;">

                <i class="fas fa-triangle-exclamation"></i>

                <p>
                    Unable to load channels.
                </p>

                <button
                    onclick="loadChannelsFromSupabase()"
                    style="margin-top:15px;padding:10px 20px;cursor:pointer;">

                    Retry

                </button>

            </div>
        `;

    }

}


// ============================================================
// YOUTUBE VIDEO ID
// ============================================================

function getYouTubeVideoId(url) {

    const regExp =
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;

    const match =
        url.match(regExp);

    return (
        match &&
        match[2] &&
        match[2].length === 11
    )
        ? match[2]
        : null;

}


// ============================================================
// DISPLAY CHANNELS
// ============================================================

function displayChannels(
    filter = "all",
    searchQuery = ""
) {

    const lang =
        getCurrentLanguage();

    const channelsGrid =
        document.getElementById("channelsGrid");


    let filteredChannels =
        channels.filter(
            ch => ch.active !== false
        );


    if (filter !== "all") {

        filteredChannels =
            filteredChannels.filter(
                ch => ch.category === filter
            );

    }


    if (searchQuery) {

        const query =
            searchQuery.toLowerCase();

        filteredChannels =
            filteredChannels.filter(ch =>

                ch.name
                    .toLowerCase()
                    .includes(query)

                ||

                (
                    ch.description &&
                    ch.description
                        .toLowerCase()
                        .includes(query)
                )

            );

    }


    if (filteredChannels.length === 0) {

        channelsGrid.innerHTML = `

            <div class="no-channels">

                <i class="fas fa-tv"></i>

                <p>
                    ${translations[lang].noChannelsFound}
                </p>

            </div>

        `;

        return;

    }


    const streamIcon = {

        m3u8: "fa-stream",

        youtube: "fa-youtube",

        mp4: "fa-film",

        embed: "fa-code"

    };


    channelsGrid.innerHTML =

        filteredChannels.map(channel => `

            <div
                class="channel-card"
                data-id="${channel.id}">

                <div class="channel-logo">

                    ${
                        channel.logo

                        ?

                        `<img
                            src="${channel.logo}"
                            alt="${channel.name}"
                            onerror="
                                this.style.display='none';
                                this.parentElement.innerHTML='<i class=\\'fas fa-tv\\'></i>';
                            ">`

                        :

                        `<i class="fas fa-tv"></i>`
                    }

                </div>


                <div class="channel-info">

                    <h3 class="channel-name">
                        ${channel.name}
                    </h3>


                    <div class="channel-tags">

                        <span class="channel-category">
                            ${
                                translations[lang][channel.category]
                                ||
                                channel.category
                                ||
                                ""
                            }
                        </span>


                        <span class="stream-type">

                            <i class="fas ${
                                streamIcon[channel.streamType]
                                ||
                                "fa-broadcast-tower"
                            }"></i>

                            ${
                                channel.streamType
                                ? channel.streamType.toUpperCase()
                                : ""
                            }

                        </span>

                    </div>


                    <p class="channel-desc">

                        ${
                            channel.description
                            ||
                            translations[lang].noDescription
                        }

                    </p>

                </div>

            </div>

        `).join("");


    document
        .querySelectorAll(".channel-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                function() {

                    const id =
                        this.dataset.id;

                    const index =
                        channels.findIndex(
                            ch =>
                                String(ch.id) ===
                                String(id)
                        );

                    if (index !== -1) {

                        playChannel(index);

                    }

                }
            );

        });

}


// ============================================================
// PLAY CHANNEL
// ============================================================

function playChannel(index) {

    currentChannelIndex =
        index;


    const channel =
        channels[index];

    if (!channel) return;


    const lang =
        getCurrentLanguage();


    const playerSection =
        document.getElementById(
            "playerSection"
        );

    const videoPlayer =
        document.getElementById(
            "videoPlayer"
        );

    const youtubePlayerDiv =
        document.getElementById(
            "youtubePlayer"
        );

    const embedPlayer =
        document.getElementById(
            "embedPlayer"
        );


    document.getElementById(
        "currentChannelName"
    ).textContent =
        channel.name;


    document.getElementById(
        "currentChannelDesc"
    ).textContent =
        channel.description ||
        translations[lang].noDescription;


    const badge =
        document.getElementById(
            "streamTypeBadge"
        );


    badge.textContent =
        (
            channel.streamType ||
            ""
        ).toUpperCase();


    badge.className =
        `stream-type-badge ${channel.streamType || ""}`;


    playerSection.style.display =
        "flex";


    videoPlayer.style.display =
        "none";

    youtubePlayerDiv.style.display =
        "none";

    embedPlayer.style.display =
        "none";


    if (hls) {

        hls.destroy();

        hls = null;

    }


    if (youtubePlayer) {

        youtubePlayer.destroy();

        youtubePlayer = null;

    }


    switch (channel.streamType) {

        case "m3u8":

            videoPlayer.style.display =
                "block";

            playM3U8(
                channel.url,
                videoPlayer
            );

            break;


        case "youtube":

            youtubePlayerDiv.style.display =
                "block";

            playYouTube(
                channel.url,
                youtubePlayerDiv
            );

            break;


        case "mp4":

            videoPlayer.style.display =
                "block";

            videoPlayer.src =
                channel.url;

            videoPlayer
                .play()
                .catch(
                    e =>
                        console.error(
                            "Playback error:",
                            e
                        )
                );

            break;


        case "embed":

            embedPlayer.style.display =
                "block";

            embedPlayer.src =
                channel.url;

            break;


        default:

            console.error(
                "Unknown stream type:",
                channel.streamType
            );

    }

}


// ============================================================
// M3U8 PLAYER
// ============================================================

function playM3U8(
    url,
    videoElement
) {

    const lang =
        getCurrentLanguage();


    if (
        typeof Hls !== "undefined" &&
        Hls.isSupported()
    ) {

        hls =
            new Hls({

                enableWorker: true,

                lowLatencyMode: true

            });


        hls.loadSource(url);

        hls.attachMedia(videoElement);


        hls.on(
            Hls.Events.MANIFEST_PARSED,
            function() {

                videoElement
                    .play()
                    .catch(
                        e =>
                            console.error(
                                "Playback error:",
                                e
                            )
                    );

            }
        );


        hls.on(
            Hls.Events.ERROR,
            function(
                event,
                data
            ) {

                if (data.fatal) {

                    console.error(
                        "HLS Error:",
                        data
                    );

                    alert(
                        translations[lang]
                            .streamError
                    );

                }

            }
        );


    } else if (
        videoElement.canPlayType(
            "application/vnd.apple.mpegurl"
        )
    ) {

        videoElement.src =
            url;


        videoElement.addEventListener(
            "loadedmetadata",
            function() {

                videoElement
                    .play()
                    .catch(
                        e =>
                            console.error(
                                "Playback error:",
                                e
                            )
                    );

            },
            { once: true }
        );


    } else {

        alert(
            lang === "ar"

                ?

                "المتصفح الخاص بك لا يدعم تشغيل HLS. يرجى استخدام متصفح آخر."

                :

                "Your browser does not support HLS playback. Please try a different browser."
        );

    }

}


// ============================================================
// YOUTUBE PLAYER
// ============================================================

function playYouTube(
    url,
    containerElement
) {

    const lang =
        getCurrentLanguage();


    const videoId =
        getYouTubeVideoId(url);


    if (!videoId) {

        alert(
            translations[lang]
                .invalidYouTube
        );

        return;

    }


    containerElement.innerHTML =
        "";


    const playerDiv =
        document.createElement(
            "div"
        );


    playerDiv.id =
        "yt-player-" +
        Date.now();


    containerElement.appendChild(
        playerDiv
    );


    if (
        typeof YT !== "undefined" &&
        YT.Player
    ) {

        youtubePlayer =
            new YT.Player(
                playerDiv.id,
                {

                    width: "100%",

                    height: "100%",

                    videoId: videoId,

                    playerVars: {

                        autoplay: 1,

                        controls: 1,

                        rel: 0,

                        modestbranding: 1

                    },

                    events: {

                        onError:
                            function(event) {

                                console.error(
                                    "YouTube error:",
                                    event.data
                                );

                                alert(
                                    translations[lang]
                                        .streamError
                                );

                            }

                    }

                }
            );


    } else {

        playerDiv.innerHTML = `

            <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/${videoId}?autoplay=1"
                frameborder="0"
                allowfullscreen
                allow="autoplay">
            </iframe>

        `;

    }

}


// ============================================================
// CLOSE PLAYER
// ============================================================

function closePlayer() {

    const playerSection =
        document.getElementById(
            "playerSection"
        );

    const videoPlayer =
        document.getElementById(
            "videoPlayer"
        );


    playerSection.style.display =
        "none";


    videoPlayer.pause();

    videoPlayer.src =
        "";


    if (hls) {

        hls.destroy();

        hls = null;

    }


    if (youtubePlayer) {

        youtubePlayer.destroy();

        youtubePlayer = null;

    }


    document.getElementById(
        "youtubePlayer"
    ).innerHTML = "";


    document.getElementById(
        "embedPlayer"
    ).src = "";

}


// ============================================================
// NEXT CHANNEL
// ============================================================

function nextChannel() {

    const activeChannels =
        channels.filter(
            ch => ch.active !== false
        );


    if (
        activeChannels.length === 0
    ) return;


    const currentChannel =
        channels[currentChannelIndex];


    const currentActiveIndex =
        activeChannels.findIndex(
            ch =>
                ch.id ===
                currentChannel.id
        );


    const nextActiveIndex =
        (
            currentActiveIndex + 1
        ) %
        activeChannels.length;


    const nextCh =
        activeChannels[
            nextActiveIndex
        ];


    const nextIndex =
        channels.findIndex(
            ch =>
                ch.id ===
                nextCh.id
        );


    playChannel(nextIndex);

}


// ============================================================
// PREVIOUS CHANNEL
// ============================================================

function prevChannel() {

    const activeChannels =
        channels.filter(
            ch => ch.active !== false
        );


    if (
        activeChannels.length === 0
    ) return;


    const currentChannel =
        channels[currentChannelIndex];


    const currentActiveIndex =
        activeChannels.findIndex(
            ch =>
                ch.id ===
                currentChannel.id
        );


    const prevActiveIndex =
        (
            currentActiveIndex -
            1 +
            activeChannels.length
        ) %
        activeChannels.length;


    const prevCh =
        activeChannels[
            prevActiveIndex
        ];


    const prevIndex =
        channels.findIndex(
            ch =>
                ch.id ===
                prevCh.id
        );


    playChannel(prevIndex);

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        // Language
        updateLanguage();


        // Language buttons
        document
            .querySelectorAll(".lang-btn")
            .forEach(btn => {

                btn.addEventListener(
                    "click",
                    function() {

                        setCurrentLanguage(
                            this.getAttribute(
                                "data-lang"
                            )
                        );


                        displayChannels(
                            currentCategory
                        );

                    }
                );

            });


        // Load channels from Supabase
        await loadChannelsFromSupabase();


        // Category filters
        document
            .querySelectorAll(".nav-link")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    function(e) {

                        e.preventDefault();


                        document
                            .querySelectorAll(
                                ".nav-link"
                            )
                            .forEach(l =>
                                l.classList.remove(
                                    "active"
                                )
                            );


                        this.classList.add(
                            "active"
                        );


                        currentCategory =
                            this.dataset.category;


                        const searchInput =
                            document.getElementById(
                                "searchInput"
                            );


                        displayChannels(
                            currentCategory,
                            searchInput
                                ? searchInput.value
                                : ""
                        );

                    }
                );

            });


        // Search
        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                function() {

                    displayChannels(
                        currentCategory,
                        this.value
                    );

                }
            );

        }


        // Close
        const closeBtn =
            document.getElementById(
                "closePlayer"
            );


        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                closePlayer
            );

        }


        // Next
        const nextBtn =
            document.getElementById(
                "nextChannel"
            );


        if (nextBtn) {

            nextBtn.addEventListener(
                "click",
                nextChannel
            );

        }


        // Previous
        const prevBtn =
            document.getElementById(
                "prevChannel"
            );


        if (prevBtn) {

            prevBtn.addEventListener(
                "click",
                prevChannel
            );

        }


        // Keyboard
        document.addEventListener(
            "keydown",
            function(e) {

                const playerSection =
                    document.getElementById(
                        "playerSection"
                    );


                if (
                    e.key === "Escape" &&
                    playerSection &&
                    playerSection.style.display === "flex"
                ) {

                    closePlayer();

                }


                if (
                    playerSection &&
                    playerSection.style.display === "flex"
                ) {

                    if (
                        e.key === "ArrowRight"
                    ) {

                        nextChannel();

                    }


                    if (
                        e.key === "ArrowLeft"
                    ) {

                        prevChannel();

                    }

                }

            }
        );

    }
);
