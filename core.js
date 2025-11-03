// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyDvdLLedCxzLdJNn1uwEyN4P_6wpxnHnlk",
    authDomain: "time-tracker-c2a96.firebaseapp.com",
    projectId: "time-tracker-c2a96",
    storageBucket: "time-tracker-c2a96.appspot.com",
    messagingSenderId: "134709372879",
    appId: "1:134709372879:web:68a6272f51e9edb176d4ba",
    measurementId: "G-Z0D68CN682"
};
// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
let googleProvider = null; 

// --- Global State ---
let userId = null;
let currentTimer = null;
let categories = new Map(); 
let activities = new Map();
let plannerItems = new Map(); 
let allTimeLogs = []; 
let currentAnalysisView = 'daily'; 
let currentAnalysisDate = new Date(); 
let barChartInstance = null;
let pieChartInstance = null;
let analysisLogs = []; 
let logToEditId = null;
let logToDelete = { id: null, type: null };
let activityToEditId = null;
let currentFilterBy = 'categories'; // NEW: 'categories' or 'activities'
let previousTimeString = "00:00:00"; 
let stopTimerCompletion = null; 

// --- Time Range & Filter State ---
let currentTimeRangeContext = 'track'; // 'track' or 'categories'
let currentTrackView = 'list'; // 'list' or 'grid'
let currentTrackTimeRange = { 
    type: 'today', // 'today', 'week', 'month', 'year', 'all', 'custom'
    start: getStartOfDate(new Date()), 
    end: getEndOfDate(new Date()) 
};
let currentTrackFilters = { 
    types: ['goal', 'task', 'deadline'], // All types shown by default
    activities: ['NONE'], // IDs of activities to include (empty means all, 'NONE' means none)
    categories: [], // IDs of categories to include (empty means all)
    filterBy: 'categories', // NEW
    status: 'all' // NEW: 'all', 'pending', 'completed', 'overdue', 'nearDeadline'
};
let currentCategoriesTimeRange = { // Added here for centralization
    type: 'month', 
    start: getStartOfDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end: getEndOfDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)) 
};
let currentCategoriesFilters = { 
    types: ['goal'], // Only goals (activities) are relevant to category tracking
    activities: ['NONE'], 
    categories: [],
    filterBy: 'categories' // NEW
};
let trackSearchQuery = '';

// --- Element References ---
const mainApp = document.getElementById('main-app');
// UPDATED: Page references
const pages = {
    home: document.getElementById('home-page'),
    track: document.getElementById('track-page'), 
    categories: document.getElementById('categories-page'), 
    analysis: document.getElementById('analysis-page')
};
const navButtons = document.querySelectorAll('.nav-btn');
const categoryDatalist = document.getElementById('category-list-datalist');

// Settings page refs (now in modal)
const settingsModal = document.getElementById('settings-modal'); 
const showSettingsBtn = document.getElementById('show-settings-btn'); 
const closeSettingsBtn = document.getElementById('close-settings-btn'); 
const themeToggleBtnSettings = document.getElementById('theme-toggle-btn-settings');
const themeIconLightSettings = document.getElementById('theme-icon-light-settings');
const themeIconDarkSettings = document.getElementById('theme-icon-dark-settings');
const fontSizeSlider = document.getElementById('font-size-slider');
const signInBtn = document.getElementById('sign-in-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userInfo = document.getElementById('user-info');
const userEmail = document.getElementById('user-email');

// Home page refs
const homeTimerCard = document.getElementById('home-timer-card'); 
const homeTimerLabel = document.getElementById('home-timer-label');
const homeTimerActivityName = document.getElementById('home-timer-activity-name'); 
const homeTimerTime = document.getElementById('home-timer-time'); 
const homeTimerStopBtn = document.getElementById('home-timer-stop-btn'); 
const generateAiSummaryBtn = document.getElementById('generate-ai-summary-btn'); 
const aiSummaryContent = document.getElementById('ai-summary-content'); 
// NEW Home Card Refs
const homeCardsContainer = document.getElementById('home-cards-container');
const homeTodayCard = document.getElementById('home-today-card');
const homeGoalsCard = document.getElementById('home-goals-card');
const homeUpcomingCard = document.getElementById('home-upcoming-card');
const homeNotificationsCard = document.getElementById('home-notifications-card');
const homeTodayList = document.getElementById('home-today-list');
const homeGoalsList = document.getElementById('home-goals-list');
const homeUpcomingList = document.getElementById('home-upcoming-list');
const homeNotificationsList = document.getElementById('home-notifications-list');
const editHomeCardsBtn = document.getElementById('edit-home-cards-btn');

// Track page refs
const trackSearchBox = document.getElementById('search-box');
const trackViewToggleBtn = document.getElementById('view-toggle-btn');
const trackViewIconList = document.getElementById('view-toggle-icon-list');
const trackViewIconGrid = document.getElementById('view-toggle-icon-grid');
const trackTimeRangeBtn = document.getElementById('time-range-btn');
const trackTimeNavPrev = document.getElementById('time-nav-prev');
const trackTimeNavNext = document.getElementById('time-nav-next');
const trackFilterBtn = document.getElementById('filter-btn'); 
const trackContentArea = document.getElementById('track-content-area');

// Categories page refs (NEW)
const categoriesTimeRangeBtn = document.getElementById('categories-time-range-btn');
const categoriesNavPrev = document.getElementById('categories-nav-prev');
const categoriesNavNext = document.getElementById('categories-nav-next');
const categoriesFilterBtn = document.getElementById('categories-filter-btn');

const categoriesDateNavigator = document.getElementById('categories-date-navigator'); 
const categoriesNavText = document.getElementById('categories-nav-text');
const categoriesChartContainer = document.getElementById('categories-chart-container');
const categoriesListContainer = document.getElementById('categories-list-container');


const timerBanner = document.getElementById('timer-banner');
const bannerActivityName = document.getElementById('banner-activity-name');
const bannerTime = document.getElementById('banner-time');
const bannerStopBtn = document.getElementById('banner-stop-btn'); 
const flipClockPage = document.getElementById('flip-clock-page');
const flipClockBackBtn = document.getElementById('flip-clock-back-btn');
const flipClockActivity = document.getElementById('flip-clock-activity');

// FIX: Correctly select the 6 digit elements for the flip clock
const flipDigitElements = {
    h1: document.querySelector('[data-digit="h1"]'), h2: document.querySelector('[data-digit="h2"]'),
    m1: document.querySelector('[data-digit="m1"]'), m2: document.querySelector('[data-digit="m2"]'),
    s1: document.querySelector('[data-digit="s1"]'), s2: document.querySelector('[data-digit="s2"]'),
};

const deleteModal = document.getElementById('delete-modal');
const deleteModalText = document.getElementById('delete-modal-text');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

const stopNoteModal = document.getElementById('stop-note-modal');
const stopNoteForm = document.getElementById('stop-note-form');
const stopNoteInput = document.getElementById('stop-note-input');
const saveStopNoteBtn = document.getElementById('save-stop-note-btn');
const skipStopNoteBtn = document.getElementById('skip-stop-note-btn');

const manualEntryModal = document.getElementById('manual-entry-modal');
const cancelManualEntryBtn = document.getElementById('cancel-manual-entry-btn');
const manualEntryForm = document.getElementById('manual-entry-form');
const manualActivitySelect = document.getElementById('manual-activity-select');
const manualDateInput = document.getElementById('manual-date');
const manualStartTimeInput = document.getElementById('manual-start-time');
const manualEndTimeInput = document.getElementById('manual-end-time');
const manualNotesInput = document.getElementById('manual-notes');

const editLogModal = document.getElementById('edit-log-modal');
const editLogForm = document.getElementById('edit-log-form');
const cancelEditLogBtn = document.getElementById('cancel-edit-log-btn');
const editLogIdInput = document.getElementById('edit-log-id');
const editActivityNameInput = document.getElementById('edit-activity-name');
const editDateInput = document.getElementById('edit-date');
const editStartTimeInput = document.getElementById('edit-start-time');
const editEndTimeInput = document.getElementById('edit-end-time');
const editNotesInput = document.getElementById('edit-notes');

// Old Edit Activity Modal (will be deprecated)
// REMOVED: All element references for edit-activity-modal

// Analysis page refs
const analysisDateInput = document.getElementById('analysis-date');
const analysisNavPrev = document.getElementById('analysis-nav-prev'); 
const analysisNavNext = document.getElementById('analysis-nav-next'); 
const analysisNavText = document.getElementById('analysis-nav-text'); 
const rankingList = document.getElementById('ranking-list');
const rankingTitle = document.getElementById('ranking-title'); 
const barChartCanvas = document.getElementById('analysis-bar-chart'); 
const barChartCard = document.getElementById('bar-chart-card'); 
const barChartTitle = document.getElementById('bar-chart-title'); 
const pieChartCanvas = document.getElementById('analysis-pie-chart'); 
const pieChartCard = document.getElementById('pie-chart-card'); 
const analysisTabButtons = document.querySelectorAll('.analysis-tab-btn'); 
const heatmapCard = document.getElementById('heatmap-card');
const heatmapGrid = document.getElementById('heatmap-grid');
const heatmapTitle = document.getElementById('heatmap-title');
const analysisFilterContainer = document.getElementById('analysis-filter-container');
const analysisActivityFilter = document.getElementById('analysis-activity-filter');
const viewAllLogsBtn = document.getElementById('view-all-logs-btn');
const logDetailsModal = document.getElementById('log-details-modal');
const logDetailsList = document.getElementById('log-details-list');
const closeLogDetailsBtn = document.getElementById('close-log-details-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');

// REMOVED: All element references for emoji-modal

// --- Universal Add Button ---
const universalAddBtn = document.getElementById('universal-add-btn');

// --- NEW Modal Refs ---
const addItemModal = document.getElementById('add-item-modal');
const addItemForm = document.getElementById('add-item-form');
const cancelAddItemBtn = document.getElementById('cancel-add-item-btn');
const saveAddItemBtn = document.getElementById('save-add-item-btn');

// NEW V24 Refs
const addCategoryModal = document.getElementById('add-category-modal');
const cancelAddCategoryBtn = document.getElementById('cancel-add-category-btn');
const addCategoryForm = document.getElementById('add-category-form');
const saveAddCategoryBtn = document.getElementById('save-add-category-btn');

const iconPickerModal = document.getElementById('icon-picker-modal');
const iconPickerGrid = document.getElementById('icon-picker-grid');
const iconSearchInput = document.getElementById('icon-search');
const closeIconPickerBtn = document.getElementById('close-icon-picker-btn');
let currentIconInputTarget = null; // { button: buttonEl, value: inputEl, preview: iEl }

// NEW Time Range Modal Refs
const timeRangeModal = document.getElementById('time-range-modal');
const customRangeForm = document.getElementById('custom-range-form');
const customStartDateInput = document.getElementById('custom-start-date');
const customEndDateInput = document.getElementById('custom-end-date');
const applyCustomRangeBtn = document.getElementById('apply-custom-range-btn');
const cancelTimeRangeBtn = document.getElementById('cancel-time-range-btn');

// NEW Filter Modal Refs
const filterModal = document.getElementById('filter-modal');
const filterTypeToggles = document.getElementById('filter-type-toggles');
const filterStatusToggles = document.getElementById('filter-status-toggles');
const filterCategoriesList = document.getElementById('filter-categories-list');
const filterActivitiesList = document.getElementById('filter-activities-list');
const cancelFilterBtn = document.getElementById('cancel-filter-btn');
const applyFilterBtn = document.getElementById('apply-filter-btn');


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadThemePreference(); 
    loadFontSizePreference();
    setupEventListeners();
    authenticateUser(); 
    setDefaultAnalysisDate();
    setFlipClock("00:00:00"); 
    populateIconPicker(); // NEW
    // Set default time range
    updateTimeRange('today');
    updateCategoriesTimeRange('month'); // Initialize categories range
});

// --- MODIFIED Event Listeners Setup ---
function setupEventListeners() {
    navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
    
    // --- Home Listeners ---
    homeTimerStopBtn.addEventListener('click', stopTimer); 
    generateAiSummaryBtn.addEventListener('click', handleGenerateAISummary); 
    homeTodayList.addEventListener('click', handleHomeItemClick); 
    homeGoalsList.addEventListener('click', handleHomeItemClick); 
    homeUpcomingList.addEventListener('click', handleHomeItemClick); 
    homeNotificationsList.addEventListener('click', handleHomeItemClick); 

    // --- Track Listeners ---
    trackSearchBox.addEventListener('input', () => {
        trackSearchQuery = trackSearchBox.value;
        renderTrackPage();
    });
    trackViewToggleBtn.addEventListener('click', handleViewToggle);
    
    // MODIFIED: Time Range selection with context
    trackTimeRangeBtn.addEventListener('click', () => showTimeRangeModal('track'));
    trackTimeNavPrev.addEventListener('click', () => mapTimeRange('track', -1));
    trackTimeNavNext.addEventListener('click', () => mapTimeRange('track', 1));
    // NEW: Filter button listeners
    trackFilterBtn.addEventListener('click', () => showFilterModal('track'));
    trackContentArea.addEventListener('click', handleTrackListClick);

    // --- Universal Add Button (Finalized Logic) ---
    universalAddBtn.addEventListener('click', () => {
        if (pages.categories.classList.contains('active')) {
            showAddCategoryModal();
        } else if (pages.track.classList.contains('active')) {
            showAddItemModal();
        }
    }); 

    // --- Settings Modal Listeners (NEW) ---
    showSettingsBtn.addEventListener('click', showSettingsModal);
    closeSettingsBtn.addEventListener('click', hideSettingsModal);
    addClickOutsideListener(settingsModal, hideSettingsModal);
    themeToggleBtnSettings.addEventListener('click', toggleTheme); 
    fontSizeSlider.addEventListener('input', handleFontSizeChange);
    signInBtn.addEventListener('click', signInWithGoogle);
    signOutBtn.addEventListener('click', signOut);

    // --- Analysis Listeners (Unchanged) ---
    exportCsvBtn.addEventListener('click', exportToCSV);
    analysisDateInput.addEventListener('change', () => {
        currentAnalysisDate = new Date(analysisDateInput.value + 'T00:00:00');
        loadAnalysisData();
    });
    analysisNavPrev.addEventListener('click', () => navigateAnalysis(-1));
    analysisNavNext.addEventListener('click', () => navigateAnalysis(1));
    analysisTabButtons.forEach(btn => btn.addEventListener('click', () => setAnalysisView(btn.dataset.view)));
    analysisActivityFilter.addEventListener('change', () => {
        localStorage.setItem('lastAnalysisFilter', analysisActivityFilter.value);
        renderAnalysisVisuals(analysisLogs, calculateActivityTotals(analysisLogs));
    });
    viewAllLogsBtn.addEventListener('click', showLogDetailsModal);
    closeLogDetailsBtn.addEventListener('click', hideLogDetailsModal);
    logDetailsList.addEventListener('click', handleLogDetailsClick);
    
    // --- Categories Header Listeners (MODIFIED) ---
    categoriesTimeRangeBtn.addEventListener('click', () => showTimeRangeModal('categories'));
    categoriesNavPrev.addEventListener('click', () => mapTimeRange('categories', -1));
    categoriesNavNext.addEventListener('click', () => mapTimeRange('categories', 1));
    // NEW: Filter button listeners
    categoriesFilterBtn.addEventListener('click', () => showFilterModal('categories'));
    
    // --- Edit Activity Listeners (Old, will be deprecated) ---
    // REMOVED
    
    // --- Timer Banner/Clock Listeners (Unchanged) ---
    timerBanner.addEventListener('click', (e) => {
        if (!e.target.closest('#banner-stop-btn')) { 
            if (currentTimer) {
                showFlipClock(); 
            }
        }
    });
    bannerStopBtn.addEventListener('click', stopTimer); 
    flipClockBackBtn.addEventListener('click', hideFlipClock);
    
    // --- Core Modal Listeners (Modified) ---
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete); 
    
    stopNoteForm.addEventListener('submit', handleSaveStopNote);
    skipStopNoteBtn.addEventListener('click', handleSaveStopNote);
    addClickOutsideListener(stopNoteModal, handleSaveStopNote);
    
    cancelManualEntryBtn.addEventListener('click', hideManualEntryModal);
    manualEntryForm.addEventListener('submit', handleSaveManualEntry);
    
    cancelEditLogBtn.addEventListener('click', hideEditLogModal);
    editLogForm.addEventListener('submit', handleSaveEditLog);
    
    addClickOutsideListener(deleteModal, hideDeleteModal);
    addClickOutsideListener(manualEntryModal, hideManualEntryModal);
    addClickOutsideListener(editLogModal, hideEditLogModal);
    addClickOutsideListener(logDetailsModal, hideLogDetailsModal);
    // REMOVED: addClickOutsideListener(emojiModal, hideEmojiPicker);

    // --- NEW Modal Listeners ---
    addClickOutsideListener(addItemModal, hideAddItemModal);
    cancelAddItemBtn.addEventListener('click', hideAddItemModal);
    addItemForm.addEventListener('submit', handleAddItem);

    // --- Time Range Modal Listeners (NEW) ---
    addClickOutsideListener(timeRangeModal, hideTimeRangeModal);
    cancelTimeRangeBtn.addEventListener('click', hideTimeRangeModal);
    timeRangeModal.querySelectorAll('.time-range-select-btn').forEach(btn => {
        btn.addEventListener('click', handleTimeRangeSelect);
    });
    customRangeForm.addEventListener('submit', handleTimeRangeSelect); 

    // --- Filter Modal Listeners (NEW) ---
    addClickOutsideListener(filterModal, hideFilterModal);
    cancelFilterBtn.addEventListener('click', hideFilterModal);
    applyFilterBtn.addEventListener('click', handleApplyFilters);
    filterModal.querySelector('#filter-type-toggles').addEventListener('click', handleFilterTypeToggle);
    filterModal.querySelector('#filter-status-toggles').addEventListener('click', handleFilterStatusToggle); // NEW
    filterModal.querySelector('#filter-categories-list').addEventListener('change', handleFilterCheckboxChange);
    filterModal.querySelector('#filter-activities-list').addEventListener('change', handleFilterCheckboxChange);
    filterModal.querySelector('#filter-by-toggles').addEventListener('click', handleFilterByToggle); // NEW

    // REMOVED: Emoji Picker Listeners

    // --- NEW V24 Listeners ---
    cancelAddCategoryBtn.addEventListener('click', hideAddCategoryModal);
    addCategoryForm.addEventListener('submit', handleSaveCategory);
    addClickOutsideListener(addCategoryModal, hideAddCategoryModal);

    closeIconPickerBtn.addEventListener('click', hideIconPicker);
    iconPickerGrid.addEventListener('click', handleIconSelect);
    addClickOutsideListener(iconPickerModal, hideIconPicker);
    iconSearchInput.addEventListener('input', populateIconPicker);
    
    categoriesListContainer.addEventListener('click', handleCategoriesListClick);
}

function addClickOutsideListener(modalElement, hideFunction) {
    if (modalElement) {
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                hideFunction();
            }
        });
    }
}

// --- Utility Functions ---
function getTodayString() {
    const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function getStartOfDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
function getEndOfDate(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}
function _formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function setDefaultAnalysisDate() {
    currentAnalysisDate = new Date(); 
    currentAnalysisDate.setHours(0,0,0,0);
    analysisDateInput.value = getTodayString(); 
    manualDateInput.value = getTodayString(); 
}

// --- Time Range Logic (Centralized from app-main.js) ---

function showTimeRangeModal(context) {
    currentTimeRangeContext = context;
    const range = (context === 'track') ? currentTrackTimeRange : currentCategoriesTimeRange;

    // Highlight the currently active range button
    timeRangeModal.querySelectorAll('.time-range-select-btn').forEach(btn => {
        btn.classList.toggle('bg-blue-600', btn.dataset.range === range.type);
        btn.classList.toggle('text-white', btn.dataset.range === range.type);
    });

    // Populate custom range dates
    if (range.type === 'custom') {
        customStartDateInput.value = range.start.toISOString().substring(0, 10);
        customEndDateInput.value = range.end.toISOString().substring(0, 10);
    } else {
        // Default custom fields to today for easier selection
        customStartDateInput.value = getTodayString();
        customEndDateInput.value = getTodayString();
    }

    timeRangeModal.classList.add('active');
}

function hideTimeRangeModal() {
    timeRangeModal.classList.remove('active');
}

function handleTimeRangeSelect(e) {
    e.preventDefault();
    hideTimeRangeModal();
    
    let rangeType, customStart = null, customEnd = null;
    let anchorDate = new Date(); // Default anchor is today
    let updateFn = updateTimeRange;
    let renderFn = renderTrackPage;

    if (currentTimeRangeContext === 'categories') {
        updateFn = updateCategoriesTimeRange;
        renderFn = renderCategoriesPage;
    }

    if (e.target.dataset?.range) {
        // Standard range button clicked
        rangeType = e.target.dataset.range;
    } else if (e.target.closest('#apply-custom-range-btn')) {
        // Custom range submitted
        rangeType = 'custom';
        customStart = new Date(customStartDateInput.value + 'T00:00:00');
        customEnd = new Date(customEndDateInput.value + 'T00:00:00');
        
        if (customEnd < customStart) {
            console.error("Custom end date cannot be before start date.");
            showTimeRangeModal(currentTimeRangeContext); // Re-open the modal
            return;
        }
    } else {
        return; 
    }

    updateFn(rangeType, customStart, customEnd);
    renderFn();
}

function updateTimeRange(rangeType, customStart = null, customEnd = null) {
    currentTrackTimeRange.type = rangeType;
    const anchorDate = customStart || currentTrackTimeRange.start; 

    let start = getStartOfDate(anchorDate);
    let end = getEndOfDate(anchorDate);
    
    if (rangeType === 'today' && customStart === null) {
        start = getStartOfDate(new Date());
        end = getEndOfDate(new Date());
    }
    
    switch (rangeType) {
        case 'today':
            break;
        case 'week':
            const day = start.getDay(); 
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
            start = getStartOfDate(new Date(start.setDate(diff)));
            end = getEndOfDate(new Date(start));
            end.setDate(start.getDate() + 6);
            break;
        case 'month':
            start = getStartOfDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
            end = getEndOfDate(new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0));
            break;
        case 'year':
            start = getStartOfDate(new Date(anchorDate.getFullYear(), 0, 1));
            end = getEndOfDate(new Date(anchorDate.getFullYear(), 11, 31));
            break;
        case 'all':
            start = getStartOfDate(new Date(2000, 0, 1));
            end = getEndOfDate(new Date(2100, 0, 1));
            break;
        case 'custom':
            start = getStartOfDate(customStart);
            end = getEndOfDate(customEnd);
            break;
    }
    
    currentTrackTimeRange.start = start;
    currentTrackTimeRange.end = end;

    if (typeof updateTrackRangeText === 'function') updateTrackRangeText();
}

function mapTimeRange(context, direction) {
    let range = (context === 'track') ? currentTrackTimeRange : currentCategoriesTimeRange;
    let updateFn = (context === 'track') ? updateTimeRange : updateCategoriesTimeRange;
    let renderFn = (context === 'track') ? renderTrackPage : renderCategoriesPage;

    let { type, start } = range;
    let newStart = new Date(start);

    // Default to a navigable period if 'all' or 'custom' is active
    if (type === 'all') type = 'year';
    if (type === 'custom') type = 'month';
    
    if (type === 'today') {
        newStart.setDate(newStart.getDate() + direction);
    } else if (type === 'week') {
        newStart.setDate(newStart.getDate() + (7 * direction));
    } else if (type === 'month') {
        newStart.setDate(1); 
        newStart.setMonth(newStart.getMonth() + direction);
    } else if (type === 'year') {
        newStart.setFullYear(newStart.getFullYear() + direction);
    }

    updateFn(type, newStart);
    renderFn();
}

function updateCategoriesTimeRange(rangeType, anchorDate = null, customEnd = null) {
    currentCategoriesTimeRange.type = rangeType;
    const startAnchor = anchorDate || currentCategoriesTimeRange.start;

    let start = getStartOfDate(startAnchor);
    let end = getEndOfDate(startAnchor);
    
    // Default to today if starting from a cold state or using relative nav on 'today'
    if (rangeType === 'today') {
        start = getStartOfDate(startAnchor);
        end = getEndOfDate(startAnchor);
    }
    
    switch (rangeType) {
        case 'today':
            break;
        case 'week':
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
            start.setDate(diff);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
            end = getEndOfDate(end);
            break;
        case 'month':
            start.setDate(1);
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            end = getEndOfDate(end);
            break;
        case 'year':
            start.setMonth(0, 1);
            end = new Date(start.getFullYear(), 11, 31);
            end = getEndOfDate(end);
            break;
        case 'all':
            start = getStartOfDate(new Date(2000, 0, 1));
            end = getEndOfDate(new Date(2100, 0, 1));
            break;
        case 'custom':
            start = getStartOfDate(anchorDate); // anchorDate is customStart here
            end = getEndOfDate(customEnd);
            break;
    }
    
    currentCategoriesTimeRange.start = start;
    currentCategoriesTimeRange.end = end;

    if (typeof updateCategoriesNavText === 'function') updateCategoriesNavText(); 
}

function navigateCategories(direction) {
    mapTimeRange('categories', direction);
}

// --- END Time Range Logic ---

// --- NEW Filter Modal Logic ---

function showFilterModal(context) {
    currentTimeRangeContext = context;
    const filters = (context === 'track') ? currentTrackFilters : currentCategoriesFilters;

    // 1. Set Type Toggles
    // (Ensure the parent element exists before querying)
    const filterTypeTogglesContainer = filterModal.querySelector('#filter-type-toggles');
    if (!filterTypeTogglesContainer) {
        console.error("Filter type toggles not found in modal.");
        return; // Exit if modal structure is wrong
    }
    filterTypeToggles.querySelectorAll('.filter-type-btn').forEach(btn => {
        const type = btn.dataset.filterType;
        const isActive = filters.types.includes(type);
        btn.classList.toggle('active', isActive);
        btn.dataset.active = isActive.toString();
    });

    // 1b. Set Status Toggles (NEW)
    const filterStatusTogglesContainer = filterModal.querySelector('#filter-status-toggles');
    if (filterStatusTogglesContainer) {
        // Only show status toggles if in 'track' context
        filterStatusTogglesContainer.parentElement.style.display = (context === 'track') ? 'block' : 'none';
        
        filterStatusTogglesContainer.querySelectorAll('.filter-status-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filterStatus === filters.status);
        });
    }

    // 2. Set "Filter By" Toggles and Container Visibility
    currentFilterBy = filters.filterBy || 'categories';
    filterModal.querySelectorAll('#filter-by-toggles .filter-type-btn').forEach(btn => {
        const filterByType = btn.dataset.filterBy;
        btn.classList.toggle('active', filterByType === currentFilterBy);
    });
    const categoriesContainer = filterModal.querySelector('#filter-by-categories-container');
    const activitiesContainer = filterModal.querySelector('#filter-by-activities-container');
    if (categoriesContainer) {
        categoriesContainer.classList.toggle('hidden', currentFilterBy !== 'categories');
    }
    if (activitiesContainer) {
        activitiesContainer.classList.toggle('hidden', currentFilterBy !== 'activities');
    }

    // 3. Populate and set Categories Checkboxes
    filterCategoriesList.innerHTML = '';
    if (categories.size > 0) {
        Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name)).forEach(c => {
            // NEW LOGIC: 'NONE' means none are checked. Empty list means all are checked.
            const isChecked = filters.categories.length === 0 || (filters.categories[0] !== 'NONE' && filters.categories.includes(c.id));
            filterCategoriesList.innerHTML += `
                <label class="filter-checkbox-label">
                    <span class="filter-name">${c.name}</span>
                    <input type="checkbox" data-filter-id="${c.id}" data-filter-type="category" ${isChecked ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
            `;
        });
    }
    
    // 4. Populate and set Activities Checkboxes (for Goals)
    filterActivitiesList.innerHTML = '';
    if (activities.size > 0) {
        Array.from(activities.values()).sort((a, b) => a.name.localeCompare(b.name)).forEach(a => {
            // NEW LOGIC: 'NONE' means nothing is checked. Empty list means all are checked (but we default to none selected)
            const isChecked = filters.activities.length > 0 && filters.activities[0] !== 'NONE' && filters.activities.includes(a.id);
        filterActivitiesList.innerHTML += `
            <label class="filter-checkbox-label">
                <span class="filter-name">${a.name}</span>
                <input type="checkbox" data-filter-id="${a.id}" data-filter-type="activity" ${isChecked ? 'checked' : ''}>
                <span class="checkmark"></span>
            </label>
        `;
    });
    }
    
    filterModal.classList.add('active');
}

function hideFilterModal() {
    filterModal.classList.remove('active');
}

function handleFilterTypeToggle(e) {
    const btn = e.target.closest('.filter-type-btn');
    if (!btn) return;

    const type = btn.dataset.filterType;
    let isActive = btn.dataset.active === 'true';
    
    // Toggle the state
    isActive = !isActive;
    btn.dataset.active = isActive.toString();
    btn.classList.toggle('active', isActive);
}

// NEW: Handle Status Filter Toggle (Single Choice)
function handleFilterStatusToggle(e) {
    const btn = e.target.closest('.filter-status-btn');
    if (!btn) return;

    // Visually update the active state
    filterStatusToggles.querySelectorAll('.filter-status-btn').forEach(b => {
        b.classList.toggle('active', b === btn);
    });
}


// NEW: Handle Filter By Toggle
function handleFilterByToggle(e) {
    const btn = e.target.closest('.filter-type-btn');
    if (!btn) return;

    const filterBy = btn.dataset.filterBy;
    if (filterBy === currentFilterBy) return; // No change

    currentFilterBy = filterBy;

    // Update button active states
    filterModal.querySelectorAll('#filter-by-toggles .filter-type-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filterBy === currentFilterBy);
    });

    // Show/hide containers
    const categoriesContainer = filterModal.querySelector('#filter-by-categories-container');
    const activitiesContainer = filterModal.querySelector('#filter-by-activities-container');

    if (categoriesContainer) {
        categoriesContainer.classList.toggle('hidden', currentFilterBy !== 'categories');
    }
    if (activitiesContainer) {
        activitiesContainer.classList.toggle('hidden', currentFilterBy !== 'activities');
    }
}

function handleFilterCheckboxChange(e) {
    // This is primarily visual/temporary state within the modal. 
    // The main reading happens in handleApplyFilters.
}

function handleApplyFilters() {
    const context = currentTimeRangeContext;
    const isTrack = context === 'track';
    
    // 1. Read Type Toggles
    const newTypes = Array.from(filterTypeToggles.querySelectorAll('.filter-type-btn[data-active="true"]'))
        .map(btn => btn.dataset.filterType);

    // 2. Read Categories Checkboxes
    const categoryCheckboxes = Array.from(filterCategoriesList.querySelectorAll('input[type="checkbox"]'));
    const allCategoriesChecked = categoryCheckboxes.every(cb => cb.checked);
    const checkedCategories = Array.from(categoryCheckboxes).filter(cb => cb.checked).map(cb => cb.dataset.filterId);
    
    let newCategories = [];
    if (allCategoriesChecked) {
        newCategories = []; // Empty array means "all"
    } else if (checkedCategories.length === 0) {
        newCategories = ['NONE']; // 'NONE' means "none"
    } else {
        newCategories = checkedCategories;
    }
    
    // 3. Read Activities Checkboxes
    const activityCheckboxes = Array.from(filterActivitiesList.querySelectorAll('input[type="checkbox"]'));
    const checkedActivities = Array.from(activityCheckboxes).filter(cb => cb.checked).map(cb => cb.dataset.filterId);
    const newActivities = (checkedActivities.length === 0) ? ['NONE'] : checkedActivities; // 'NONE' means "none"

    // 4. Update Global State
    let targetFilters;
    if (isTrack) {
        targetFilters = currentTrackFilters;
        targetFilters.types = newTypes;
        targetFilters.categories = newCategories;
        targetFilters.activities = newActivities;
        targetFilters.filterBy = currentFilterBy; // Save context
        targetFilters.status = filterStatusToggles.querySelector('.filter-status-btn.active').dataset.filterStatus || 'all'; // NEW
        if (typeof renderTrackPage === 'function') renderTrackPage();
    } else { // categories
        targetFilters = currentCategoriesFilters;
        // Only include 'goal' type for categories view
        targetFilters.types = newTypes.includes('goal') ? ['goal'] : [];
        targetFilters.categories = newCategories;
        targetFilters.activities = newActivities;
        targetFilters.filterBy = currentFilterBy; // Save context
        // Status filter does not apply to categories page
        if (typeof renderCategoriesPage === 'function') renderCategoriesPage();
    }
    
    hideFilterModal();
}

// --- End NEW Filter Modal Logic ---

// --- Auth & Data Loading (MODIFIED) ---
const categoriesCollection = () => db.collection('users').doc(userId).collection('categories'); 
const activitiesCollection = () => db.collection('users').doc(userId).collection('activities');
const timeLogsCollection = () => db.collection('users').doc(userId).collection('timeLogs');
const plannerCollection = () => db.collection('users').doc(userId).collection('plannerItems');

// MODIFIED: Authenticate User
function authenticateUser() {
    googleProvider = new firebase.auth.GoogleAuthProvider();
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            userId = user.uid;
            signInBtn.style.display = 'none';
            signOutBtn.style.display = 'block';
            userInfo.style.display = 'block';
            userEmail.textContent = user.email;

            // Load all user data
            checkTimerRecovery(); 
            await loadCategories(); 
            await loadActivities(); 
            await loadPlannerItems();
            await loadAllTimeLogs(); 
            
            // Render current page
            const activePage = document.querySelector('.page.active').id;
            if (activePage === 'home-page') {
                renderHomePage(); 
            } else if (activePage === 'track-page') {
                renderTrackPage();
            } else if (activePage === 'analysis-page') {
                await loadAnalysisData();
            } else if (activePage === 'categories-page') { 
                renderCategoriesPage(); 
            }
        } else {
            userId = null;
            signInBtn.style.display = 'block';
            signOutBtn.style.display = 'none';
            userInfo.style.display = 'none';
            userEmail.textContent = '';
            clearAllUserData();
        }
    });
}

function signInWithGoogle() {
    auth.signInWithPopup(googleProvider)
        .catch((error) => {
            console.error("Google Sign-In Error:", error);
            console.error("Failed to sign in. Please try again.");
        });
}

function signOut() {
    auth.signOut().catch((error) => {
        console.error("Sign-Out Error:", error);
    });
}

// MODIFIED: Clear All User Data
function clearAllUserData() {
    if (currentTimer) stopTimer(); 
    categories.clear(); 
    activities.clear();
    plannerItems.clear(); 
    allTimeLogs = []; 
    analysisLogs = [];
    
    // Reset state
    currentTrackView = 'list';
    if (typeof updateTimeRange === 'function') updateTimeRange('today');
    currentTrackFilters = { types: ['goal', 'task', 'deadline'], activities: ['NONE'], categories: [], status: 'all' }; // Reset filters
    currentCategoriesFilters = { types: ['goal'], activities: ['NONE'], categories: [] };
    trackSearchQuery = '';
    trackSearchBox.value = '';

    trackContentArea.innerHTML = `<p class="text-center text-muted p-4">Please sign in to track your time.</p>`;
    rankingList.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`;
    if (barChartInstance) barChartInstance.destroy();
    if (pieChartInstance) pieChartInstance.destroy();
    
    const barCtx = barChartCanvas.getContext('2d');
    const pieCtx = pieChartCanvas.getContext('2d');
    barCtx.clearRect(0, 0, barChartCanvas.width, barChartCanvas.height);
    pieCtx.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);
    heatmapGrid.innerHTML = '';
    
    renderHomePage(); 
    categoriesListContainer.innerHTML = `<p class="text-center text-muted">Please sign in.</p>`; 
    if (typeof categoriesDonutChart !== 'undefined' && categoriesDonutChart) categoriesDonutChart.destroy(); 
    categoriesChartContainer.innerHTML = ''; 
}

function checkTimerRecovery() {
    const savedTimerJSON = localStorage.getItem('activeTimer');
    if (savedTimerJSON) {
        const savedTimer = JSON.parse(savedTimerJSON);
        
        if (savedTimer.userId !== userId) {
            localStorage.removeItem('activeTimer');
            return;
        }

        currentTimer = { ...savedTimer, intervalId: null };
        
        const elapsedMs = Date.now() - currentTimer.startTime;
        const timeString = formatHHMMSS(elapsedMs);
        setFlipClock(timeString); 
        previousTimeString = timeString; 

        currentTimer.intervalId = setInterval(updateTimerUI, 1000); 
        
        timerBanner.classList.remove('hidden', 'closing', 'morphing-out'); 
        requestAnimationFrame(() => { 
            timerBanner.classList.add('active');
        });
        
        bannerActivityName.textContent = currentTimer.activityName;
        updateTimerUI(); 
        
        // Re-render relevant pages
        renderHomePage(); 
        if (pages.track.classList.contains('active')) {
            renderTrackPage();
        }
    }
}

// MODIFIED: Show Page
function showPage(pageName) {
    Object.values(pages).forEach(p => p.classList.remove('active'));
    navButtons.forEach(btn => {
         const isActive = btn.dataset.page === pageName;
         btn.classList.toggle('active-nav', isActive); 
    });

    if (pages[pageName]) {
         pages[pageName].classList.add('active');
         
         // MODIFICATION: Show/hide universal add button
         if (pageName === 'categories' || pageName === 'track') {
            universalAddBtn.style.display = 'flex';
         } else {
            universalAddBtn.style.display = 'none';
         }

         // Load data or render page
         if (pageName === 'home') {
            renderHomePage(); 
         }
         if (pageName === 'track') {
            renderTrackPage();
         }
         if (pageName === 'categories') { 
            renderCategoriesPage(); 
         }
         if (pageName === 'analysis') {
            if (analysisLogs.length === 0) { 
                 setDefaultAnalysisDate(); 
                 setAnalysisView('daily'); 
            }
         }
    } else {
        console.error("Tried to navigate to non-existent page:", pageName);
    }
}

// NEW V24 Function: Load Categories
async function loadCategories() {
    if (!userId) return;
    try {
        const snapshot = await categoriesCollection().orderBy('name', 'asc').get(); 
        categories.clear();
        snapshot.forEach(doc => {
             const data = { ...doc.data(), id: doc.id };
             categories.set(doc.id, data);
         });
    } catch (error) { 
         console.error("Error loading categories: ", error);
    }
}

async function loadActivities() {
    if (!userId) return;
    try {
        const snapshot = await activitiesCollection().orderBy('name', 'asc').get(); 
        activities.clear();
        snapshot.forEach(doc => {
             const data = { ...doc.data(), id: doc.id };
             activities.set(doc.id, data);
         });
         
         populateAnalysisFilter(); 
         populateCategoryDatalist();
    } catch (error) { 
         console.error("Error loading activities: ", error);
    }
}

// NEW: Load All Time Logs (for Track Page cache)
async function loadAllTimeLogs() {
    if (!userId) return;
    try {
        const snapshot = await timeLogsCollection().orderBy('startTime', 'desc').get();
        allTimeLogs = [];
        snapshot.forEach(doc => {
            allTimeLogs.push({ ...doc.data(), id: doc.id });
        });
    } catch (error) {
        console.error("Error loading all time logs: ", error);
    }
}

// MODIFIED: Load Planner Items
async function loadPlannerItems() {
    if (!userId) return;
    try {
        const snapshot = await plannerCollection().orderBy('dueDate', 'asc').get();
        plannerItems.clear();
        snapshot.forEach(doc => {
            plannerItems.set(doc.id, { ...doc.data(), id: doc.id });
        });
        
        // Re-render pages that depend on this data
        if (pages.home.classList.contains('active')) {
            renderHomePage();
        }
        if (pages.track.classList.contains('active')) {
            renderTrackPage();
        }
    } catch (error) {
        console.error("Error loading planner items: ", error);
    }
}

// Populate Category Datalist (Now for Activities)
function populateCategoryDatalist() {
    categoryDatalist.innerHTML = '';
    // This will now be populated by the new Category objects
    categories.forEach(c => {
        categoryDatalist.innerHTML += `<option value="${c.id}">${c.name}</option>`;
    });
}

function populateAnalysisFilter() {
    while (analysisActivityFilter.options.length > 1) {
        analysisActivityFilter.remove(1);
    }
    const sortedActivities = Array.from(activities.values()).sort((a, b) => a.name.localeCompare(b.name));
    sortedActivities.forEach(activity => {
         analysisActivityFilter.innerHTML += `<option value="${activity.id}">${activity.name}</option>`;
    });
    const lastFilter = localStorage.getItem('lastAnalysisFilter');
    if (lastFilter) {
        analysisActivityFilter.value = lastFilter;
    }
}

// REMOVED: All old Emoji Picker functions
// (EMOJI_CATEGORIES, populateEmojiPicker, loadEmojiCategory, handleEmojiCategorySelect, showEmojiPicker, hideEmojiPicker, handleEmojiSelect)

// --- NEW V24: Icon Picker Functions ---
const ALL_BOOTSTRAP_ICONS = [ // A subset for performance
    'bi-alarm-fill', 'bi-archive-fill', 'bi-aspect-ratio-fill', 'bi-award-fill', 'bi-bank', 'bi-bar-chart-fill',
    'bi-basket-fill', 'bi-bell-fill', 'bi-book-fill', 'bi-bookmark-fill', 'bi-briefcase-fill', 'bi-broadcast',
    'bi-bug-fill', 'bi-building', 'bi-bullseye', 'bi-calculator-fill', 'bi-calendar-check-fill', 'bi-calendar-event-fill',
    'bi-camera-fill', 'bi-camera-video-fill', 'bi-capsule', 'bi-card-checklist', 'bi-cart-fill', 'bi-cash-coin',
    'bi-chat-dots-fill', 'bi-check-circle-fill', 'bi-clipboard-data-fill', 'bi-clock-fill', 'bi-cloud-fill',
    'bi-code-slash', 'bi-coin', 'bi-collection-play-fill', 'bi-compass-fill', 'bi-controller', 'bi-credit-card-fill',
    'bi-cup-fill', 'bi-diagram-3-fill', 'bi-display-fill', 'bi-dribbble', 'bi-droplet-fill', 'bi-earbuds',
    'bi-egg-fill', 'bi-eject-fill', 'bi-emoji-smile-fill', 'bi-envelope-fill', 'bi-file-earmark-code-fill', 'bi-file-earmark-music-fill',
    'bi-file-earmark-text-fill', 'bi-film', 'bi-filter', 'bi-flag-fill', 'bi-folder-fill', 'bi-fuel-pump-fill',
    'bi-funnel-fill', 'bi-gear-fill', 'bi-gem', 'bi-geo-alt-fill', 'bi-gift-fill', 'bi-github', 'bi-globe',
    'bi-google', 'bi-graph-up', 'bi-grid-fill', 'bi-hammer', 'bi-handbag-fill', 'bi-headphones', 'bi-heart-fill',
    'bi-house-door-fill', 'bi-image-fill', 'bi-inbox-fill', 'bi-joystick', 'bi-key-fill', 'bi-keyboard-fill',
    'bi-laptop-fill', 'bi-layout-text-window-reverse', 'bi-lightbulb-fill', 'bi-lightning-fill', 'bi-list-task',
    'bi-lock-fill', 'bi-magic', 'bi-mailbox', 'bi-map-fill', 'bi-megaphone-fill', 'bi-mic-fill', 'bi-moon-fill',
    'bi-mouse-fill', 'bi-music-note-beamed', 'bi-newspaper', 'bi-palette-fill', 'bi-paperclip', 'bi-pause-fill',
    'bi-pc-display', 'bi-pencil-fill', 'bi-people-fill', 'bi-phone-fill', 'bi-pie-chart-fill', 'bi-piggy-bank-fill',
    'bi-pin-map-fill', 'bi-play-fill', 'bi-plug-fill', 'bi-printer-fill', 'bi-puzzle-fill', 'bi-question-circle-fill',
    'bi-receipt', 'bi-rocket-takeoff-fill', 'bi-save-fill', 'bi-sd-card-fill', 'bi-search', 'bi-shield-shaded',
    'bi-shop', 'bi-skip-forward-fill', 'bi-slack', 'bi-smartwatch', 'bi-snow', 'bi-speaker-fill', 'bi-spotify',
    'bi-star-fill', 'bi-stopwatch-fill', 'bi-sun-fill', 'bi-tablet-fill', 'bi-tag-fill', 'bi-terminal-fill',
    'bi-tools', 'bi-trash-fill', 'bi-translate', 'bi-trophy-fill', 'bi-truck', 'bi-tv-fill', 'bi-twitch',
    'bi-twitter', 'bi-umbrella-fill', 'bi-unlock-fill', 'bi-vinyl-fill', 'bi-wallet-fill', 'bi-water',
    'bi-whatsapp', 'bi-wifi', 'bi-wind', 'bi-window-fullscreen', 'bi-wordpress', 'bi-wrench-adjustable',
    'bi-youtube', 'bi-zoom-in'
];

function populateIconPicker() {
    const query = iconSearchInput.value.toLowerCase();
    iconPickerGrid.innerHTML = '';
    let html = '';
    for (const iconName of ALL_BOOTSTRAP_ICONS) {
        if (query === '' || iconName.includes(query)) {
            html += `<button class="icon-picker-btn" data-icon="${iconName}" title="${iconName}"><i class="bi ${iconName} pointer-events-none"></i></button>`;
        }
    }
    iconPickerGrid.innerHTML = html;
}

function showIconPicker(buttonTarget, valueTarget, previewTarget) {
    currentIconInputTarget = { button: buttonTarget, value: valueTarget, preview: previewTarget };
    iconSearchInput.value = '';
    populateIconPicker();
    iconPickerModal.classList.add('active');
}

function hideIconPicker() {
    iconPickerModal.classList.remove('active');
    currentIconInputTarget = null;
}

function handleIconSelect(e) {
    const btn = e.target.closest('.icon-picker-btn');
    if (btn && currentIconInputTarget) {
        const iconName = btn.dataset.icon;
        
        // This is for Add/Edit Category modal
        if (currentIconInputTarget.preview) {
             // The CSS will handle setting the icon color to white.
             currentIconInputTarget.preview.className = `bi ${iconName}`;
        }
        
        // This is for Add/Edit Activity (Goal) modal (uses the emoji style button for icons)
        if (currentIconInputTarget.button) {
            currentIconInputTarget.button.innerHTML = `<i class="bi ${iconName}"></i>`;
        }
        
        currentIconInputTarget.value.value = iconName;
        hideIconPicker();
    }
}
// --- END V24 Icon Picker ---

// --- NEW V24 Settings Modal ---
function showSettingsModal() {
    settingsModal.classList.add('active');
}
function hideSettingsModal() {
    settingsModal.classList.remove('active');
}
// --- END V24 Settings Modal ---

// --- NEW V24 Time Range Modal Functions ---
// Moved implementation details to functions above to centralize them

// --- Theme (No Changes) ---
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateTheme(isDark);
}
function loadThemePreference() {
    const preferredTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let isDark = preferredTheme ? (preferredTheme === 'dark') : systemPrefersDark; 
    if (isDark) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
    updateTheme(isDark); 
}
function updateTheme(isDark) {
    updateThemeIcon(isDark);
    updateChartDefaults(isDark);
    if (pages.analysis.classList.contains('active')) {
       loadAnalysisData(); 
    }
    if (pages.categories.classList.contains('active')) { 
       renderCategoriesPage();
    }
}
function updateThemeIcon(isDark) {
     if(!themeIconLightSettings || !themeIconDarkSettings) return; 
     themeIconLightSettings.classList.toggle('hidden', isDark);
     themeIconDarkSettings.classList.toggle('hidden', !isDark);
}
function updateChartDefaults(isDark) {
    const legendColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-grid-color').trim();
    const tooltipBgColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-tooltip-bg').trim();
    const tooltipColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-tooltip-text').trim();
    const chartBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-border-color').trim(); 
    Chart.defaults.color = legendColor;
    Chart.defaults.borderColor = chartBorderColor; 
    Chart.defaults.plugins.legend.labels.color = legendColor; 
    Chart.defaults.plugins.tooltip.backgroundColor = tooltipBgColor;
    Chart.defaults.plugins.tooltip.titleColor = tooltipColor;
    Chart.defaults.plugins.tooltip.bodyColor = tooltipColor;
    Chart.defaults.scale.grid.color = gridColor;
    Chart.defaults.scale.ticks.color = legendColor;
}

// --- Font Size (No Changes) ---
function handleFontSizeChange(e) {
    const scales = ['0.8rem', '0.9rem', '1.0rem', '1.1rem', '1.2rem'];
    const val = e.target.value; // 0-4
    const newSize = scales[val] || '1.0rem';
    document.documentElement.style.fontSize = newSize;
    localStorage.setItem('fontSize', newSize);
}
function loadFontSizePreference() {
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.documentElement.style.fontSize = savedFontSize;
        const scales = ['0.8rem', '0.9rem', '1.0rem', '1.1rem', '1.2rem'];
        const index = scales.indexOf(savedFontSize);
        fontSizeSlider.value = index !== -1 ? index : 2;
    }
}

// --- Formatters (No Changes) ---
function formatHHMMSS(ms) {
     const secs = Math.floor(ms / 1000); const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60); const s = secs % 60;
     return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}
function formatShortDuration(ms) {
     if (ms < 1000) return "0m"; const secs = Math.floor(ms / 1000); const h = Math.floor(secs / 3600); const m = Math.floor((secs % 3600) / 60);
     let parts = []; if (h > 0) parts.push(`${h}h`); if (m > 0) parts.push(`${m}m`);
     if (h === 0 && m === 0) { if (secs > 0) parts.push(`${secs}s`); else return "0m"; } return parts.join(' ');
}

// --- NEW V24 Categories Page Navigation ---
function handleCategoriesListClick(e) {
    const item = e.target.closest('.category-list-item');
    if (item) {
        const id = item.dataset.id;
        if (id && id !== 'uncategorized') {
            showAddCategoryModal(id);
        }
    }
}
