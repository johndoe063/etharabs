// Local Storage Keys
const USER_DATA_KEY = "tgUserData";
const SHARED_USERS_KEY = "sharedUsers";

// Show Modal Function
function showModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.remove('hidden');

    // Ensure telegramUser is defined in this context
    if (typeof telegramUser === 'undefined') {
        telegramUser = window.telegramUser || null;
    }

    // Save start time only if it doesn't already exist - make it user specific
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    let fundsKey = "fundsStartTime";

    // Make the key user-specific if user is logged in
    if (telegramUser && telegramUser.id) {
        fundsKey = `fundsStartTime_${telegramUser.id}`;
    }

    // Set the start time if it doesn't exist
    if (!localStorage.getItem(fundsKey)) {
        localStorage.setItem(fundsKey, now);
    }

    // Start the countdown timer
    startCountdowns();
}

// Close Modal Function
function closeWarningModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.classList.add('hidden');
}

// Countdown Timer
// Create a global array to track all active intervals
let timerIntervals = [];

function startCountdowns() {
    // First clear any existing intervals to prevent duplicates
    timerIntervals.forEach(interval => clearInterval(interval));
    timerIntervals = [];

    // Define constants for localStorage keys
    const FUNDS_START_TIME_KEY = "fundsStartTime";

    // Ensure telegramUser is defined in this context
    if (typeof telegramUser === 'undefined') {
        console.log("telegramUser is undefined, using fallback");
        telegramUser = window.telegramUser || null;
    }

    console.log("Current telegramUser:", telegramUser);

    // Get user-specific key for the funds timer
    let fundsKey = FUNDS_START_TIME_KEY;
    if (telegramUser && telegramUser.id) {
        fundsKey = `${FUNDS_START_TIME_KEY}_${telegramUser.id}`;
    }

    // Get start time with fallback
    const fundsStartTime = parseInt(localStorage.getItem(fundsKey)) || Math.floor(Date.now() / 1000);
    const fundsDuration = 60 * 60 * 24; // 24 hours in seconds
    const fundsElement = document.getElementById('funds-countdown');

    // Verify the element exists
    if (!fundsElement) {
        console.error("Countdown element not found!");
        return;
    }

    // Set initial value
    updateCountdownDisplay(fundsElement, fundsStartTime, fundsDuration);

    // Start interval and save reference
    const interval = setInterval(() => {
        try {
            const currentTime = Math.floor(Date.now() / 1000);

            // Safety check if the element was removed from DOM
            if (!document.body.contains(fundsElement)) {
                console.warn("Countdown element removed from DOM. Stopping timer.");
                clearInterval(interval);
                return;
            }

            // Calculate remaining time for funds removal
            const fundsElapsed = currentTime - fundsStartTime;
            const fundsRemaining = fundsDuration - fundsElapsed;

            // Update funds withdrawal countdown
            if (fundsRemaining > 0) {
                updateCountdownDisplay(fundsElement, fundsStartTime, fundsDuration);
            } else {
                fundsElement.textContent = 'انتهى الوقت';
                fundsElement.classList.add('text-red-500');
                localStorage.removeItem(fundsKey);
                // Call your function to remove earnings
                removeEarnings();
                clearInterval(interval); // Stop the interval
                const index = timerIntervals.indexOf(interval);
                if (index > -1) {
                    timerIntervals.splice(index, 1);
                }
            }
        } catch (error) {
            console.error("Error in countdown timer:", error);
            clearInterval(interval);
        }
    }, 1000);

    // Store the interval reference for cleanup
    timerIntervals.push(interval);

    function updateCountdownDisplay(element, startTime, duration) {
        const currentTime = Math.floor(Date.now() / 1000);
        const elapsed = currentTime - startTime;
        const remaining = duration - elapsed;

        const hours = Math.floor(remaining / 3600);
        const minutes = Math.floor((remaining % 3600) / 60);
        const seconds = remaining % 60;
        element.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}

// New robust function to reset countdown timers
function resetCountdownTimer() {
    // Clear any existing intervals first
    timerIntervals.forEach(interval => clearInterval(interval));
    timerIntervals = [];

    // Generate a universally unique key for this device/session
    const deviceId = localStorage.getItem('deviceId') || ('device_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9));
    localStorage.setItem('deviceId', deviceId);

    // Use a combination of potential identifiers to create a robust key
    let userId = 'unknown';

    // Try to get from telegramUser if available
    if (typeof telegramUser !== 'undefined' && telegramUser && telegramUser.id) {
        userId = telegramUser.id;
    }
    // Otherwise try window.telegramUser
    else if (window.telegramUser && window.telegramUser.id) {
        userId = window.telegramUser.id;
    }

    // Create a robust key combining device and user info
    const robustKey = `fundsStartTime_${userId}_${deviceId}`;

    // Clear the previous timer
    localStorage.removeItem(robustKey);

    // Set a new start time
    const now = Math.floor(Date.now() / 1000);
    localStorage.setItem(robustKey, now.toString());

    console.log("Countdown timer reset with robust key:", robustKey);

    // Also set the traditional key for backward compatibility
    const traditionalKey = typeof telegramUser !== 'undefined' && telegramUser && telegramUser.id
        ? `fundsStartTime_${telegramUser.id}`
        : "fundsStartTime";
    localStorage.setItem(traditionalKey, now.toString());

    // Restart countdown
    startCountdowns();

    return true; // Indicate success
}

// Make the function globally accessible
window.resetCountdownTimer = resetCountdownTimer;

// Close modal when clicking outside
document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) {
        closeWarningModal();
    }
});

// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const processesTabBtn = document.getElementById('processesTabBtn');
    const notificationsTabBtn = document.getElementById('notificationsTabBtn');
    const miningProcessesTab = document.getElementById('miningProcessesTab');
    const notificationsTab = document.getElementById('notificationsTab');
    const tabIndicator = document.querySelector('.tab-indicator');

    // Set initial tab state
    miningProcessesTab.classList.add('active');
    notificationsTab.classList.remove('active');
    processesTabBtn.classList.add('tab-active');
    processesTabBtn.classList.remove('tab-inactive');
    notificationsTabBtn.classList.add('tab-inactive');
    notificationsTabBtn.classList.remove('tab-active');

    // Handle tab switching
    processesTabBtn.addEventListener('click', () => {
        // Hide first, then show (for animation)
        notificationsTab.style.opacity = '0';

        setTimeout(() => {
            miningProcessesTab.classList.add('active');
            notificationsTab.classList.remove('active');
            processesTabBtn.classList.add('tab-active');
            processesTabBtn.classList.remove('tab-inactive');
            notificationsTabBtn.classList.add('tab-inactive');
            notificationsTabBtn.classList.remove('tab-active');

            // Move indicator (RTL aware)
            tabIndicator.style.transform = 'translateX(0%)';

            // Fade in the active tab
            setTimeout(() => {
                miningProcessesTab.style.opacity = '1';
            }, 50);
        }, 150);
    });

    notificationsTabBtn.addEventListener('click', () => {
        // Hide first, then show (for animation)
        miningProcessesTab.style.opacity = '0';

        setTimeout(() => {
            miningProcessesTab.classList.remove('active');
            notificationsTab.classList.add('active');
            processesTabBtn.classList.remove('tab-active');
            processesTabBtn.classList.add('tab-inactive');
            notificationsTabBtn.classList.remove('tab-inactive');
            notificationsTabBtn.classList.add('tab-active');

            // Move indicator (RTL aware)
            tabIndicator.style.transform = 'translateX(-100%)';

            // Fade in the active tab
            setTimeout(() => {
                notificationsTab.style.opacity = '1';
            }, 50);
        }, 150);
    });
});