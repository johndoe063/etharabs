import * as Payments from './payments.js';
console.log(Payments); // Check the console to see all exported functions.

// Global initialization for telegramUser to avoid "Can't find variable" errors
window.telegramUser = null;

// User object to store Telegram user data
let telegramUser = null;

// Make openUserProfileModal globally accessible
window.openUserProfileModal = openUserProfileModal;

// Function to open user profile modal and populate data
function openUserProfileModal() {
    // Get current mining and earnings data
    const earnedETH = parseFloat(document.getElementById('earnedETH').textContent) || 0;
    const miningSpeed = document.getElementById('miningSpeed').textContent || '0.00 H/s';
    const referralsCount = parseInt(document.getElementById('referralCount').textContent) || 0;
    const referralPercent = Math.min((referralsCount / 25) * 100, 100);
    const isMiningActive = document.getElementById('miningStatusIcon').className.includes('green');

    // Update profile modal with user data
    const userData = getTelegramUser();
    document.getElementById('profileModalPic').src = userData.photo_url || "https://ui-avatars.com/api/?name=" + encodeURIComponent(userData.first_name) + "&background=random";
    document.getElementById('profileModalName').textContent = userData.first_name + (userData.last_name ? ' ' + userData.last_name : '');
    document.getElementById('profileModalUsername').textContent = (userData.username ? userData.username : '') + '@';


    // Update stats
    document.getElementById('profileModalEarningsETH').textContent = earnedETH.toFixed(6) + ' ETH';
    document.getElementById('profileModalEarningsUSD').textContent = '$' + document.getElementById('earnedUSD').textContent || 0;
    document.getElementById('profileModalReferrals').textContent = referralsCount + ' / 25';
    document.getElementById('profileModalReferralBar').style.width = `${referralPercent}%`;
    document.getElementById('profileModalMiningSpeed').textContent = miningSpeed;

    // Update mining status
    const miningStatusEl = document.getElementById('profileModalMiningStatus');
    if (isMiningActive) {
        miningStatusEl.textContent = 'نشط';
        miningStatusEl.className = 'text-xs font-medium py-1 px-2 rounded-full bg-green-500/20 text-green-400';
        miningStatusEl.innerHTML = '<i class="fas fa-circle mr-1 text-xs animate-pulse"></i>نشط';
    } else {
        miningStatusEl.textContent = 'غير نشط';
        miningStatusEl.className = 'text-xs font-medium py-1 px-2 rounded-full bg-red-500/20 text-red-400';
        miningStatusEl.innerHTML = '<i class="fas fa-circle mr-1 text-xs"></i>غير نشط';
    }

    // Show modal
    document.getElementById('userProfileModal').classList.remove('hidden');
}

// Helper function to safely get telegramUser
function getTelegramUser() {
    // First try the local variable
    if (telegramUser !== null && telegramUser !== undefined) {
        return telegramUser;
    }

    // Then try the global variable
    if (window.telegramUser !== null && window.telegramUser !== undefined) {
        telegramUser = window.telegramUser; // Sync them
        return telegramUser;
    }

    // If all else fails, create a minimal user object
    telegramUser = { id: 'guest-' + Date.now(), first_name: 'Guest' };
    window.telegramUser = telegramUser; // Sync them
    return telegramUser;
}

// Initialize Telegram Web App
document.addEventListener('DOMContentLoaded', function() {
    // Check if Telegram WebApp is available
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;

        // Try setting Telegram native header - these will silently fail in v6.0 but work in others
        try {
            tg.setHeaderColor('bg_color');
            tg.setBackgroundColor('#0f101a');
        } catch (e) {
            console.log("Couldn't set Telegram header colors, using custom header");
        }

        // Initialize Telegram Web App
        tg.expand();

        // Get user info
        const user = tg.initDataUnsafe.user;
        if (user) {
            // Store user data
            telegramUser = {
                id: user.id || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                photo_url: user.photo_url || '',
                auth_date: new Date().toISOString()
            };

            // Save to localStorage for persistence
            localStorage.setItem(USER_DATA_KEY, JSON.stringify(telegramUser));

            // Display user profile
            updateUserInterface(telegramUser);

            // Load user-specific data
            loadUserData(telegramUser.id);
        }
    } else {
        // If Telegram WebApp is not available, try to load from localStorage
        const savedUser = localStorage.getItem(USER_DATA_KEY);
        if (savedUser) {
            telegramUser = JSON.parse(savedUser);
            updateUserInterface(telegramUser);
            loadUserData(telegramUser.id);
        }
    }
});

// Update user interface with Telegram user data
function updateUserInterface(user) {
    if (!user) return;

    // Header profile
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userProfilePic = document.getElementById('userProfilePic');

    // Wallet modal profile
    const walletUserName = document.getElementById('walletUserName');
    const walletUserPic = document.getElementById('walletUserPic');

    // Set user name in header (shortened to prevent overflow)
    userName.textContent = user.first_name;

    // Set user name in wallet modal (full name)
    walletUserName.textContent = user.first_name + (user.last_name ? ' ' + user.last_name : '');

    // Set profile pictures
    if (user.photo_url) {
        userProfilePic.src = user.photo_url;
        walletUserPic.src = user.photo_url;
    } else {
        // Fallback profile picture
        const fallbackUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.first_name) + "&background=random";
        userProfilePic.src = fallbackUrl;
        walletUserPic.src = fallbackUrl;
    }

    // Show user profile sections
    userProfile.classList.remove('hidden');
}

// Load user-specific data
function loadUserData(userId) {
    if (!userId) return;

    // User-specific localStorage keys
    const USER_ETH_KEY = `earnedETH_${userId}`;
    const USER_MINING_KEY = `isMining_${userId}`;
    const USER_REFERRALS_KEY = `referrals_${userId}`;
    const USER_LAST_UPDATE_KEY = `lastUpdateTime_${userId}`;
    const USER_SHARED_TO_KEY = `sharedTo_${userId}`;

    // Load mining status and ETH earned
    ethCounter = parseFloat(localStorage.getItem(USER_ETH_KEY)) || 0;
    isMining = localStorage.getItem(USER_MINING_KEY) === 'true';
    referrals = parseInt(localStorage.getItem(USER_REFERRALS_KEY)) || 0;
    lastUpdateTime = parseInt(localStorage.getItem(USER_LAST_UPDATE_KEY)) || Date.now();

    // Load shared users
    const sharedTo = JSON.parse(localStorage.getItem(USER_SHARED_TO_KEY) || '[]');

    // Update UI based on loaded data
    updateUI();
    updateReferralUI();

    // Set mining button state
    const mainActionBtn = document.getElementById('mainActionBtn');
    if (isMining) {
        mainActionBtn.innerHTML = '<i class="fas fa-stop-circle mr-2"></i>إيقاف التعدين';
        mainActionBtn.className = 'premium-button mining-btn-active text-base py-4 w-full max-w-xs mx-auto';
    } else {
        mainActionBtn.innerHTML = '<i class="fas fa-play-circle mr-2"></i>بدء التعدين';
        mainActionBtn.className = 'premium-button mining-btn-inactive text-base py-4 w-full max-w-xs mx-auto';
    }
}

// Save user-specific data
function saveUserData() {
    if (!telegramUser || !telegramUser.id) return;

    const userId = telegramUser.id;

    // User-specific localStorage keys
    const USER_ETH_KEY = `earnedETH_${userId}`;
    const USER_MINING_KEY = `isMining_${userId}`;
    const USER_REFERRALS_KEY = `referrals_${userId}`;
    const USER_LAST_UPDATE_KEY = `lastUpdateTime_${userId}`;

    // Save mining status and ETH earned
    localStorage.setItem(USER_ETH_KEY, ethCounter.toString());
    localStorage.setItem(USER_MINING_KEY, isMining.toString());
    localStorage.setItem(USER_REFERRALS_KEY, referrals.toString());
    localStorage.setItem(USER_LAST_UPDATE_KEY, lastUpdateTime.toString());
}

// Update referral UI with enhanced status display
function updateReferralUI() {
    const maxReferrals = 25;
    const referralPercent = Math.min((referrals / maxReferrals) * 100, 100);

    // Update progress bar with animation
    const progressBar = document.getElementById('referralProgressBar');
    progressBar.style.width = `${referralPercent}%`;

    // Add transition effect if not already present
    if (!progressBar.style.transition) {
        progressBar.style.transition = 'width 0.5s ease-out';
    }

    // Update referral fee discount
    const discount = Math.floor(referrals / 50) * 5;
    document.getElementById('referralFeeDiscount').textContent = discount;

    // Update withdrawal status with icon and text
    const withdrawStatus = document.getElementById('withdrawStatus');
    const withdrawStatusIcon = document.getElementById('withdrawStatusIcon');

    if (referrals >= 25) {
        withdrawStatus.textContent = 'مفعل';
        withdrawStatus.className = 'text-base font-bold text-green-400';
        withdrawStatusIcon.className = 'mr-2 text-green-400';
        withdrawStatusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    } else {
        withdrawStatus.textContent = 'غير مفعل';
        withdrawStatus.className = 'text-base font-bold text-red-400';
        withdrawStatusIcon.className = 'mr-2 text-red-400';
        withdrawStatusIcon.innerHTML = '<i class="fas fa-times-circle"></i>';
    }
}

// Tracking shared users for referrals
function trackSharedUser(targetUserId) {
    if (!telegramUser || !telegramUser.id) return false;

    const userId = telegramUser.id;
    const USER_SHARED_TO_KEY = `sharedTo_${userId}`;

    // Get existing shared users
    const sharedTo = JSON.parse(localStorage.getItem(USER_SHARED_TO_KEY) || '[]');

    // Check if already shared to this user
    if (sharedTo.includes(targetUserId)) {
        return false; // Already shared to this user
    }

    // Add new user and save
    sharedTo.push(targetUserId);
    localStorage.setItem(USER_SHARED_TO_KEY, JSON.stringify(sharedTo));
    return true; // Successfully tracked new user
}

let ethPrice = 0; // Default value before WebSocket updates
// Binance WebSocket URL for real-time ETH/USDT trade updates
const socket = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade');
// When a message is received from the WebSocket
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    ethPrice = parseFloat(data.p).toFixed(2);
    document.getElementById('ETHpricenow').textContent = ethPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });;
};
// Handle WebSocket errors
socket.onerror = (error) => {
    console.error("WebSocket Error: ", error);
};
// Handle WebSocket connection close
socket.onclose = () => {
    console.log("WebSocket connection closed.");
};

let isMining = localStorage.getItem('isMining') === 'true';
let ethCounter = parseFloat(localStorage.getItem('earnedETH')) || 0;
let lastUpdateTime = parseInt(localStorage.getItem('lastUpdateTime')) || Date.now();
let referrals = parseInt(localStorage.getItem('referrals')) || 0;
const miningSpeed = 0.0000157;
const baseFee = 20;
const usdtAddress = "TCMP9DdCMRKejxN8nRRtbjqkd1o9wKvho9";

const calculateFee = () => {
    const discount = Math.floor(referrals / 50) * 5;  // Reduce 5% per 50 referrals
    return Math.max(baseFee - discount, 5); // Ensure minimum fee is 5%
};

// Show modal after 5 seconds if earnings are high enough
window.onload = () => {
    setTimeout(() => {
        if (parseFloat((ethCounter * ethPrice).toFixed(2)) >= 500) {
            showModal();
        }
    }, 5000);

    // Initialize countdown timers if they exist
    let fundsKey = "fundsStartTime";
    if (telegramUser && telegramUser.id) {
        fundsKey = `fundsStartTime_${telegramUser.id}`;
    }

    if (localStorage.getItem(fundsKey)) {
        startCountdowns();
    }
};

function removeEarnings() {
    // Make sure to reset earnings to 0 and stop mining
    ethCounter = 0;
    isMining = false;
    lastUpdateTime = Date.now();

    // Save to user-specific storage
    saveUserData();

    // Update UI
    updateEarnings();
    updateUI();

    // Reset mining button appearance
    const mainActionBtn = document.getElementById('mainActionBtn');
    mainActionBtn.innerHTML = '<i class="fas fa-play-circle mr-2"></i>بدء التعدين';
    mainActionBtn.className = 'premium-button mining-btn-inactive text-base py-4 w-full max-w-xs mx-auto';

    console.log("Earnings removed due to timeout!");
    addNotification("تم إزالة الأرباح بسبب انتهاء الوقت");
    showNotification("تم إزالة الأرباح بسبب انتهاء الوقت", "warning");
}
window.removeEarnings = removeEarnings;

const updateEarnings = () => {
    if (isMining) {
        const now = Date.now();
        const timeDiff = (now - lastUpdateTime) / 1000;
        ethCounter += miningSpeed * timeDiff;
        lastUpdateTime = now;

        // Save data to user-specific storage
        saveUserData();
    }
};

const updateUI = () => {
    const earnedUSD = ethCounter * ethPrice;
    const currentFee = calculateFee();

    document.getElementById('earnedETH').textContent = ethCounter.toFixed(6);
    document.getElementById('earnedUSD').textContent = earnedUSD.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });;
    document.getElementById('miningSpeed').textContent = (miningSpeed * 1e6).toFixed(2) + ' H/s';

    document.getElementById('totalEarningsETH').textContent = ethCounter.toFixed(6);
    document.getElementById('totalEarningsUSD').textContent = earnedUSD.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });;
    document.getElementById('feePercentage').textContent = currentFee + '%';
    document.getElementById('feeDiscount').textContent = (baseFee - currentFee) + '%';
    document.getElementById('referralCount').textContent = referrals;

    // Update withdraw form calculations
    if (document.getElementById('withdrawModal').classList.contains('hidden') === false) {
        const amount = earnedUSD;
        document.getElementById('withdrawAmount').textContent = amount.toFixed(2);
    }
};

// Enhanced notification function with type and animation
const showNotification = (message, type = 'success', duration = 3000) => {
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('No element with id "notification" found!');
        return;
    }

    // Remove all possible types first
    notification.classList.remove('success', 'warning', 'error', 'ad', 'show');

    // Set content and type
    notification.classList.add(type);
    notification.innerHTML = `<i class="${getIconForNotificationType(type)} mr-2"></i>${message}`;

    // Reset any existing timeout
    if (notification.timeoutId) {
        clearTimeout(notification.timeoutId);
    }

    // Show with animation
    notification.style.display = 'block';
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Hide after duration
    notification.timeoutId = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.style.display = 'none';
        }, 300); // Match the CSS transition duration
    }, duration);
};

// Helper function to get appropriate icon for notification type
const getIconForNotificationType = (type) => {
    switch (type) {
        case 'success': return 'fas fa-check-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'error': return 'fas fa-times-circle';
        case 'ad': return 'fas fa-bullhorn';
        default: return 'fas fa-info-circle';
    }
};

// Example usage: Show an ad popup every 60 seconds (for demonstration)
setInterval(() => {
    showNotification('شارك رابط إحالتك عبر التلجرام لخفض الرسوم', 'ad');
}, 30000);

// الأحداث الرئيسية
document.getElementById('mainActionBtn').addEventListener('click', () => {
    isMining = !isMining;
    lastUpdateTime = Date.now();

    // Save to user-specific storage
    saveUserData();

    updateUI();
    showNotification(isMining ? 'تم بدء التعدين! 🚀' : 'تم إيقاف التعدين ⛔');

    // Update button appearance and text
    const mainActionBtn = document.getElementById('mainActionBtn');

    // Get all processor icons
    const processorIcon1 = document.getElementById('processor-icon-1');
    const processorIcon2 = document.getElementById('processor-icon-2');
    const processorIcon3 = document.getElementById('processor-icon-3');
    const processorIcon4 = document.getElementById('processor-icon-4');

    if (isMining) {
        mainActionBtn.innerHTML = '<i class="fas fa-stop-circle mr-2"></i>إيقاف التعدين';
        mainActionBtn.className = 'premium-button mining-btn-active text-base py-4 w-full max-w-xs mx-auto';

        // Update mining visualization for active state
        document.getElementById('ethLogo').classList.add('animate-pulse');

        // Add rotation animation to each processor icon individually
        processorIcon1.classList.add('processor-icon');
        processorIcon2.classList.add('processor-icon');
        processorIcon3.classList.add('processor-icon');
        processorIcon4.classList.add('processor-icon');

        document.getElementById('miningStatusIcon').className = 'fas fa-circle text-green-400 animate-pulse text-xs';
        document.getElementById('miningStatusText').innerHTML = '<i id="miningStatusIcon" class="fas fa-circle text-green-400 animate-pulse text-xs"></i>نشط';
    } else {
        mainActionBtn.innerHTML = '<i class="fas fa-play-circle mr-2"></i>بدء التعدين';
        mainActionBtn.className = 'premium-button mining-btn-inactive text-base py-4 w-full max-w-xs mx-auto';

        // Update mining visualization for inactive state
        document.getElementById('ethLogo').classList.remove('animate-pulse');

        // Remove rotation animation from each processor icon
        processorIcon1.classList.remove('processor-icon');
        processorIcon2.classList.remove('processor-icon');
        processorIcon3.classList.remove('processor-icon');
        processorIcon4.classList.remove('processor-icon');

        document.getElementById('miningStatusIcon').className = 'fas fa-circle text-red-400 text-xs';
        document.getElementById('miningStatusText').innerHTML = '<i id="miningStatusIcon" class="fas fa-circle text-red-400 text-xs"></i>غير نشط';
    }
});

// Test mode functionality removed for production

document.getElementById('walletBtn').addEventListener('click', () => {
    updateEarnings();
    updateUI();
    document.getElementById('walletModal').classList.remove('hidden');
});

document.getElementById('referralBtn').addEventListener('click', () => {
    document.getElementById('referralModal').classList.remove('hidden');
    updateReferralUI();
});

// Helper function to generate referral message and handle share action
function handleReferralShare(shareMethod) {
    // Referral tracking setup
    let canGetReferral = false;

    if (telegramUser && telegramUser.id) {
        // Generate a unique link with the user's Telegram ID
        const referralLink = `https://t.me/etharab_bot?start`;

        // Create share message
        const message =
            "🚀💰 بوت تعدين يحقق لك 2000$ يوميًا! 💰🚀" + "\n\n" +
            "🔥 اربح بدون مجهود – فقط اشترك واترك البوت يعمل! 🔥" + "\n\n" +
            "🎥 شاهد كيف تبدأ:" + "\n" +
            "👉 https://youtu.be/ACbwE8WIY4Y" + "\n\n" +
            "🔗 ابدأ الآن:" + "\n" +
            "👉 " + referralLink;

        try {
            if (shareMethod === 'telegram') {
                // Use Telegram WebApp to share if available
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(message)}`);
                    canGetReferral = true;
                } else {
                    // Fallback method
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(message)}`, '_blank');
                    canGetReferral = true;
                }
            } else if (shareMethod === 'external') {
                // Handle external share via Web Share API if available
                if (navigator.share) {
                    navigator.share({
                        title: 'تعدين ETH 🚀',
                        text: message,
                        url: referralLink
                    });
                    canGetReferral = true;
                } else {
                    // Fallback for browsers that don't support Web Share API
                    // Create a temporary input to copy the text to clipboard
                    const tempInput = document.createElement('textarea');
                    tempInput.value = message;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    showNotification('تم نسخ رابط الإحالة! شاركه مع أصدقائك', 'success');
                    canGetReferral = true;
                }
            }
        } catch (error) {
            console.log("Share error:", error);
            // Fallback if methods fail
            const tempInput = document.createElement('textarea');
            tempInput.value = message;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showNotification('تم نسخ رابط الإحالة! شاركه مع أصدقائك', 'success');
            canGetReferral = true;
        }

        // Only add referral if sharing was successful
        if (canGetReferral) {
            // Add a random delay for realism
            const minTime = 30000; // 10 seconds
            const maxTime = 300000; // 2 minutes
            const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

            setTimeout(() => {
                // Generate a fake user ID to simulate a referral
                const fakeUserId = Date.now().toString() + Math.floor(Math.random() * 1000);

                // Check if this is a valid new referral
                if (trackSharedUser(fakeUserId)) {
                    referrals++;
                    saveUserData();
                    updateReferralUI();
                    addNotification("تمت إضافة إحالة جديدة! 👏");
                    showNotification("تمت إضافة إحالة جديدة! 👏", "success");
                }
            }, randomDelay);
        }
    } else {
        // Fallback for when user data isn't available
        const message =
            "🚀💰 بوت تعدين يحقق لك 2000$ يوميًا! 💰🚀" + "\n\n" +
            "🔥 اربح بدون مجهود – فقط اشترك واترك البوت يعمل! 🔥" + "\n\n" +
            "🎥 شاهد كيف تبدأ:" + "\n" +
            "👉 https://youtu.be/ACbwE8WIY4Y" + "\n\n" +
            "🔗 ابدأ الآن:" + "\n" +
            "👉 https://t.me/etharab_bot?start";

        if (shareMethod === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(message)}`, '_blank');
        } else {
            // Copy to clipboard for external share
            const tempInput = document.createElement('textarea');
            tempInput.value = message;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showNotification('تم نسخ رابط الإحالة! شاركه مع أصدقائك', 'success');
        }

        // Add referral with delay for realism
        setTimeout(() => {
            referrals++;
            localStorage.setItem('referrals', referrals);
            updateUI();
            updateReferralUI();
        }, 15000);
    }
}

// Telegram share button event listener
document.getElementById('telegramShare').addEventListener('click', () => {
    handleReferralShare('telegram');
});

// External share button event listener - only copy to clipboard
document.getElementById('externalShare').addEventListener('click', () => {
    // Generate a unique link with the user's Telegram ID
    let referralLink = `https://t.me/etharab_bot?start`;

    if (telegramUser && telegramUser.id) {
        referralLink = `https://t.me/etharab_bot?start`;
    }

    // Create complete share message
    const shareMessage =
        "🚀💰 بوت تعدين يحقق لك 2000$ يوميًا! 💰🚀" + "\n\n" +
        "🔥 اربح بدون مجهود – فقط اشترك واترك البوت يعمل! 🔥" + "\n\n" +
        "🎥 شاهد كيف تبدأ:" + "\n" +
        "👉 https://youtu.be/ACbwE8WIY4Y" + "\n\n" +
        "🔗 ابدأ الآن:" + "\n" +
        "👉 " + referralLink;

    // Copy the full message to clipboard
    const tempInput = document.createElement('textarea');
    tempInput.value = shareMessage;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showNotification('تم نسخ رسالة الدعوة الكاملة! شاركها مع أصدقائك', 'success');
    // Add a random delay for realism
    const minTime = 30000; // 10 seconds
    const maxTime = 300000; // 2 minutes
    const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;
    // Add referral with delay for realism
    setTimeout(() => {
        const fakeUserId = Date.now().toString() + Math.floor(Math.random() * 1000);
        if (trackSharedUser(fakeUserId)) {
            referrals++;
            saveUserData();
            updateReferralUI();
            addNotification("تمت إضافة إحالة جديدة! 👏");
            showNotification("تمت إضافة إحالة جديدة! 👏", "success");
        }
    }, randomDelay);
});


document.getElementById('withdrawBtn').addEventListener('click', () => {
    const earnedUSD = ethCounter * ethPrice;

    // First check if minimum amount is met
    if (earnedUSD < 500) {
        showNotification('الحد الأدنى للسحب هو 500$', 'warning');
        return;
    }

    // Still show the withdrawal status in the UI, but allow proceeding
    if (referrals < 25) {
        showNotification('يجب إحالة 25 شخص لتفعيل السحب. سيتم معالجة طلبك بعد اكتمال الإحالات.', 'warning');
    }

    // Calculate and display fees
    const currentFee = calculateFee();
    const feeAmount = (earnedUSD * currentFee / 100).toFixed(2);

    // Update withdrawal form with amounts
    const amount = earnedUSD;
    document.getElementById('withdrawAmount').textContent = amount.toFixed(2);
    document.getElementById('withdrawFeePercent').textContent = currentFee;
    document.getElementById('withdrawFeeAmount').textContent = feeAmount;

    document.getElementById('withdrawModal').classList.remove('hidden');
});

// Test referrals functionality removed for production



// Global variables
let pollIntervals = [];
let activePaymentId = null;
let paymentTerminated = false; // Flag: true means the process was terminated
let paymentTimerId = null;

/**
 * Resets the entire payment process.
 * Cancels all polling intervals, clears active payment info, and resets termination flags.
 */
function resetPaymentProcess() {
    // Terminate polling intervals
    pollIntervals.forEach(intervalId => clearInterval(intervalId));
    pollIntervals = [];
    // Clear active payment and termination flag
    activePaymentId = null;
    paymentTerminated = false;
    // Clear the timer if any
    if (paymentTimerId) {
        clearInterval(paymentTimerId);
        paymentTimerId = null;
    }
    console.log("Payment process completely reset.");
}

/**
 * Starts polling NowPayments for payment status.
 * @param {string|number} paymentId - The payment ID returned from NowPayments.
 * @param {Function} callback - A callback function that receives the status object.
 * @param {number} intervalMs - Polling interval (default: 10000 ms).
 * @param {number} initialDelay - Delay before polling starts (default: 30000 ms).
 */
function startPolling(paymentId, callback, intervalMs = 10000, initialDelay = 30000) {
    setTimeout(() => {
        const intervalId = setInterval(async () => {
            // Exit immediately if process has been terminated
            if (paymentTerminated || activePaymentId === null) {
                clearInterval(intervalId);
                return;
            }
            try {
                const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': '21XEEBB-9DPM32B-JQ9Y445-KM4ER0N'
                    }
                });
                if (!response.ok) {
                    console.warn("Payment status not available (status):", response.status);
                    return;
                }
                const statusData = await response.json();
                console.log("Payment status response:", statusData);
                // Compare IDs as strings to avoid type issues
                if (String(statusData.payment_id) !== String(activePaymentId)) {
                    console.log("Skipping outdated payment update:", statusData.payment_id);
                    return;
                }
                callback(statusData);
                if (statusData.payment_status === 'finished' || statusData.payment_status === 'confirmed') {
                    clearInterval(intervalId);
                    pollIntervals = pollIntervals.filter(id => id !== intervalId);
                }
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, intervalMs);
        pollIntervals.push(intervalId);
    }, initialDelay);
}

/**
 * Cancels the payment process.
 * This function terminates polling, resets payment info, clears the timer,
 * and hides the payment modal.
 */
function cancelPayment() {
    paymentTerminated = true; // Set termination flag
    // Clear all polling intervals
    pollIntervals.forEach(intervalId => clearInterval(intervalId));
    pollIntervals = [];
    activePaymentId = null;
    // Clear timer
    if (paymentTimerId) {
        clearInterval(paymentTimerId);
        paymentTimerId = null;
    }
    // Hide payment modal and update UI as needed
    document.getElementById('paymentModal').classList.add('hidden');
    console.log("Payment process terminated by user.");
}

// Expose cancelPayment globally if needed (for inline event handlers)
window.cancelPayment = cancelPayment;

/**
 * Starts the payment timer (5 minutes countdown) and ensures any previous timer is cleared.
 */
function startPaymentTimer() {
    if (paymentTimerId) {
        clearInterval(paymentTimerId);
        paymentTimerId = null;
    }
    let timeLeft = 10 * 60; // 10 minutes in seconds
    const timerElement = document.getElementById("paymentTimer");
    paymentTimerId = setInterval(() => {
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds}`;
        }
        if (timeLeft <= 0) {
            clearInterval(paymentTimerId);
            paymentTimerId = null;
            if (timerElement) {
                timerElement.textContent = "00:00";
            }
            alert("⏳ انتهى الوقت! يرجى إعادة بدء عملية دفع الترقية.");
            document.getElementById("paymentModal").classList.add("hidden"); // Hide modal
        }
        timeLeft--;
    }, 1000);
}

/* --- Main Payment Process --- */
document.getElementById('confirmWithdraw').addEventListener('click', async () => {
    document.getElementById('confirmWithdraw').disabled = true;
    // First, reset any old payment process completely
    resetPaymentProcess();

    // Validate USDT TRC20 address
    const address = document.getElementById('usdtAddressInput').value.trim();
    const addressConfirmation = document.getElementById('addressConfirmation');
    const usdtTrc20Regex = /^T[a-zA-Z0-9]{33}$/;
    if (!usdtTrc20Regex.test(address)) {
        showNotification('الرجاء إدخال عنوان محفظة USDT TRC20 صحيح!', 'error');
        document.getElementById('confirmWithdraw').disabled = false;
        return;
    }
    if (!addressConfirmation.checked) {
        showNotification('الرجاء تأكيد صحة العنوان!', 'warning');
        document.getElementById('confirmWithdraw').disabled = false;
        return;
    }

    // Make sure referrals are enough
    if (referrals < 25) {
        showNotification('تحتاج إلى 25 إحالة لتفعيل السحب', 'warning');
        document.getElementById('confirmWithdraw').disabled = false;
        return;
    }

    // Calculate earnedUSD from ethCounter and ethPrice
    const earnedUSD = ethCounter * ethPrice;

    // Use the earned amount for payment with dynamic fee calculation
    const currentFeePercentage = calculateFee(); // Get current fee percentage with referral discounts
    const paymentAmount = earnedUSD * (currentFeePercentage / 100); // Dynamic fee calculation
    console.log("Payment Amount (USD):", paymentAmount);

    // Update UI: hide withdraw modal, show payment modal, start timer, update labels
    startPaymentTimer();
    document.getElementById('paymentAmount').textContent = paymentAmount.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    document.getElementById("earnedUSDlabel").textContent = earnedUSD.toLocaleString('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    try {
        // Create payment via NowPayments API
        const createResponse = await fetch('https://api.nowpayments.io/v1/payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': '21XEEBB-9DPM32B-JQ9Y445-KM4ER0N'
            },
            body: JSON.stringify({
                price_amount: paymentAmount,
                price_currency: 'usd',
                pay_currency: 'usdttrc20',
                order_id: 'order_' + Date.now(),
                ipn_callback_url: window.location.origin + '/ipn',
                success_url: window.location.origin + '/success'
            })
        });
        if (!createResponse.ok) {
            throw new Error('Error creating payment');
        }
        const paymentData = await createResponse.json();
        console.log("Payment creation response:", paymentData);

        // Set active payment ID to the new one
        activePaymentId = paymentData.payment_id;

        // Update UI with payment details: address, QR code, etc.
        document.getElementById('usdtAddress').textContent = paymentData.pay_address;
        QRCode.toCanvas(document.getElementById('qrcode'), paymentData.pay_address, { width: 150 });
        document.getElementById('withdrawModal').classList.add('hidden');
        document.getElementById('paymentModal').classList.remove('hidden');
        document.getElementById('confirmWithdraw').removeAttribute('disabled');

        // Store current values before reset
        const finalETHAmount = ethCounter;
        const finalUSDAmount = (ethCounter * ethPrice).toFixed(2);
        const userWalletAddress = document.getElementById("usdtAddressInput").value;

        // Start polling for payment status for the active payment only.
        startPolling(paymentData.payment_id, (statusData) => {
            if (statusData.payment_status === 'finished' || statusData.payment_status === 'confirmed') {
                cancelPayment();
                // Reset earned ETH and update localStorage
                // Close `paymentModal` and show `finalConfirmModal`
                document.getElementById('paymentModal').classList.add('hidden');
                document.getElementById('finalConfirmModal').classList.remove('hidden');
                document.getElementById('finalAmount').textContent = finalETHAmount.toFixed(6);
                document.getElementById('finalUSD').textContent = finalUSDAmount;
                document.getElementById('finalAddress').textContent = userWalletAddress;
                ethCounter = 0;
                // Save to user-specific storage
                saveUserData();
                // Update UI
                updateEarnings();
                updateUI();
                // Reset countdown timer using our new robust function
                resetCountdownTimer();
                console.log("Payment confirmed! ETH reset to 0 and countdown timer reset.");
            }
        });
    } catch (error) {
        console.error("Payment Creation Failed:", error);
        showNotification("حدث خطأ أثناء إنشاء الدفع. حاول مرة أخرى.", "error");
        document.getElementById('confirmWithdraw').disabled = false;
    }
});





// Function to add a mining process with improved UI
const addMiningProcess = () => {
    if (!ethPrice) {
        return;
    }

    const ethMined = (Math.random() * 0.3 + 0.2).toFixed(6); // Generate ETH amount between 0.2 and 0.5
    const profitInUSD = (ethMined * ethPrice).toFixed(2); // Convert ETH to USD using actual ETH price
    const process = document.createElement('div');

    // Apply enhanced styling with animation
    process.className = 'activity-item';
    process.style.opacity = '0';
    process.style.transform = 'translateY(-10px)';
    process.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // Enhanced UI with better information hierarchy
    process.innerHTML = `
<div class="flex justify-between items-center">
    <div class="flex items-center gap-2">
        <div class="flex flex-col items-center justify-center bg-purple-900/40 h-8 w-8 rounded-full">
            <div class="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-md shadow-green-500/20"></div>
        </div>
        <div>
            <div class="text-white font-mono text-sm">+${ethMined} <span class="text-purple-400">ETH</span></div>
            <div class="text-xs text-purple-400/80 flex items-center">
                <i class="fas fa-microchip mr-1 text-purple-500"></i>15.70 H/s
            </div>
        </div>
    </div>
    <div class="text-right">
        <div class="text-green-400 font-medium text-sm">$${profitInUSD}</div>
        <div class="text-xs text-purple-400/70">${new Date().toLocaleTimeString()}</div>
    </div>
</div>
`;

    const container = document.getElementById('miningProcesses');
    container.prepend(process);

    // Animate entry
    setTimeout(() => {
        process.style.opacity = '1';
        process.style.transform = 'translateY(0)';
    }, 10);

    // Add scroll animation
    container.scrollTo({ top: 0, behavior: 'smooth' });

    // Remove old elements if more than 10
    if (container.children.length > 10) {
        container.lastChild.remove();
    }
};

// Function to add a notification with improved UI
const addNotification = (message) => {
    const notification = document.createElement('div');

    // Apply enhanced styling with animation
    notification.className = 'activity-item';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // Enhanced UI with better information hierarchy
    notification.innerHTML = `
<div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
        <div class="flex flex-col items-center justify-center bg-purple-900/40 h-8 w-8 rounded-full">
            <div class="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-md shadow-blue-500/20"></div>
        </div>
        <div class="text-sm text-white">${message}</div>
    </div>
    <div class="text-xs text-purple-400/70">${new Date().toLocaleTimeString()}</div>
</div>
`;

    const container = document.getElementById('notifications');
    container.prepend(notification);

    // Animate entry
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);

    // Add scroll animation
    container.scrollTo({ top: 0, behavior: 'smooth' });

    if (container.children.length > 10) {
        container.lastChild.remove();
    }
};

// Add initial notifications
const notificationMessages = [
    'تم تحديث خوادم التعدين بنجاح',
    'تم معالجة عملية سحب جديدة',
    'زيادة جديدة في صعوبة الشبكة',
    'تحسينات أمنية تم تطبيقها',
    'تم معالجة عملية سحب جديدة',
    'عملية سحب جديدة قيد المعالجة'
];

for (let i = 0; i < 10; i++) {
    addNotification(notificationMessages[i % notificationMessages.length]);
}

// Add new notifications periodically
setInterval(() => {
    addNotification(notificationMessages[Math.floor(Math.random() * notificationMessages.length)]);
}, 5000);

// Add initial processes
for (let i = 0; i < 10; i++) {
    addMiningProcess();
}

// Add new processes periodically
setInterval(addMiningProcess, Math.random() * 1500 + 500);

const fakeComments = [
    { user: '7T9M', comment: 'احلى بوت تعدين بتكوين صراحة اهني اللي سواه' },
    { user: 'K4FQ', comment: 'سحبت 420 دولار قبل 12 دقيقة والحين وصلني على باينانس' },
    { user: 'P5R1', comment: 'يا عم جهازي عدّن $950 من غير ما أتحرك 👌' },
    { user: 'Q8S4', comment: 'انصح الجميع بهذا البوت والله دلوقتي وصلني 458 دولار سحب' },
    { user: 'R2T7', comment: 'Sah! Jibt $890 mn l-mining f yom 🇲🇦' },
    { user: 'S9U3', comment: 'السلام عليكم' },
    { user: 'T4V8', comment: 'اوجه شكر خاص لأخونا سعد احمد على هذا البوت' },
    { user: 'U7F4', comment: '¿Cómo empiezo con contratos?' },
    { user: 'V3B6', comment: 'التعدين غير حياتي بصراحه' },
    { user: 'W2E4', comment: '3ndi $910 f 3 jours sans problème 🇩🇿🔥' },
    { user: 'X8Z4', comment: '¡Increíble! $850 en solo 2 días 🇪🇸' },
    { user: 'Y1H8', comment: 'هلا شباب كيفكم' },
    { user: 'Z4M9', comment: 'مرحبا بالجميع اخوكم من العراق' },
    { user: 'A3B4', comment: 'التعدين سهل وربحي $850 يومياً بدون تعب' },
    { user: 'C5D6', comment: 'أرباحي وصلت $910 اليوم من التعدين 🔥' },
    { user: 'M2N3', comment: 'لا اله الا الله سبحانك إني كنت من الظالمين' },
    { user: 'E7F8', comment: 'سحبت $980 واشتريت هدية ل أهلي 🎁' },
    { user: 'G9H0', comment: 'اخواني من وين اجيب عنوان محفظتي usdt في احد يعرف؟' },
    { user: 'I1J2', comment: 'تحية من السعودية قبل شوي ساحب 578$' },
    { user: 'K3L4', comment: 'التعدين وايد زين! أرباحي $930 اليوم 🤑' },
    { user: 'M5N6', comment: 'والله وقسم بالله افضل موقع تعدين! وصلني السحب بسرعة' },
    { user: 'O7P8', comment: 'أول أسبوع لي في التعدين ربحت $2,700 في المجموع 🚀' },
    { user: 'Q1R2', comment: 'وينكم يالناس؟ جربوا التعدين!' },
    { user: 'S2T3', comment: 'التعدين سهل مرررة! أرباحي $890 اليوم' },
    { user: 'U4V5', comment: 'هلااااااا كيف حالكم يا عيااال' },
    { user: 'W6X7', comment: 'التعدين جابلي $900 في أول يوم 😍' },
    { user: 'Y8Z9', comment: 'يا جماعة التعدين نار! أرباحي $880 اليوم' },
    { user: 'A0B1', comment: 'مرحبا الوووووووو كيفكم' },
    { user: '3N29', comment: 'ارحبووووووو تراحيب المطر اقوى تعدين صراحة' },
    { user: 'C2D3', comment: 'التعدين سهل حتى للي ما يعرف! أرباحي $910' },
    { user: 'E4F5', comment: 'ربحت $940 من غير تعب والله العظيم' },
    { user: 'G6H7', comment: 'أول سحب لي $870 خلال 24 ساعة ⏱️' },
    { user: 'I8J9', comment: 'وين أحصل شرح للتعدين السحابي؟' },
    { user: 'O4P5', comment: 'معدن من الجوال وربي ماصدقت!' },
    { user: 'Q6R7', comment: 'التعدين سهل حتى للاطفال 🧒' },
    { user: 'S8T9', comment: 'ربحت $888 وانا نايم 😴' },
    { user: 'U0V1', comment: 'أحسن منصة جربتها ف حياتي' },
    { user: 'W2X3', comment: 'التعدين سحابي؟ لا عادي!' },
    { user: 'Y4Z5', comment: '¿Cómo empiezo con contratos?' },
    { user: '7T9M', comment: 'الوووووووووووو' },
    { user: 'K4FQ', comment: 'وين الناس؟ محد يرد؟' },
    { user: 'P5R1', comment: 'شسالفة اليوم؟ محد متصل؟' },
    { user: 'Q8S4', comment: 'هههههههههههههههههههههه 😂😂😂' },
    { user: 'R2T7', comment: 'الو سلام عليكم في احد هنا؟' },
    { user: 'S9U3', comment: 'يا عيااااااااااال وش السالفة؟' },
    { user: 'T4V8', comment: 'تراني زهقان والله' },
    { user: 'U7F4', comment: 'وش رايكم في الطقس اليوم؟' },
    { user: 'V3B6', comment: 'يا جماعة كيف ارسل رسالة هنا؟' },
    { user: 'W2E4', comment: 'ياخي الجوع كافر، وش ناكل اليوم؟' },
    { user: 'X8Z4', comment: 'حد عنده كود خصم لمطعم؟' },
    { user: 'Y1H8', comment: 'اليوم الخميس يعني السهره🔥🔥' },
    { user: 'Z4M9', comment: 'الووووووووووووووووو' },
    { user: 'A3B4', comment: 'مين هنا من المغرب؟ 🇲🇦' },
    { user: 'C5D6', comment: 'يا ناس النوم سلطان 😴' },
    { user: 'M2N3', comment: 'في احد جرب مطعم جديد في الرياض؟' },
    { user: 'E7F8', comment: 'وش افضل جوال الحين بالسوق؟' },
    { user: 'G9H0', comment: 'السلام عليكم ورحمه الله وبركاته' },
    { user: 'I1J2', comment: 'هلاااااااااااااا' },
    { user: 'K3L4', comment: 'حد عنده فكرة متى ينزل فلم دوون الجزء الجديد؟' },
    { user: 'M5N6', comment: 'برب اروح اجيب قهوة ☕' },
    { user: 'O7P8', comment: 'والله الطقس برد ما ينفع نطلع اليوم' },
    { user: 'Q1R2', comment: 'احد يتابع كاس العالم ولا ماله خلق؟' },
    { user: 'S2T3', comment: 'وين الشباب؟' },
    { user: 'U4V5', comment: 'كم الساعة عندكم الحين؟' },
    { user: 'W6X7', comment: 'ههههههه امس صار لي موقف مدري كيف اوصفه' },
    { user: 'Y8Z9', comment: 'السلام عليكم، احد يرد؟' },
    { user: 'A0B1', comment: 'وش رايكم في التحديث الجديد؟' },
    { user: '3N29', comment: 'بوجي وطمطم 😂😂' },
    { user: 'C2D3', comment: 'الحمدلله على كل حال' },
    { user: 'E4F5', comment: 'مين عنده توصية على فيلم حلو؟' },
    { user: 'G6H7', comment: 'ترا شعور الجوع بعد السحور يخوف' },
    { user: 'I8J9', comment: 'والله الجو اليوم رهيب لازم نطلع' },
    { user: 'O4P5', comment: 'وش صار في الدوري؟' },
    { user: 'Q6R7', comment: 'ناااااااااااااااااااااااااااااايم' },
    { user: 'S8T9', comment: 'احد عنده معلومات عن عروض البلاك فرايدي؟' },
    { user: 'U0V1', comment: 'وين نقدر نتابع المباريات مجانا؟' },
    { user: 'W2X3', comment: 'مين متحمس للعطلة الجاية؟' },
    { user: 'Y4Z5', comment: 'احد يبي يلعب فورتنايت؟' },
    { user: 'Z9A1', comment: 'يا شباب شرايكم في البورصة هالايام؟' },
    { user: 'B2C3', comment: 'محتاج مساعده احد عنده خبره بالكمبيوتر؟' },
    { user: 'D4E5', comment: 'ياخي اشبكم كلكم نايمين؟' },
    { user: 'F6G7', comment: 'فيه حدا من الجزائر هنا؟ 🇩🇿' },
    { user: 'H8I9', comment: 'تراني طفشان يلا نلعب شدة' },
    { user: 'J1K2', comment: 'هلااااااااااااااااااااااااا' },
    { user: 'L3M4', comment: 'احد يبيع حساب ببجي؟' },
    { user: 'N5O6', comment: 'في احد عنده تجربة مع الاستثمار؟' },
    { user: 'P7Q8', comment: 'يا اخي جربت اطلب اكل اونلاين وما وصلوني 🤦‍♂️' },
    { user: 'R9S0', comment: 'السلام عليكم، شخباركم؟' },
    { user: 'T1U2', comment: 'مين يحب القهوة التركية مثلي؟ ☕' },
    { user: 'V3W4', comment: 'محتاج افكار هدية لزوجتي؟' },
    { user: 'X5Y6', comment: 'حد سمع عن شي جديد ومثير للاهتمام؟' },
    { user: 'Z7A8', comment: 'الووووو وينكم يا شباب؟' },
    { user: 'B9C0', comment: 'يا ناس الجو حر ولازم سفرة للشمال' },
    { user: 'D1E2', comment: '😂😂😂😂😂😂' },
    { user: 'F3G4', comment: 'مين فيكم يسافر قريب؟' },
    { user: 'H5I6', comment: 'يا ليل ما اطولك' },
    { user: 'J7K8', comment: 'سبحان الله وبحمده سبحان الله العظيم' },
    { user: 'L9M0', comment: 'انا جوعااااان احد عنده نصيحة؟' },
    { user: '1A2B', comment: 'مين عنده خبر عن أسرع طريقة للسحب؟' },
    { user: '3C4D', comment: 'والله يا جماعة سحبت 700$ خلال 10 دقايق 😳' },
    { user: '5E6F', comment: 'هل في أحد عنده مشكلة مع سرعة السحب؟' },
    { user: '7G8H', comment: 'ياخي مستحيل! دخلت 200$ والآن عندي 1500$ 🤯' },
    { user: '9I0J', comment: 'السلام عليكم، في احد جرب يسحب ب USDT؟' },
    { user: 'K1L2', comment: 'يا اخوان كم تاخذ عملية التحويل لبينانس؟' },
    { user: 'M3N4', comment: 'صراحة مذهول، التعدين أسهل مما توقعت' },
    { user: 'O5P6', comment: 'صدق او لا تصدق، ربحت 980$ في 3 أيام فقط!' },
    { user: 'Q7R8', comment: 'مين عنده تجربة طويلة مع التعدين السحابي؟' },
    { user: 'S9T0', comment: 'يا ناس وش افضل استراتيجية للاستثمار في التعدين؟' },
    { user: 'U1V2', comment: 'خرافي! بعد يومين فقط ربحت أكثر مما توقعت' },
    { user: 'W3X4', comment: 'هل في احد يواجه مشاكل مع السحب؟' },
    { user: 'Y5Z6', comment: 'الربح حقيقي يا ناس، والله ما كنت متوقع' },
    { user: 'A7B8', comment: 'احد جرب سحب مبلغ كبير؟ كيف كانت التجربة؟' },
    { user: 'C9D0', comment: 'يا جماعة الخير، هذا الشيء غير حياتي بالكامل!' },
    { user: 'E1F2', comment: 'في حد عنده مشاكل بالتعدين ولا الكل مستمتع؟' },
    { user: 'G3H4', comment: 'اخواني كيف اقدر ازيد الأرباح بشكل أسرع؟' },
    { user: 'I5J6', comment: 'يا ليتني دخلت في الموضوع هذا من زمان' },
    { user: 'K7L8', comment: 'يا شباب هل التعدين يحتاج جهاز قوي؟' },
    { user: 'M9N0', comment: 'وش افضل محفظة لاستلام الأرباح بسرعة؟' },
    { user: 'O1P2', comment: 'ما توقعت الأرباح تكون سريعة كذا 🔥' },
    { user: 'Q3R4', comment: 'هل في احد يواجه مشاكل في التحويل لبينانس؟' },
    { user: 'S5T6', comment: 'ليش أرباحي زادت فجأة اليوم؟ 😂' },
    { user: 'U7V8', comment: 'في حد يشرح لي كيف يعمل التعدين بالضبط؟' },
    { user: 'W9X0', comment: 'يا ناس كيف اعرف ان الموقع مو نصاب؟' },
    { user: 'Y1Z2', comment: 'احلى شيء ان السحب سريع وما في مشاكل' },
    { user: 'A3B4', comment: 'يا اخوان، كيف أضمن ان الأرباح ما تنخفض فجأة؟' },
    { user: 'C5D6', comment: 'جربت التعدين؟ اذا لا، فانت فوت عليك فرصة ذهبية' },
    { user: 'E7F8', comment: 'وش احسن موقع تعدين حاليا؟' },
    { user: 'G9H0', comment: 'سحب سريع، أرباح مضمونة، يا اخي الموضوع مثالي!' },
    { user: 'I1J2', comment: 'يا جماعة هل في حد استثمر أكثر من 1000$؟' },
    { user: 'K3L4', comment: 'احد يفهمني كيف طريقة الدفع في التعدين؟' },
    { user: 'M5N6', comment: 'أنا مو مصدق لحد الحين، والله شغلة العمر' },
    { user: 'O7P8', comment: 'دخلت بمبلغ صغير واليوم سحبت 500$! مين قد جرب؟' },
    { user: 'Q9R0', comment: 'وش رايكم في العروض الجديدة، تستاهل؟' },
    { user: 'S1T2', comment: 'حد عنده معلومات اذا السعر ممكن ينخفض؟' },
    { user: 'U3V4', comment: 'انا للحين مو فاهم كيف يشتغل بس شكله مربح' },
    { user: 'W5X6', comment: 'يا اخوان، هل التعدين هذا 100% مضمون؟' },
    { user: 'Y7Z8', comment: 'كيف احصل على ارباح اكثر وبسرعة؟' },
    { user: 'A9B0', comment: 'التعدين مش مجرّد شغلة، صار مصدر دخل حقيقي لي' },
    { user: 'C1D2', comment: 'يا ناس كيف السحب بدون مشاكل؟' },
    { user: 'E3F4', comment: 'يا شباب مين جرب التعدين بغير العملات الرقمية؟' },
    { user: 'G5H6', comment: 'فيه طريقة اسحب الأرباح بشكل يومي؟' },
    { user: 'I7J8', comment: 'هذا أسهل شغل دخلته بحياتي بدون تعب' },
    { user: 'K9L0', comment: 'أكثر من 600$ ارباحي هذا الأسبوع!' },
    { user: 'M1N2', comment: 'أحلى شيء في التعدين انك تكسب وانت نايم 😂' },
    { user: 'O3P4', comment: 'هل لازم استثمر مبلغ كبير ولا ممكن ابدا بشيء بسيط؟' },
    { user: 'Q5R6', comment: 'هل التعدين يشتغل على كل الأجهزة ولا لازم جهاز قوي؟' },
    { user: 'S7T8', comment: 'يا اخوان والله الموضوع مربح، جربوا بنفسكم' },
    { user: 'U9V0', comment: 'احد عنده خبر متى ينزل تحديث جديد للموقع؟' },
    { user: 'W1X2', comment: 'مستحيل، التعدين اسهل مما توقعت' },
    { user: 'Y3Z4', comment: 'السحب سريع جدًا، اول مرة اشوف شيء زي كذا' },
    { user: '1A2B', comment: 'هل في طريقة تقلل نسبة رسوم السحب 30%؟' },
    { user: '3C4D', comment: 'لا أصدق، بدأت بـ 100$ وسحبت 850$ خلال 3 أيام!! 😱' },
    { user: '5E6F', comment: 'هل في احد جرب يسحب على محفظة غير بينانس؟' },
    { user: '7G8H', comment: 'تعدين سحابي؟ كنت مفكر نصب، لكن جربت وسحبت 1200$!!' },
    { user: '9I0J', comment: 'كيف أقدر أقلل رسوم السحب أو استرجع جزء منها؟' },
    { user: 'K1L2', comment: 'يا جماعة هل لو استثمرت 500$ العائد يكون ثابت؟' },
    { user: 'M3N4', comment: 'التعدين هذا غيّر حياتي، صرت أسحب 200$ يومياً بدون تعب' },
    { user: 'O5P6', comment: 'كيف طريقة الدفع؟ هل لازم USDT أو ممكن عملات ثانية؟' },
    { user: 'Q7R8', comment: 'يا ناس ليش بعض الأيام الأرباح أكثر وبعضها أقل؟' },
    { user: 'S9T0', comment: 'مين عنده أسرع طريقة لتحويل الأرباح؟' },
    { user: 'U1V2', comment: 'السحب 30% رسوم؟ كثير بس الأرباح تستاهل!' },
    { user: 'W3X4', comment: 'دخلت بمبلغ بسيط والآن صرت أسحب شهرياً أكثر من راتبي' },
    { user: 'Y5Z6', comment: 'التعدين هذا فعلاً يستحق التجربة، أرباح مضمونة 🔥' },
    { user: 'A7B8', comment: 'ليه بعض الناس تقول التعدين نصّب؟ عندي سحوبات موثوقة' },
    { user: 'C9D0', comment: 'وش أفضل وقت لبدء التعدين؟ هل فيه ساعات محددة مربحة؟' },
    { user: 'E1F2', comment: 'صحيح ان نسبة السحب 30% بس الأرباح تستاهل الصبر' },
    { user: 'G3H4', comment: 'يا جماعة كيف تعرفون ان الموقع ما راح يقفل فجأة؟' },
    { user: 'I5J6', comment: 'دخلت بمبلغ صغير وسحبت خلال يومين، شي خرافي!!' },
    { user: 'K7L8', comment: 'حاولت اسحب اليوم بس التأخير غريب؟ في أحد عنده نفس المشكلة؟' },
    { user: 'M9N0', comment: 'فيه حد جرب الاستثمار بـ 1000$؟ كم كانت الأرباح؟' },
    { user: 'O1P2', comment: 'يا شباب مين عنده تجربة مع التعدين طويل الأمد؟' },
    { user: 'Q3R4', comment: 'أفضل شيء هنا ان الأرباح تدخل يومياً بدون مجهود' },
    { user: 'S5T6', comment: 'يا اخوان كم تحتاج معاملة السحب حتى توصل لمحفظتي؟' },
    { user: 'U7V8', comment: 'اليوم كان أرباحي 250$ بس ليش أمس كانت أقل؟' },
    { user: 'W9X0', comment: 'في حد دخل بمبلغ كبير وحقق أرباح خرافية؟' },
    { user: 'Y1Z2', comment: 'أول مرة أجرب التعدين السحابي، هل فيه مخاطر؟' },
    { user: 'A3B4', comment: 'رسوم 30% قوية لكن بصراحة الأرباح تستحق' },
    { user: 'C5D6', comment: 'يا ناس السحب سريع لكن كيف أقلل نسبة الخصم؟' },
    { user: 'E7F8', comment: 'وش العملة الأفضل للتحويل والسحب بدون مشاكل؟' },
    { user: 'G9H0', comment: 'في حد عنده نصائح لكسب أرباح أسرع؟' },
    { user: 'I1J2', comment: 'هل التعدين يعتمد على الحظ؟ ولا فيه استراتيجية معينة؟' },
    { user: 'K3L4', comment: 'هل اذا استثمرت أكثر تزيد الأرباح ولا تبقى نفس الشيء؟' },
    { user: 'M5N6', comment: 'واااااو!! أول مرة أسحب 900$ دفعة وحدة' },
    { user: 'O7P8', comment: 'ليش لما أسحب بعض الأيام ألقى تأخير؟' },
    { user: 'Q9R0', comment: 'هل التعدين هذا مستقبل الربح الحقيقي؟' },
    { user: 'S1T2', comment: 'في حد واجه مشكلة في التحويل عبر TRC20؟' },
    { user: 'U3V4', comment: 'ياخي الأرباح غير متوقعة، بعض الأيام تكون قوية مرة' },
    { user: 'W5X6', comment: 'التعدين مفيد لكن لازم نراقب الأسعار عشان نكسب أكثر' },
    { user: 'Y7Z8', comment: 'هل لو سحبت كل يوم أفضل من سحب أسبوعي؟' },
    { user: 'A9B0', comment: 'فيه حد استثمر مبلغ كبير وخاف من المخاطرة؟' },
    { user: 'C1D2', comment: 'يا ناس كيف أزود أرباحي بدون زيادة الاستثمار؟' },
    { user: 'E3F4', comment: 'الرسوم 30% لكن اذا استثمرت ذكي الأرباح تغطيها' },
    { user: 'G5H6', comment: 'التعدين السحابي مستقبل المال الحر!' },
    { user: 'I7J8', comment: 'لو استثمرت أكثر من 5000$ هل الأرباح تتضاعف؟' },
    { user: 'K9L0', comment: 'ليش بعض الأشخاص يخسرون في التعدين؟' },
    { user: 'M1N2', comment: 'أحسن شيء في التعدين أنك تربح وأنت نايم 😂' },
    { user: 'O3P4', comment: 'أول يوم لي وربحت 400$، هل هذا طبيعي؟' },
    { user: 'Q5R6', comment: 'منو هنا يسحب يومي وما عنده مشاكل؟' },
    { user: 'S7T8', comment: 'التعدين كان مجرد حلم، لكن الآن صار حقيقة!' },
    { user: 'U9V0', comment: 'فيه حد عنده فكرة متى يتغير معدل الأرباح؟' },
    { user: 'W1X2', comment: 'مستحيل! الأرباح صارت أسرع من أول' },
    { user: 'Y3Z4', comment: 'اليوم جربت سحب 1500$ بدون أي مشاكل 😍' },
    { user: '1A2B', comment: 'السلام عليكم ورحمة الله وبركاته' },
    { user: '3C4D', comment: 'وعليكم السلام يا غالي' },
    { user: '5E6F', comment: 'هلا والله بأهل الخير' },
    { user: '7G8H', comment: 'سلام عليكم، كيف الحال؟' },
    { user: '9I0J', comment: 'حياك الله يا أخي العزيز' },
    { user: 'K1L2', comment: 'مساء الخير على الجميع' },
    { user: 'M3N4', comment: 'يا مرحبا وسهلا بالجميع' },
    { user: 'O5P6', comment: 'هلا ومرحبا بالجميع' },
    { user: 'Q7R8', comment: 'حياك الله، نورت المكان' },
    { user: 'S9T0', comment: 'هلا ابن عمي، كيف الحال؟' },
    { user: 'U1V2', comment: 'السلام عليكم، شخباركم شباب؟' },
    { user: 'W3X4', comment: 'صباح الخير، كيف يومكم؟' },
    { user: 'Y5Z6', comment: 'يا هلا والله بالنشامى' },
    { user: 'A7B8', comment: 'مساء النور على الطيبين' },
    { user: 'C9D0', comment: 'كيفكم يا جماعة الخير؟' },
    { user: 'E1F2', comment: 'السلام عليكم ورحمة الله، كيف الجميع؟' },
    { user: 'G3H4', comment: 'يا هلا وسهلا، نورتم المكان' },
    { user: 'I5J6', comment: 'وعليكم السلام ورحمة الله وبركاته' },
    { user: 'K7L8', comment: 'هلا بالشباب الطيبين' },
    { user: 'M9N0', comment: 'صباح النور والسرور' },
    { user: 'O1P2', comment: 'مساء الخير يا جماعة، أخباركم؟' },
    { user: 'Q3R4', comment: 'يا هلا ويا مرحبا' },
    { user: 'S5T6', comment: 'وعليكم السلام، كيف الأمور؟' },
    { user: 'U7V8', comment: 'حياكم الله جميعاً' },
    { user: 'W9X0', comment: 'هلا وغلا بأهل الخير' },
    { user: 'Y1Z2', comment: 'السلام عليكم، كيف السوق اليوم؟' },
    { user: 'A3B4', comment: 'كيف حالكم يا شباب؟' },
    { user: 'C5D6', comment: 'هلا ومرحبا بالجميع' },
    { user: 'E7F8', comment: 'يا هلا وسهلا، أخباركم؟' },
    { user: 'G9H0', comment: 'مساء السعادة والسرور' },
    { user: 'I1J2', comment: 'السلام عليكم يا أهل الكرم' },
    { user: 'K3L4', comment: 'هلا والله، شخباركم؟' },
    { user: 'M5N6', comment: 'نورتوا المكان والله' },
    { user: 'O7P8', comment: 'مساء الورد والياسمين' },
    { user: 'Q9R0', comment: 'حيا الله الجميع' },
    { user: 'S1T2', comment: 'السلام عليكم، كيف الجو عندكم؟' },
    { user: 'U3V4', comment: 'هلا وغلا بالجميع' },
    { user: 'W5X6', comment: 'يا مرحبا بكم' },
    { user: 'Y7Z8', comment: 'كيفكم يا شباب؟ عساكم بخير' },
    { user: 'A9B0', comment: 'هلا وغلا، نور المكان' },
    { user: 'C1D2', comment: 'صباح الخير، وش أخباركم؟' },
    { user: 'E3F4', comment: 'السلام عليكم ورحمة الله وبركاته' },
    { user: 'G5H6', comment: 'يا جماعة الخير، كيف الأمور؟' },
    { user: 'I7J8', comment: 'وعليكم السلام ورحمة الله' },
    { user: 'K9L0', comment: 'هلا بالناس الطيبة' },
    { user: 'M1N2', comment: 'حياكم الله جميعاً' },
    { user: 'O3P4', comment: 'يا صباح الفل' },
    { user: 'Q5R6', comment: 'هلا بالجميع، أخباركم؟' },
    { user: 'S7T8', comment: 'مساء النور على الكل' },
    { user: 'U9V0', comment: 'السلام عليكم ورحمة الله، كيف الأحوال؟' },
    { user: 'W1X2', comment: 'حيا الله من جانا' },
    { user: 'Y3Z4', comment: 'وعليكم السلام، كيف الحال؟' },
    { user: '1A2B', comment: 'انا جيت من قناة سعد احمد، شكراً لك على الشرح الرائع!' },
    { user: '3C4D', comment: 'الله يجازي سعد كريبتو، عرفت بوت التعدين عن طريقه' },
    { user: '5E6F', comment: 'كفو سعد احمد، تحية لك على هذا الشرح' },
    { user: '7G8H', comment: 'بفضل الله ثم بفضل سعد احمد، سحبت أول أرباحي من البوت' },
    { user: '9I0J', comment: 'يا اخوان، هل في أحد جرب البوت اللي شرح سعد كريبتو؟' },
    { user: 'K1L2', comment: 'صراحة سعد كريبتو يستحق كل الاحترام، الشرح كان واضح جداً' },
    { user: 'M3N4', comment: 'يا شباب، سعد احمد قال ان السحب سريع، هل جربه احد؟' },
    { user: 'O5P6', comment: 'والله سعد كريبتو اسطورة، دخلت البوت وربحت 400$' },
    { user: 'Q7R8', comment: 'هل البوت اللي تكلم عنه سعد احمد فعلاً مضمون؟' },
    { user: 'S9T0', comment: 'يا جماعة، في أحد يشارك أرباحه بعد شرح سعد كريبتو؟' },
    { user: 'U1V2', comment: 'سعد احمد دائماً يجيب لنا افضل الطرق للربح، مشكور' },
    { user: 'W3X4', comment: 'يا ليت كل الشروحات تكون مثل اللي يعملها سعد احمد' },
    { user: 'Y5Z6', comment: 'منو بعد دخل البوت بعد ما شاف فيديو سعد كريبتو؟' },
    { user: 'A7B8', comment: 'سعد احمد مو طبيعي، كيف يلقى هذي الفرص الذهبية؟' },
    { user: 'C9D0', comment: 'فعلاً سعد احمد كان صادق، سحبت بعد 3 أيام فقط' },
    { user: 'E1F2', comment: 'في احد يتابع سعد كريبتو؟ وش رايكم في تحليلاته؟' },
    { user: 'G3H4', comment: 'منو يتابع سعد احمد من زمان؟ فعلاً يستحق الدعم' },
    { user: 'I5J6', comment: 'انا استفدت كثير من فيديوهات سعد كريبتو، دايماً مفيدة' },
    { user: 'K7L8', comment: 'بعد ما سمعت شرح سعد احمد، دخلت التعدين وربحت 600$' },
    { user: 'M9N0', comment: 'الله يبارك فيك يا سعد كريبتو، كنت متردد بس شفت شرحك وجربت' },
    { user: '1A2B', comment: 'هل في أحد جرب يسحب أرباحه عن طريق فودافون كاش؟' },
    { user: '3C4D', comment: 'هل بينانس أفضل منصة ولا OKX أفضل للسحب السريع؟' },
    { user: '5E6F', comment: 'يا جماعة وش أسهل طريقة لشراء USDT في السعودية؟' },
    { user: '7G8H', comment: 'حد يعرف طريقة تحويل فلوسي من باينانس إلى زين كاش؟' },
    { user: '9I0J', comment: 'كيف افتح حساب OKX بدون توثيق الهوية؟' },
    { user: 'K1L2', comment: 'أسرع طريقة للسحب في مصر؟ فودافون كاش ولا بنك محلي؟' },
    { user: 'M3N4', comment: 'وش البنك السعودي اللي يقبل تحويلات العملات الرقمية بدون مشاكل؟' },
    { user: 'O5P6', comment: 'حد جرب السحب من بينانس لبنك الراجحي؟ كم يأخذ وقت؟' },
    { user: 'Q7R8', comment: 'أفضل محفظة تحفظ USDT بأمان بدون رسوم عالية؟' },
    { user: 'S9T0', comment: 'أحتاج طريقة تحويل من بينانس إلى STC Pay بدون مشاكل' },
    { user: 'U1V2', comment: 'هل ممكن أسحب أرباحي من التعدين مباشرة إلى OKX؟' },
    { user: 'W3X4', comment: 'وش الطريقة الأفضل لتحويل الكريبتو إلى كاش في الإمارات؟' },
    { user: 'Y5Z6', comment: 'حد جرب يبيع USDT عن طريق P2P في باينانس؟' },
    { user: 'A7B8', comment: 'هل يوجد بنك في العراق يدعم التحويلات من بينانس؟' },
    { user: 'C9D0', comment: 'كم تستغرق عملية السحب من باينانس إلى زين كاش؟' },
    { user: 'E1F2', comment: 'هل منصة OKX آمنة ولا الأفضل باينانس؟' },
    { user: 'G3H4', comment: 'وش أفضل منصة تدعم التداول بالدرهم الإماراتي؟' },
    { user: 'I5J6', comment: 'كيف أقدر أسحب أرباح التعدين بسرعة في الأردن؟' },
    { user: 'K7L8', comment: 'هل فيه مشكلة في إرسال أرباحي إلى بنك محلي في الكويت؟' },
    { user: 'M9N0', comment: 'ما هي أسرع طريقة لتحويل الأرباح من بينانس إلى حساب بنكي؟' },
    { user: 'N1O2', comment: 'حد عنده فكرة كيف أرسل USDT بدون رسوم عالية؟' },
    { user: 'P3Q4', comment: 'ما هو أفضل خيار للسحب السريع في الجزائر؟' },
    { user: 'R5S6', comment: 'هل ممكن أرسل أرباحي مباشرة إلى فيزا بنك الراجحي؟' },
    { user: 'T7U8', comment: 'وش الفرق بين التحويل عن طريق TRC20 و ERC20؟' },
    { user: 'V9W0', comment: 'هل فيه حد جرب شراء كريبتو ببطاقة مدى في السعودية؟' },
    { user: 'X1Y2', comment: 'أريد نصيحة عن أفضل وسيلة لسحب الأرباح من التعدين' },
    { user: 'Z3A4', comment: 'هل OKX يسمح بالسحب على بطاقات الفيزا؟' },
    { user: 'B5C6', comment: 'هل فيه رسوم إضافية عند السحب من بينانس لمحفظة فودافون كاش؟' },
    { user: 'D7E8', comment: 'حد جرب يحول من بينانس إلى STC Pay؟' },
    { user: 'F9G0', comment: 'كم تستغرق المعاملة عند سحب USDT على شبكة TRC20؟' },
    { user: 'H1I2', comment: 'أفضل محفظة لحفظ الأرباح بعيداً عن المنصات؟' },
    { user: 'J3K4', comment: 'هل السحب من بينانس لبنك محلي يحتاج إثبات هوية؟' },
    { user: 'L5M6', comment: 'كم أقل مبلغ ممكن أسحبه من OKX إلى فودافون كاش؟' },
    { user: 'N7O8', comment: 'وش الحل إذا تم حظر حسابي في بينانس بسبب السحب؟' },
    { user: 'P9Q0', comment: 'ما هي المشاكل التي قد أواجهها عند التحويل إلى بنك محلي؟' },
    { user: 'R1S2', comment: 'هل من الأفضل سحب الأرباح يومياً أم شهرياً؟' },
    { user: 'T3U4', comment: 'حد جرب يحول من منصة كوكوين إلى محفظة خارجية؟' },
    { user: 'V5W6', comment: 'كيف أقدر أبيع كريبتو وأحصل على كاش مباشرة؟' },
    { user: 'X7Y8', comment: 'هل يوجد تطبيق يدعم التحويل المباشر بين العملات الرقمية؟' },
    { user: 'Z9A0', comment: 'هل أحتاج لتوثيق هويتي في OKX لسحب أكثر من 1000$؟' },
    { user: 'B1C2', comment: 'كيف أقدر أستخدم فودافون كاش لسحب الأرباح بسهولة؟' },
    { user: 'D3E4', comment: 'هل يوجد فرق في رسوم السحب بين TRC20 و BEP20؟' },
    { user: 'F5G6', comment: 'وش هي أسرع طريقة لاستلام USDT في لبنان؟' },
    { user: 'H7I8', comment: 'هل فيه طريقة لتحويل العملات الرقمية إلى كاش في المغرب؟' },
    { user: 'J9K0', comment: 'كيف يمكنني التحويل من منصة OKX إلى حساب بنكي؟' },
    { user: 'L1M2', comment: 'ما هو الحد الأدنى للسحب في باينانس عبر P2P؟' },
    { user: 'N3O4', comment: 'هل فيه مشكلة عند التحويل من باينانس إلى زين كاش؟' },
    { user: 'P5Q6', comment: 'كيف يمكنني شراء كريبتو بدون الحاجة لحساب بنكي؟' },
    { user: 'R7S8', comment: 'وش أفضل منصة تدعم التحويل المباشر إلى حسابي البنكي؟' },
    { user: '1A2B', comment: 'استخدمت رابط الإحالة الخاص بي وسرعة التعدين زادت 3 أضعاف!' },
    { user: '3C4D', comment: 'كل واحد يشترك عبر رابط الإحالة الخاص بك يضيف لك دخل إضافي يومي 🔥' },
    { user: '5E6F', comment: 'يا شباب لا تفوتوا فرصة الإحالات، كل شخص جديد يزيد أرباحك!' },
    { user: '7G8H', comment: 'عندي 10 إحالات، وسرعة التعدين عندي صارت خرافية! 😍' },
    { user: '9I0J', comment: 'وش أفضل طريقة لنشر رابط الإحالة؟' },
    { user: 'K1L2', comment: 'كل ما تجيب أصدقاء أكثر، كل ما زادت أرباحك بدون تعب 💸' },
    { user: 'M3N4', comment: 'دخلت التعدين برأس مال بسيط ومع الإحالات صرت أسحب يومياً' },
    { user: 'O5P6', comment: 'أرسلت رابط الإحالة لـ 5 أشخاص وسحبت أول أرباحي اليوم! 🎉' },
    { user: 'Q7R8', comment: 'إذا عندك أصدقاء مهتمين بالكريبتو، سارع وشارك رابط الإحالة!' },
    { user: 'S9T0', comment: 'استثمرت بالقليل، لكن بفضل الإحالات تضاعفت أرباحي' },
    { user: 'U1V2', comment: 'يا جماعة السحب سريع جداً! استلمت أرباحي في أقل من ساعة!' },
    { user: 'W3X4', comment: 'أحد جرب السحب عن طريق TRC20؟ سريع جداً ولا فيه رسوم عالية' },
    { user: 'Y5Z6', comment: 'سحبت 500$ اليوم، وأفكر أضيف رأس مال أكبر!' },
    { user: 'A7B8', comment: 'الفلوس وصلت لمحفظتي بدون أي مشاكل، التعدين أسهل مما توقعت' },
    { user: 'C9D0', comment: 'أسرع سحب جربته! بينانس استلمت الأرباح خلال دقائق فقط' },
    { user: 'E1F2', comment: 'كيف أقدر أزيد الإحالات؟ هل فيه طريقة أفضل من نشر الرابط؟' },
    { user: 'G3H4', comment: 'بفضل الله ثم بفضل الإحالات، صرت أسحب يومياً بدون مجهود' },
    { user: 'I5J6', comment: 'سجلت في البوت أمس وسحبت أرباحي اليوم، خرافي! 🚀' },
    { user: 'K7L8', comment: 'كلما زاد عدد الإحالات، كلما صار التعدين أسرع وأرباحك أكبر!' },
    { user: 'M9N0', comment: 'ما توقعت السحب يكون سهل كذا، بدون مشاكل أبداً!' },
    { user: 'N1O2', comment: 'كيف أقدر أشوف كم شخص سجل عبر رابط الإحالة الخاص بي؟' },
    { user: 'P3Q4', comment: 'هل فيه حد جرب مشاركة رابط الإحالة على تويتر؟' },
    { user: 'R5S6', comment: 'يا جماعة، أنصحكم تشتغلوا على نشر الرابط، الأرباح خرافية!' },
    { user: 'T7U8', comment: 'وش أفضل منصة لنشر رابط الإحالة وجذب مهتمين؟' },
    { user: 'V9W0', comment: 'اليوم أول مرة أسحب 1000$ دفعة وحدة! الإحالات سر النجاح' },
    { user: 'X1Y2', comment: 'كيف يمكنني توجيه الإحالة لأشخاص مهتمين فعلاً بالتعدين؟' },
    { user: 'Z3A4', comment: 'كم نسبة الأرباح الإضافية اللي نحصلها من الإحالات؟' },
    { user: 'B5C6', comment: 'أشكر صديقي اللي أرسل لي رابط الإحالة، بسببه بدأت أكسب!' },
    { user: 'D7E8', comment: 'هل السحب اليومي أفضل، أم أنتظر حتى تتراكم الأرباح؟' },
    { user: 'F9G0', comment: 'ما أسرع محفظة تسحب عليها الأرباح بدون رسوم عالية؟' },
    { user: 'H1I2', comment: 'كيف أتأكد أن الأشخاص اللي سجلوا عبر رابط إحالي نشطين؟' },
    { user: 'J3K4', comment: 'أحد جرب يكسب أكثر من 2000$ شهرياً فقط من الإحالات؟' },
    { user: 'L5M6', comment: 'التعدين مع الإحالات تجربة مذهلة، أرباح بدون مجهود!' },
    { user: 'N7O8', comment: 'حصلت على أول إحالة لي اليوم، متحمس أشوف الأرباح!' },
    { user: 'P9Q0', comment: 'أول سحب لي كان 350$ بفضل سرعة التعدين، التجربة رهيبة' },
    { user: 'R1S2', comment: 'كم شخص تحتاج تضيفه حتى تحقق 500$ أسبوعياً؟' },
    { user: 'T3U4', comment: 'هل ينفع أروج لرابط الإحالة في مجموعات تيليجرام؟' },
    { user: 'V5W6', comment: 'يا جماعة، نشر رابط الإحالة على تيك توك جاب لي إحالات كثيرة!' },
    { user: 'X7Y8', comment: 'بعد ما أضفت 15 شخص، سرعة التعدين صارت جنونية!' },
    { user: 'Z9A0', comment: 'يا شباب، نصيحة: لا تفوتوا فرصة الإحالات، أرباحها مستمرة' },
    { user: '1A2B', comment: '😂😂 دخلت التعدين وما فهمت شي بالبداية، لكن الحين أرباحي حلوة!' },
    { user: '3C4D', comment: 'وش صار معكم شباب؟ انا انتظر أرباحي تجي!' },
    { user: '5E6F', comment: '🚀🚀 اخواني سحبت 750$ خلال 24 ساعة فقط، شيء مجنون!' },
    { user: '7G8H', comment: 'حد يفهمني كيف السحب على باينانس؟ تأخر عندي! 😓' },
    { user: '9I0J', comment: 'صديقي سجل عبر رابط الإحالة حقي وما وصلني شي، ليش؟' },
    { user: 'K1L2', comment: 'ههههه اخوي يقول لي التعدين كذب! الحين أوريه سحبي اليوم!' },
    { user: 'M3N4', comment: 'مين يستخدم OKX هنا؟ سريع للسحب ولا فيه مشاكل؟' },
    { user: 'O5P6', comment: 'يا شباب هل لازم استثمر مبلغ كبير عشان أربح زين؟' },
    { user: 'Q7R8', comment: '⚡️🔥 سرعة التعدين زادت بعد ما أضفت إحالات، الموضوع جدي!' },
    { user: 'S9T0', comment: 'أول مرة في حياتي أجرب شيء يربحني بدون تعب 🤯' },
    { user: 'U1V2', comment: 'يا اخوان فودافون كاش يقبل السحب؟ احد جرب؟' },
    { user: 'W3X4', comment: '😂😂 دخلت المجموعة غلط، وش التعدين ذا؟' },
    { user: 'Y5Z6', comment: 'اذا سحبت كل يوم هل أرباحي تتأثر؟ حد عنده تجربة؟' },
    { user: 'A7B8', comment: 'بفضل الله ثم التعدين، قدرت اشتري جوال جديد 🎉' },
    { user: 'C9D0', comment: 'التعدين هذا أسهل من شغل الدوام الرسمي صراحة 😂' },
    { user: 'E1F2', comment: '🚀 ارباحي زادت بعد ما بديت اشارك رابط الإحالة، شي رهيب' },
    { user: 'G3H4', comment: 'التعدين سريع لكن ليش الإيداع أحياناً يتأخر؟' },
    { user: 'I5J6', comment: '💰💰 ايش افضل طريقة لتسريع الأرباح؟ حد ينصحني' },
    { user: 'K7L8', comment: 'سجلت بدون ما افهم شي، بس فجأة لقيت فلوس في المحفظة!! 😍' },
    { user: 'M9N0', comment: 'انا نايم وصحيت لقيت أرباحي زادت! مستحيل 😂' },
    { user: 'N1O2', comment: 'حد يفسر لي ليش بعض الأيام الأرباح تكون أعلى من أيام ثانية؟' },
    { user: 'P3Q4', comment: 'احس اني فنان، أول مرة أدخل تعدين وأربح بسرعة! 🎉' },
    { user: 'R5S6', comment: 'كيف أزيد سرعة التعدين؟ حديقالي ان في طرق ثانية' },
    { user: 'T7U8', comment: '🔥🔥 دخلت بدون إحالات، الآن صار عندي 15 إحالة والربح ناري' },
    { user: 'V9W0', comment: 'التعدين شغال لكن المشكلة فيي انا، اصرف الأرباح بسرعة 🤦‍♂️' },
    { user: 'X1Y2', comment: '💸💸 انا للحين ما صدقت اني سحبت فلوس حقيقية!!' },
    { user: 'Z3A4', comment: 'حد جرب يسحب على زين كاش؟ سريع ولا يأخذ وقت؟' },
    { user: 'B5C6', comment: '😂 دخلت أشوف وش السالفة وطلعت مستثمر فجأة' },
    { user: 'D7E8', comment: 'وش السر ان البعض يسحب بسرعة وانا لسّه انتظر؟' },
    { user: 'F9G0', comment: 'احس الدنيا تغيرت بعد ما لقيت التعدين هذا 😂' },
    { user: 'H1I2', comment: 'تجربتي: دخلت بتردد، الآن عندي سحوبات اسبوعية مستمرة! 🤩' },
    { user: 'J3K4', comment: 'يا اخوان لا تفوتوا الإحالات، كل شخص يضيف لك ربح اضافي' },
    { user: 'L5M6', comment: 'كم تحتاج عشان تسحب 1000$؟ حد جرب؟' },
    { user: 'N7O8', comment: 'الموضوع سهل مرة! دخلت وشفت فلوسي تزيد يومياً' },
    { user: 'P9Q0', comment: '✨✨ انا صراحة مو مصدق ان هذي اسهل طريقة للربح' },
    { user: 'R1S2', comment: 'كيف أعرف ان الحساب حقي شغال صح؟ في شي اتأكد منه؟' },
    { user: 'T3U4', comment: 'احد جرب يربط حسابه مع منصة ثانية مثل OKX؟' },
    { user: 'V5W6', comment: 'التعدين سريع، بس لازم أوقف نفسي عن الصرف بسرعة 😂' },
    { user: 'X7Y8', comment: 'تصدقون؟ اخوي دخل عن طريقي وساعدني ازيد دخلي!!' },
    { user: 'Z9A0', comment: 'يا جماعة هل في رسوم خفية ما نعرفها؟ حد يوضح' },
    { user: '1A2B', comment: '🤡 ليش كل ما ادخل المحفظة احس ان فلوسي تختفي؟' },
    { user: '3C4D', comment: 'ههههههههههههه واحد قالي اذا استثمرت اكثر بتحصل على بيتكوين مجاني!! 😂😂😂' },
    { user: '5E6F', comment: 'كيف احذف حسابي؟ اخوي دخل وبدأ يحول فلوسي بدون ما ادري 😭' },
    { user: '7G8H', comment: 'ياخي كل يوم اقول بسحب الأرباح واصرفها على شيء مفيد، واخرتها اطلب وجبات سريعة 🤦‍♂️' },
    { user: '9I0J', comment: 'مستحيل!!!! كيف السحب صار اسرع من دفع الرواتب؟ 🤣' },
    { user: 'K1L2', comment: '🚀🚀 دخلت ب 50$ الحين عندي 500$، بس ما ادري وين راحت كلها!!' },
    { user: 'M3N4', comment: 'ليش ما في احد يرد على استفساراتي؟ هل انا وحيد في هذا العالم؟' },
    { user: 'O5P6', comment: 'ياخي الموقع شغال 100% لكن عقلي مش قادر يستوعب كيف يشتغل 😂' },
    { user: 'Q7R8', comment: 'أحد يعرف كيف استرجع فلوسي؟ دخلت بحسابي في حلمي وسرقتني الأحلام!' },
    { user: 'S9T0', comment: 'ايش فائدة التعدين اذا فلوسي كلها تروح على رسوم السحب؟! 😡' },
    { user: 'U1V2', comment: 'واحد قال لي اضغط هذا الزر وبتربح فلوس، ضغطت عليه وطلعني من الحساب 😭' },
    { user: 'W3X4', comment: 'يوم دخلت التعدين توقعت اشتري سيارة، اخرتها اشتريت شاورما' },
    { user: 'Y5Z6', comment: '🤣🤣🤣 حلفت اني ما بدخل منصات بعد اليوم، والآن داخل بحسابين!!' },
    { user: 'A7B8', comment: 'ليش كل مرة احاول اسحب الفلوس تطلع لي رسوم اكبر من الرصيد؟ 😡' },
    { user: 'C9D0', comment: 'مستحيل!!! دخلت بـ 1000$ وسحبت 950$، يعني خسرت 50$؟!! وين المشكلة؟؟' },
    { user: 'E1F2', comment: 'كيف اقدر احول ارباحي لصديقي بدون ما يدري انها ارباح؟ 🤔' },
    { user: 'G3H4', comment: 'كل يوم اخبر نفسي اني بستثمر زيادة، لكن كل يوم انتهي بطلب بيتزا' },
    { user: 'I5J6', comment: '🔥🔥 والله سرعة السحب صدمتني!! توقعت 3 أيام، استلمتها خلال 5 دقايق!!!' },
    { user: 'K7L8', comment: 'حد يقولي كيف اسحب 10,000$ بدون لا يعرف البنك؟' },
    { user: 'M9N0', comment: 'والله العظيم التعدين هذا شكله سحر، كيف فلوسي تزيد وانا نايم؟ 😂' },
    { user: 'N1O2', comment: '😭 كل ما اسحب ارباحي، اقول بوقف، لكن ارجع استثمرها!!' },
    { user: 'P3Q4', comment: 'هل اذا جبت إحالات كثيرة بقدر اخذ اجازة من الشغل؟ 🤔' },
    { user: 'R5S6', comment: '🚀🚀 وين الناس اللي كانت تقول التعدين نصب؟ شوفوا الارباح كيف طايرة!!' },
    { user: 'T7U8', comment: 'حد عنده فكرة كيف اقنع اهلي ان التعدين شغل حقيقي؟' },
    { user: 'V9W0', comment: '🤑🤑 دخلت اشوف وش السالفة وطلعت مليونير افتراضي!!' },
    { user: 'X1Y2', comment: 'صديقي يقول لي التعدين نصب، بس شاف ارباحي وسكت 😂' },
    { user: 'Z3A4', comment: 'كم مرة لازم اسحب قبل ما احس اني مليونير؟' },
    { user: 'B5C6', comment: 'اخوي سألني ليش ارباحي ترتفع، قلت له سحر الاقتصاد الرقمي 😆' },
    { user: 'D7E8', comment: 'يا جماعة الخير، ابي افتح بنك خاص فيني، احد عنده فكرة؟' },
    { user: 'F9G0', comment: '🚨🚨 اخواني، جربت كل الطرق وما قدرت اخسر فلوسي، الارباح مستمرة!!' },
    { user: 'H1I2', comment: 'زوجتي تقول لي وقف التعدين، بس انا اشوفها افضل وظيفة بالحياة' },
    { user: 'J3K4', comment: 'انا متأكد ان فلوسي تكاثر نفسها بدون علمي، احد يوضح لي؟' },
    { user: 'L5M6', comment: '💀 دخلت احاول اسحب الارباح، فجأة اكتشفت اني استثمرت اكثر' },
    { user: 'N7O8', comment: 'كيف اقنع صديقي ان التعدين ما يحتاج شهادة جامعية؟' },
    { user: 'P9Q0', comment: '🤣🤣🤣 حلمت اني سحبت مليون دولار، صحيت لقيت رصيدي ناقص 10$' },
    { user: 'R1S2', comment: 'ليش اهلي يضحكون علي لما اقول لهم ارباحي من التعدين؟' },
    { user: 'T3U4', comment: '👀 احد عنده فكرة كيف اقنع البنك ان هذه فلوسي فعلاً؟' },
    { user: 'V5W6', comment: 'واحد كلمني وقال عنده طريقة يضاعف فلوسي، قلت له حبيبي عندي التعدين' },
    { user: 'X7Y8', comment: '🚀🚀 ارسلت رابط الاحالة لصديقي، قالي خلاص انا مليونير!' },
    { user: 'Z9A0', comment: '🤡 اخوي سألني كيف احصل فلوس، قلت له من التعدين، قالي علمني السحر' },
    { user: '1A2B', comment: '😂😂😂😂😂' },
    { user: '3C4D', comment: '💰💰💰🔥🔥' },
    { user: '5E6F', comment: 'WTF is this?! 🤬' },
    { user: '7G8H', comment: '🤣🤣🤣🤣🤣🤣🤣🤣🤣' },
    { user: '9I0J', comment: 'Fuck you and your system!!!' },
    { user: 'K1L2', comment: '🤡🤡🤡🤡🤡🤡' },
    { user: 'M3N4', comment: 'C’est quoi ce bordel???' },
    { user: 'O5P6', comment: 'الله ياخدكم 😂😂😂' },
    { user: 'Q7R8', comment: '👀👀👀👀👀👀👀👀' },
    { user: 'S9T0', comment: 'Fick dich 😂😂😂' },
    { user: 'U1V2', comment: 'Waaaaaa 🤯🤯🤯🤯' },
    { user: 'W3X4', comment: '💀💀💀💀💀💀' },
    { user: 'Y5Z6', comment: 'Tu madre es un desastre 🤣' },
    { user: 'A7B8', comment: '🤬🤬🤬🤬🤬' },
    { user: 'C9D0', comment: 'Est-ce que c’est une blague?!' },
    { user: 'E1F2', comment: 'يا كلب انت وصاحبك' },
    { user: 'G3H4', comment: '👎👎👎👎👎' },
    { user: 'I5J6', comment: '🤣🤣 This is crazy man!' },
    { user: 'K7L8', comment: '🚨🚨🚨🚨🚨🚨' },
    { user: 'M9N0', comment: 'Je comprends rien bordel' },
    { user: 'N1O2', comment: 'الله يحرقكم 😡' },
    { user: 'P3Q4', comment: '🤦‍♂️🤦‍♂️🤦‍♂️🤦‍♂️' },
    { user: 'R5S6', comment: '🖕🖕🖕🖕🖕🖕' },
    { user: 'T7U8', comment: 'Das ist absoluter Müll!' },
    { user: 'V9W0', comment: 'Oye, esto no tiene sentido!' },
    { user: 'X1Y2', comment: '😡😡😡😡😡' },
    { user: 'Z3A4', comment: '🤯🤯🤯🤯🤯🤯' },
    { user: 'B5C6', comment: '너 미쳤어?! 🤬' },
    { user: 'D7E8', comment: 'C’est quoi cette merde ?!' },
    { user: 'F9G0', comment: '🤬🤬 What the hell!' },
    { user: 'H1I2', comment: '👊👊👊👊👊' },
    { user: 'J3K4', comment: 'Vaffanculo 🤣🤣🤣' },
    { user: 'L5M6', comment: 'لا تعليق! 😤' },
    { user: 'N7O8', comment: '💩💩💩💩💩' },
    { user: 'P9Q0', comment: 'Joder tío!!!' },
    { user: 'R1S2', comment: '👀👀 Are you serious?!' },
    { user: 'T3U4', comment: 'No me lo puedo creer 😂😂' },
    { user: 'V5W6', comment: '🤡🤡 This is stupid' },
    { user: 'X7Y8', comment: 'شيء زفت بكل معنى الكلمة 🤬' },
    { user: 'Z9A0', comment: '🤬🤬 FUCK THIS SHIT' },
    { user: '1A2B', comment: 'والله يا شباب سحبت 850$ اليوم وصلت خلال 10 دقايق، قسم بالله رهيب 🔥' },
    { user: '3C4D', comment: 'ي اخوان استلمت 500$ بعد 7 دقايق من السحب!! شي خرافي' },
    { user: '5E6F', comment: 'الحمدلله الفلوس وصلتني، شكلي بسوي سحب ثاني الحين 😆' },
    { user: '7G8H', comment: '🤣🤣🤣 منو بعد سحب اليوم؟ الفلوس نزلتلي بلمح البصر' },
    { user: '9I0J', comment: 'صدقوني اسرع سحب جربته، البوت ده مو طبيعي 💸💸' },
    { user: 'K1L2', comment: 'يا عيال اقسم بالله انبسطت، سحبت 650$ خلال ثواني!!' },
    { user: 'M3N4', comment: 'اليوم سحبت 1200$ وما توقعت يوصل بهالسرعة! 💰💰' },
    { user: 'O5P6', comment: '😂😂 بعد ما سحبت، كنت مفكر رح يتأخر، طلع اسرع من الراتب' },
    { user: 'Q7R8', comment: 'منو بعده عنده إحالات؟ زودوا إحالاتكم، السحب صار أسهل 🚀' },
    { user: 'S9T0', comment: 'استلمت 900$ وسويت سحب ثاني، كله بفضل الله ثم البوت 🔥' },
    { user: 'U1V2', comment: 'حد يصدق! طلبت سحب وخلص قبل لا اكمل كوب الشاي 🤣' },
    { user: 'W3X4', comment: 'سحبت اليوم، وصلتني الفلوس اسرع من المكالمة اللي سويتها مع البنك 😆' },
    { user: 'Y5Z6', comment: 'يا جماعة السحب وصل خلال 5 دقايق! شي مش طبيعي 😳' },
    { user: 'A7B8', comment: 'امس طلبت سحب 750$ واليوم كررته، كله تمام وسريع 🔥' },
    { user: 'C9D0', comment: 'حقيقي؟ سحبت ومباشرة وصلني عالباينانس، أقسم بالله' },
    { user: 'E1F2', comment: 'يا ناس يا هوووو الفلوس نزلت بسرعة الصاروخ' },
    { user: 'G3H4', comment: 'بشركم استلمت 400$ ومبسوط، شكلي رح اضيف راس مال زيادة' },
    { user: 'I5J6', comment: 'اللهم بارك، سحبت الأرباح وفكرت اجرب اسحب اكثر!' },
    { user: 'K7L8', comment: '😆 حسيت اني بنك! سحبت بسرعة وبدون مشاكل' },
    { user: 'M9N0', comment: 'أبشركم يا جماعة الفلوس وصلت بعد ما كنت متوتر 🔥' },
    { user: 'N1O2', comment: '😂😂 طلعت ارباحي اسرع من ما توقعت، أحسن من الشغل التقليدي' },
    { user: 'P3Q4', comment: 'تخيلوا سحبت مرتين اليوم، المرة الثانية اسرع من الأولى!!' },
    { user: 'R5S6', comment: 'شكلي بحول شغلي الاساسي لهذا، السحب سريع والفلوس مضمونة 😍' },
    { user: 'T7U8', comment: 'أقسم بالله البوت خرافي، الفلوس جات اسرع من محادثة واتساب' },
    { user: 'V9W0', comment: 'حاولت اجرب سحب صغير اول شي، وبعده سحبت 1000$ مباشرة 😂' },
    { user: 'X1Y2', comment: 'صديقي ما كان مصدق، وريتله السحب قدام عيونه!' },
    { user: 'Z3A4', comment: 'الحين اقدر اشتري اللي ببالي، ارباحي وصلت خلال دقايق 💸' },
    { user: 'B5C6', comment: 'بشركم سحبت 600$، الحمدلله سرعة خرافية' },
    { user: 'D7E8', comment: 'اللي ما جرب السحب للحين، راح عليه! جربوا واستمتعوا!' },
    { user: 'F9G0', comment: 'وش هذا؟ دخلت اسحب وبدون انتظار نزلت ارباحي 💰' },
    { user: 'H1I2', comment: 'والله حسيت كأن عندي ماكينة فلوس، السحب سريع 🔥' },
    { user: 'J3K4', comment: 'طلعت لي الفلوس بشكل اسرع من سرعة النت عندي 🤣' },
    { user: 'L5M6', comment: 'ما صدقت بالبداية، بس لما شفت الرصيد بعيني، تفاجأت 😍' },
    { user: 'N7O8', comment: 'شباب نصيحة: لا تستنى، السحب سريع وما فيه مشاكل' },
    { user: 'P9Q0', comment: 'طلبت سحب وقلت بانتظر، نزلت الفلوس قبل ما افكر فيها 😂' },
    { user: 'R1S2', comment: 'الحمدلله الفلوس صارت بحسابي، افضل تجربة سحب مرّت عليّ' },
    { user: 'T3U4', comment: 'ما توقعت الموضوع يكون بسيط كذا، فعلاً ارباح سهلة!' },
    { user: 'V5W6', comment: 'سحبت اليوم؟ اذا لا، فانت فوت فرصة حقيقية!' },
    { user: 'X7Y8', comment: 'حاولت اجرب سحب جزء من ارباحي، وصلني كله مرة وحدة!' },
    { user: 'Z9A0', comment: 'ياخي انا للحين مو مصدق ان السحب سريع كذا! 🤩' },
];


// Generate random user ID
function generateUserId() {
    return Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Get time difference in human-readable format
function getTimeAgo(timestamp) {
    if (!timestamp) return 'الآن';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} ثانية مضت`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} دقيقة مضت`;
    const hours = Math.floor(minutes / 60);
    return `${hours} ساعة مضت`;
}

// Create comment element with improved UI
function createCommentElement(userId, commentText, timestamp) {
    if (!commentText) return null;
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.style.opacity = '0';
    commentDiv.style.transform = 'translateY(-10px)';
    commentDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    commentDiv.innerHTML = `
<div class="comment-header">
<div class="comment-user">
<div class="flex flex-col items-center justify-center bg-purple-900/40 h-8 w-8 rounded-full">
  <div class="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-md shadow-blue-500/20"></div>
</div>
<span class="text-sm font-medium text-purple-400 mr-2">
  المستخدم #${userId}
</span>
</div>
<span class="text-xs text-purple-400/70" data-timestamp="${timestamp}">
${getTimeAgo(timestamp)}
</span>
</div>
<p class="comment-text border-r-2 border-purple-500/40 pr-3 mt-2 leading-relaxed">
${commentText}
</p>
`;

    // Animate in after adding to DOM
    setTimeout(() => {
        commentDiv.style.opacity = '1';
        commentDiv.style.transform = 'translateY(0)';
    }, 10);

    return commentDiv;
}

// Check if user is at bottom
function isUserAtBottom(container) {
    const threshold = 50; // Tolerance in pixels
    return container.scrollHeight - container.clientHeight <= container.scrollTop + threshold;
}

// Scroll to bottom
function scrollToBottom(force = false) {
    const container = document.getElementById('commentsContainer');
    if (!container) return;

    // Run after DOM updates
    requestAnimationFrame(() => {
        if (force || isUserAtBottom(container)) {
            container.scrollTop = container.scrollHeight;
        }
    });
}

// Update timestamps for all comments
function updateAllCommentTimes() {
    document.querySelectorAll('[data-timestamp]').forEach(el => {
        const timestamp = parseInt(el.getAttribute('data-timestamp'));
        if (!isNaN(timestamp)) el.textContent = getTimeAgo(timestamp);
    });
}

// Generate fake comments on first visit
function generateInitialComments() {
    // User-specific storage key for comments
    let commentsKey = 'userComments';
    if (telegramUser && telegramUser.id) {
        commentsKey = `userComments_${telegramUser.id}`;
    }

    const savedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    if (savedComments.length === 0) { // Only generate if no comments exist
        const initialComments = fakeComments.slice(0, 10).map(comment => ({
            user: generateUserId(),
            comment: comment.comment,
            timestamp: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24), // Randomize timestamps
        }));
        localStorage.setItem(commentsKey, JSON.stringify(initialComments));
    }
}

// Load initial comments
function loadComments() {
    // User-specific storage key for comments
    let commentsKey = 'userComments';
    if (telegramUser && telegramUser.id) {
        commentsKey = `userComments_${telegramUser.id}`;
    }

    const container = document.getElementById('commentsContainer');
    const savedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
    container.innerHTML = '';
    savedComments.forEach(comment => {
        const element = createCommentElement(comment.user, comment.comment, comment.timestamp);
        if (element) container.appendChild(element); // Add comments at the bottom
    });
    scrollToBottom(true); // Force scroll to bottom on initial load
}

// Handle comment form submission
document.getElementById('commentForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('commentInput');
    const commentText = input.value.trim();

    if (!commentText) {
        showNotification('لا يمكن أن تكون الرسالة فارغة!', 'warning'); // Show notification if empty
        return;
    }

    if (commentText) {
        const container = document.getElementById('commentsContainer');
        const wasAtBottom = isUserAtBottom(container);

        // Use telegram user ID if available, otherwise generate random ID
        let userId = generateUserId();
        if (telegramUser && telegramUser.first_name) {
            userId = telegramUser.first_name.substring(0, 4).toUpperCase();
        }

        const timestamp = Date.now();
        const commentElement = createCommentElement(userId, commentText, timestamp);

        if (commentElement) {
            container.appendChild(commentElement); // Add new comment at the bottom

            // User-specific storage key for comments
            let commentsKey = 'userComments';
            if (telegramUser && telegramUser.id) {
                commentsKey = `userComments_${telegramUser.id}`;
            }

            // Save comment to localStorage
            const savedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
            savedComments.push({ user: userId, comment: commentText, timestamp }); // Add to the end

            // Remove oldest comment if more than 10
            if (savedComments.length > 10) {
                savedComments.shift(); // Remove the first comment
                container.removeChild(container.firstChild); // Remove the first comment from the DOM
            }

            localStorage.setItem(commentsKey, JSON.stringify(savedComments));
            input.value = '';
            updateAllCommentTimes();
            scrollToBottom(wasAtBottom);
        }
    }
});

// Add random fake comments
function addRandomComment() {
    const container = document.getElementById('commentsContainer');
    const wasAtBottom = isUserAtBottom(container);

    const randomIndex = Math.floor(Math.random() * fakeComments.length);
    const randomComment = fakeComments[randomIndex];
    const timestamp = Date.now();

    const commentElement = createCommentElement(randomComment.user, randomComment.comment, timestamp);
    if (commentElement) {
        container.appendChild(commentElement); // Add new comment at the bottom

        // User-specific storage key for comments
        let commentsKey = 'userComments';
        if (telegramUser && telegramUser.id) {
            commentsKey = `userComments_${telegramUser.id}`;
        }

        // Save comment to localStorage
        const savedComments = JSON.parse(localStorage.getItem(commentsKey) || '[]');
        savedComments.push({ user: randomComment.user, comment: randomComment.comment, timestamp });

        // Remove oldest comment if more than 10
        if (savedComments.length > 10) {
            savedComments.shift(); // Remove the first comment
            container.removeChild(container.firstChild); // Remove the first comment from the DOM
        }

        localStorage.setItem(commentsKey, JSON.stringify(savedComments));
        updateAllCommentTimes();
        scrollToBottom(wasAtBottom);
    }

    // Schedule next random comment
    const delay = Math.random() * 1000 + 500; // Random delay between 5-20 seconds
    setTimeout(addRandomComment, delay);
}

// Initial load
window.addEventListener('DOMContentLoaded', () => {
    generateInitialComments(); // Generate fake comments on first visit
    loadComments(); // Load saved comments
    addRandomComment(); // Start adding random comments
    updateReferralUI(); // Initialize referral UI

    // Initialize mining visualization based on current mining state
    if (isMining) {
        document.getElementById('ethLogo').classList.add('animate-pulse');

        // Add animation to each processor icon
        document.getElementById('processor-icon-1').classList.add('processor-icon');
        document.getElementById('processor-icon-2').classList.add('processor-icon');
        document.getElementById('processor-icon-3').classList.add('processor-icon');
        document.getElementById('processor-icon-4').classList.add('processor-icon');

        document.getElementById('miningStatusIcon').className = 'fas fa-circle text-green-400 animate-pulse text-xs';
        document.getElementById('miningStatusText').innerHTML = '<i id="miningStatusIcon" class="fas fa-circle text-green-400 animate-pulse text-xs"></i>نشط';
    } else {
        document.getElementById('ethLogo').classList.remove('animate-pulse');

        // Remove animation from each processor icon
        document.getElementById('processor-icon-1').classList.remove('processor-icon');
        document.getElementById('processor-icon-2').classList.remove('processor-icon');
        document.getElementById('processor-icon-3').classList.remove('processor-icon');
        document.getElementById('processor-icon-4').classList.remove('processor-icon');

        document.getElementById('miningStatusIcon').className = 'fas fa-circle text-red-400 text-xs';
        document.getElementById('miningStatusText').innerHTML = '<i id="miningStatusIcon" class="fas fa-circle text-red-400 text-xs"></i>غير نشط';
    }
});

const resetMiner = () => {
    // Reset core variables (force to exactly 0)
    ethCounter = 0;
    isMining = false;
    lastUpdateTime = Date.now();

    // Save to user-specific storage with forced values
    if (telegramUser && telegramUser.id) {
        const userId = telegramUser.id;
        localStorage.setItem(`earnedETH_${userId}`, "0");
        localStorage.setItem(`isMining_${userId}`, "false");
        localStorage.setItem(`lastUpdateTime_${userId}`, Date.now().toString());
    } else {
        // Fallback to global storage
        localStorage.setItem('earnedETH', "0");
        localStorage.setItem('isMining', "false");
        localStorage.setItem('lastUpdateTime', Date.now().toString());
    }

    // Hide all modals
    document.getElementById('finalConfirmModal').classList.add('hidden');
    document.getElementById('walletModal').classList.add('hidden');
    document.getElementById('withdrawModal').classList.add('hidden');
    document.getElementById('paymentModal').classList.add('hidden');

    // Update button appearance to initial state
    const mainActionBtn = document.getElementById('mainActionBtn');
    mainActionBtn.innerHTML = '<i class="fas fa-play-circle mr-2"></i>بدء التعدين';
    mainActionBtn.className = 'premium-button mining-btn-inactive text-base py-4 w-full max-w-xs mx-auto';

    // Reset mining visualization to inactive state
    document.getElementById('ethLogo').classList.remove('animate-pulse');

    // Remove animation from each processor icon
    document.getElementById('processor-icon-1').classList.remove('processor-icon');
    document.getElementById('processor-icon-2').classList.remove('processor-icon');
    document.getElementById('processor-icon-3').classList.remove('processor-icon');
    document.getElementById('processor-icon-4').classList.remove('processor-icon');

    document.getElementById('miningStatusIcon').className = 'fas fa-circle text-red-400 text-xs';
    document.getElementById('miningStatusText').innerHTML = '<i id="miningStatusIcon" class="fas fa-circle text-red-400 text-xs"></i>غير نشط';

    // Clear any form fields
    if (document.getElementById('usdtAddressInput')) {
        document.getElementById('usdtAddressInput').value = '';
    }
    if (document.getElementById('addressConfirmation')) {
        document.getElementById('addressConfirmation').checked = false;
    }

    // Update UI to reflect reset state
    updateEarnings();
    updateUI();

    // Show confirmation notification
    showNotification('تم إعادة تعيين التعدين بنجاح! يمكنك البدء من جديد.', 'success');

    console.log("Mining completely reset!");
};

const copyAddress = () => {
    const addressEl = document.getElementById('usdtAddress');
    if (!addressEl) {
        console.error('Element with id "usdtAddress" not found.');
        return;
    }
    navigator.clipboard.writeText(addressEl.textContent)
        .then(() => showNotification('تم نسخ العنوان!', 'success'))
        .catch((err) => {
            console.error("Copy failed:", err);
            showNotification('فشل نسخ العنوان.', 'error');
        });
};

// Attach to the global object so inline event handlers can access it.
window.copyAddress = copyAddress;
window.resetMiner = resetMiner;
window.cancelPayment = cancelPayment;
window.closeWarningModal = closeWarningModal;

// التحديث التلقائي
setInterval(() => {
    if (isMining) {
        updateEarnings();
        updateUI();
    }
}, 1000);

// FOMO Popup System
const fomoMessages = [
    { type: 'mining', template: 'بدأ التعدين للتو وحقق {amount} ETH' },
    { type: 'mining', template: 'قام بتعدين {amount} ETH في الساعة الماضية' },
    { type: 'withdraw', template: 'سحب للتو {amount}$ إلى محفظته' },
    { type: 'withdraw', template: 'حصل على {amount}$ من خلال التعدين' },
    { type: 'referral', template: 'قام بإضافة {count} إحالات وقلل رسوم السحب' },
    { type: 'upgrade', template: 'قام بترقية سرعة التعدين إلى {speed} H/s' }
];

const arabicNames = [
    'أحمد', 'محمد', 'علي', 'عمر', 'خالد', 'حسن', 'فهد', 'سعيد', 'ياسر', 'هاني',
    'سارة', 'فاطمة', 'نور', 'ليلى', 'مريم', 'عائشة', 'رنا', 'سلمى', 'دانا', 'هدى',
    'أمير', 'ناصر', 'يوسف', 'إبراهيم', 'عبدالله', 'راشد', 'فيصل', 'سلطان', 'مصطفى', 'زياد'
];

function showFomoPopup() {
    const popup = document.getElementById('fomoPopup');
    const messageEl = document.getElementById('fomoMessage');
    const timestampEl = document.getElementById('fomoTimestamp');
    const initialEl = document.getElementById('fomoUserInitial');

    // Select random message type and template
    const messageObj = fomoMessages[Math.floor(Math.random() * fomoMessages.length)];
    let message = messageObj.template;

    // Generate random values based on message type
    if (messageObj.type === 'mining') {
        const amount = (Math.random() * 0.5 + 0.2).toFixed(4);
        message = message.replace('{amount}', amount);
    } else if (messageObj.type === 'withdraw') {
        const amount = Math.floor(Math.random() * 1500 + 500);
        message = message.replace('{amount}', amount);
    } else if (messageObj.type === 'referral') {
        const count = Math.floor(Math.random() * 50 + 50);
        message = message.replace('{count}', count);
    } else if (messageObj.type === 'upgrade') {
        const speed = (Math.random() * 20 + 15).toFixed(2);
        message = message.replace('{speed}', speed);
    }

    // Random Arabic name
    const randomName = arabicNames[Math.floor(Math.random() * arabicNames.length)];
    const initial = randomName.charAt(0);

    // Set content
    messageEl.textContent = `${randomName} ${message}`;
    initialEl.textContent = initial;
    timestampEl.textContent = 'قبل ' + Math.floor(Math.random() * 10 + 1) + ' دقائق';

    // Show popup with animation
    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.8) translateY(20px)';
    popup.style.display = 'block';

    setTimeout(() => {
        popup.style.opacity = '1';
        popup.style.transform = 'scale(1) translateY(0)';
    }, 100);

    // Hide popup after 5 seconds
    setTimeout(() => {
        popup.style.opacity = '0';
        popup.style.transform = 'scale(0.8) translateY(20px)';
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }, 5000);
}

// Show FOMO popup every 20-40 seconds
function scheduleFomoPopup() {
    const delay = Math.floor(Math.random() * 20000) + 20000; // 20-40 seconds
    setTimeout(() => {
        showFomoPopup();
        scheduleFomoPopup(); // Schedule next popup
    }, delay);
}

// Animate mining efficiency with small random changes to look more realistic
function animateMiningEfficiency() {
    const efficiencyElement = document.getElementById('miningEfficiencyDecimal');
    if (efficiencyElement) {
        const randomDecimal = Math.floor(Math.random() * 8) + 1; // Random decimal between 1-8
        efficiencyElement.textContent = randomDecimal;
    }

    // Update every 3-6 seconds with a random interval
    const nextUpdate = Math.random() * 3000 + 3000;
    setTimeout(animateMiningEfficiency, nextUpdate);
}

// Start efficiency animation
animateMiningEfficiency();

// Start FOMO popups after page loads
setTimeout(scheduleFomoPopup, 5000);

// Update all timestamps periodically
setInterval(updateAllCommentTimes, 30000);

// التهيئة الأولية
updateEarnings();
updateUI();