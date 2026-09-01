/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   MAIN APPLICATION JAVASCRIPT

   IMPORTANT:
   - Authentication is handled ONLY by Supabase Auth.
   - URL parameters are NEVER used for login.
   - Dashboard stays hidden until a valid session exists.
   - No passwords are stored in this file.
   ========================================================= */

"use strict";


/* =========================================================
   GLOBAL APPLICATION STATE
========================================================= */

const RS_APP = {

    initialized: false,

    authenticated: false,

    session: null,

    user: null,

    bookings: [],

    contracts: [],

    gallery: [],

    notifications: [],

    currentSection: "dashboard",

    calendarDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
    ),

    selectedDate: null,

    galleryFilter: "all",

    editingBookingId: null,

    editingContractId: null

};


/* =========================================================
   SHORT DOM HELPERS
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function $all(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );

}


/* =========================================================
   SAFE TEXT HELPER
========================================================= */

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);

    return div.innerHTML;

}


/* =========================================================
   DATE HELPERS
========================================================= */

function pad(value) {

    return String(value).padStart(2, "0");

}


function dateToInputValue(date) {

    if (!(date instanceof Date)) {

        return "";

    }

    if (Number.isNaN(date.getTime())) {

        return "";

    }

    return (
        date.getFullYear() +
        "-" +
        pad(date.getMonth() + 1) +
        "-" +
        pad(date.getDate())
    );

}


function parseDate(value) {

    if (!value) {

        return null;

    }

    const date =
        new Date(
            String(value).length === 10
                ? `${value}T00:00:00`
                : value
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    return date;

}


function isSameDate(first, second) {

    if (
        !(first instanceof Date) ||
        !(second instanceof Date)
    ) {

        return false;

    }

    return (
        first.getFullYear() ===
            second.getFullYear() &&

        first.getMonth() ===
            second.getMonth() &&

        first.getDate() ===
            second.getDate()
    );

}


function formatDate(value) {

    const date =
        parseDate(value);

    if (!date) {

        return "—";

    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


function formatTime(value) {

    if (!value) {

        return "—";

    }

    const parts =
        String(value).split(":");

    if (parts.length < 2) {

        return value;

    }

    let hour =
        Number(parts[0]);

    const minute =
        parts[1];

    if (
        Number.isNaN(hour)
    ) {

        return value;

    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;

}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(value) {

    const number =
        Number(value || 0);

    if (
        Number.isNaN(number)
    ) {

        return "₹0";

    }

    return (
        "₹" +
        number.toLocaleString(
            "en-IN"
        )
    );

}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(value) {

    const status =
        String(
            value || "pending"
        )
            .trim()
            .toLowerCase();

    const allowed = [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
    ];

    return allowed.includes(status)
        ? status
        : "pending";

}


function statusLabel(value) {

    const status =
        normalizeStatus(value);

    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );

}


/* =========================================================
   UI MESSAGE
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        $("toast");

    const toastMessage =
        $("toast-message");

    const toastIcon =
        $("toast-icon");

    if (!toast) {

        return;

    }

    if (toastMessage) {

        toastMessage.textContent =
            message;

    }

    if (toastIcon) {

        toastIcon.textContent =
            type === "error"
                ? "!"
                : type === "warning"
                    ? "!"
                    : "✓";

    }

    toast.dataset.type =
        type;

    toast.hidden =
        false;

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(
            () => {

                toast.hidden =
                    true;

            },
            3500
        );

}


function showFormMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {

        return;

    }

    element.textContent =
        message;

    element.dataset.type =
        type;

}


function clearFormMessage(
    element
) {

    if (!element) {

        return;

    }

    element.textContent =
        "";

    element.removeAttribute(
        "data-type"
    );

}


/* =========================================================
   DATABASE ERROR
========================================================= */

function databaseError(error) {

    console.error(
        "Supabase error:",
        error
    );

    const message =
        String(
            error?.message ||
            error ||
            ""
        );

    const lower =
        message.toLowerCase();

    if (
        lower.includes(
            "relation"
        ) &&
        lower.includes(
            "does not exist"
        )
    ) {

        return "The required Supabase table does not exist.";

    }

    if (
        lower.includes(
            "row-level security"
        ) ||
        lower.includes(
            "violates row-level security"
        ) ||
        lower.includes(
            "permission denied"
        )
    ) {

        return "Supabase security policy blocked this operation.";

    }

    if (
        lower.includes(
            "duplicate"
        )
    ) {

        return "This record already exists.";

    }

    if (
        lower.includes(
            "jwt"
        ) ||
        lower.includes(
            "session"
        )
    ) {

        return "Your login session has expired. Please sign in again.";

    }

    return (
        message ||
        "Database operation failed."
    );

}


/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getSupabase() {

    if (
        window.supabaseClient
    ) {

        return window.supabaseClient;

    }

    console.error(
        "window.supabaseClient is missing."
    );

    return null;

}


/* =========================================================
   LOGIN UI
========================================================= */

function showLoginScreen() {

    const loader =
        $("app-loader");

    const login =
        $("login-screen");

    const owner =
        $("owner-app");

    if (owner) {

        owner.hidden =
            true;

    }

    if (login) {

        login.hidden =
            false;

        login.style.display =
            "";

    }

    if (loader) {

        loader.hidden =
            true;

    }


    document.body.classList.remove(
        "authenticated"
    );

}


function hideLoginScreen() {

    const login =
        $("login-screen");

    if (login) {

        login.hidden =
            true;

        login.style.display =
            "none";

    }

}


/* =========================================================
   OWNER UI
========================================================= */

function showOwnerApp() {

    const owner =
        $("owner-app");

    if (!owner) {

        console.error(
            "#owner-app not found."
        );

        return;

    }

    hideLoginScreen();

    owner.hidden =
        false;

    owner.style.display =
        "";

    document.body.classList.add(
        "authenticated"
    );

}


/* =========================================================
   LOGIN BUTTON STATE
========================================================= */

function setLoginLoading(
    loading
) {

    const button =
        $("login-submit");

    const text =
        $("login-submit-text");

    const spinner =
        $("login-submit-spinner");

    if (button) {

        button.disabled =
            loading;

    }

    if (text) {

        text.textContent =
            loading
                ? "Signing in..."
                : "Sign in";

    }

    if (spinner) {

        spinner.hidden =
            !loading;

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();

    const supabase =
        getSupabase();

    if (!supabase) {

        showLoginMessage(
            "Supabase is not configured correctly.",
            "error"
        );

        return;

    }


    const emailInput =
        $("login-email");

    const passwordInput =
        $("login-password");

    const emailError =
        $("login-email-error");

    const passwordError =
        $("login-password-error");


    if (emailError) {

        emailError.textContent =
            "";

    }

    if (passwordError) {

        passwordError.textContent =
            "";

    }


    const email =
        emailInput?.value
            ?.trim() ||
        "";

    const password =
        passwordInput?.value ||
        "";


    let valid =
        true;


    if (!email) {

        if (emailError) {

            emailError.textContent =
                "Enter your email address.";

        }

        valid =
            false;

    }


    if (!password) {

        if (passwordError) {

            passwordError.textContent =
                "Enter your password.";

        }

        valid =
            false;

    }


    if (!valid) {

        return;

    }


    setLoginLoading(
        true
    );

    showLoginMessage(
        "",
        ""
    );


    try {

        const {
            data,
            error
        } =
            await supabase.auth.signInWithPassword(
                {
                    email,
                    password
                }
            );


        if (error) {

            throw error;

        }


        if (!data?.session) {

            throw new Error(
                "Login succeeded but no session was returned."
            );

        }


        RS_APP.session =
            data.session;

        RS_APP.user =
            data.user;

        RS_APP.authenticated =
            true;


        /*
         * Remove any old query parameters.
         *
         * This also prevents email/password values
         * from remaining in the browser URL.
         */

        cleanAuthenticationUrl();


        await enterDashboard();


    } catch (error) {

        console.error(
            "Login failed:",
            error
        );

        RS_APP.authenticated =
            false;

        showLoginMessage(
            friendlyAuthError(error),
            "error"
        );

    } finally {

        setLoginLoading(
            false
        );

    }

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = "error"
) {

    const element =
        $("login-message");

    if (!element) {

        return;

    }

    element.textContent =
        message;

    element.dataset.type =
        type;

}


/* =========================================================
   AUTH ERROR
========================================================= */

function friendlyAuthError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        );

    const lower =
        message.toLowerCase();

    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }

    if (
        lower.includes(
            "email not confirmed"
        )
    ) {

        return "Your email address has not been confirmed.";

    }

    if (
        lower.includes(
            "too many requests"
        )
    ) {

        return "Too many login attempts. Please wait and try again.";

    }

    return (
        message ||
        "Unable to sign in."
    );

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function setupPasswordToggle() {

    const button =
        $("toggle-password");

    const input =
        $("login-password");

    if (
        !button ||
        !input
    ) {

        return;

    }

    button.addEventListener(
        "click",
        () => {

            const showing =
                input.type ===
                "text";

            input.type =
                showing
                    ? "password"
                    : "text";

            button.textContent =
                showing
                    ? "Show"
                    : "Hide";

            button.setAttribute(
                "aria-label",
                showing
                    ? "Show password"
                    : "Hide password"
            );

            button.setAttribute(
                "aria-pressed",
                String(!showing)
            );

        }
    );

}


/* =========================================================
   AUTH LISTENER
========================================================= */

function setupAuthListener() {

    const supabase =
        getSupabase();

    if (!supabase) {

        return;

    }

    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Auth event:",
                event
            );


            if (session) {

                RS_APP.session =
                    session;

                RS_APP.user =
                    session.user;

                RS_APP.authenticated =
                    true;

                showOwnerApp();

                updateUserUI();

                /*
                 * Do not reload everything on every
                 * TOKEN_REFRESHED event.
                 */

                if (
                    event ===
                        "SIGNED_IN" ||
                    event ===
                        "INITIAL_SESSION"
                ) {

                    await loadApplicationData();

                }

                return;

            }


            /*
             * No valid session.
             */

            RS_APP.session =
                null;

            RS_APP.user =
                null;

            RS_APP.authenticated =
                false;

            showLoginScreen();

            clearApplicationData();

        }
    );

}


/* =========================================================
   CURRENT SESSION
========================================================= */

async function getCurrentSession() {

    const supabase =
        getSupabase();

    if (!supabase) {

        return null;

    }

    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (error) {

        throw error;

    }

    return data?.session ||
        null;

}


/* =========================================================
   ENTER DASHBOARD
========================================================= */

async function enterDashboard() {

    if (
        !RS_APP.session
    ) {

        showLoginScreen();

        return;

    }


    showOwnerApp();

    updateUserUI();

    updateCurrentDate();

    await loadApplicationData();

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

    const supabase =
        getSupabase();

    if (!supabase) {

        return;

    }


    try {

        const {
            error
        } =
            await supabase.auth.signOut();


        if (error) {

            throw error;

        }


        RS_APP.authenticated =
            false;

        RS_APP.session =
            null;

        RS_APP.user =
            null;

        clearApplicationData();

        showLoginScreen();

        showLoginMessage(
            "You have been signed out.",
            "success"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showToast(
            databaseError(error),
            "error"
        );

    }

}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

    const buttons =
        [
            $("sidebar-logout")
        ];

    buttons.forEach(
        button => {

            if (!button) {

                return;

            }

            button.addEventListener(
                "click",
                logout
            );

        }
    );

}


/* =========================================================
   REMOVE LOGIN QUERY PARAMETERS
========================================================= */

function cleanAuthenticationUrl() {

    try {

        const url =
            new URL(
                window.location.href
            );

        /*
         * Completely remove query parameters.
         *
         * The application never reads login credentials
         * from the URL.
         */

        if (
            url.search ||
            url.hash
        ) {

            window.history.replaceState(
                {},
                document.title,
                url.pathname
            );

        }

    } catch (error) {

        console.warn(
            "Could not clean URL:",
            error
        );

    }

}


/* =========================================================
   USER UI
========================================================= */

function updateUserUI() {

    const user =
        RS_APP.user;

    if (!user) {

        return;

    }

    const email =
        user.email ||
        "—";

    const displayName =
        user.user_metadata
            ?.display_name ||
        user.user_metadata
            ?.full_name ||
        email.split("@")[0] ||
        "Owner";


    const elements = {

        sidebarName:
            $("sidebar-user-name"),

        sidebarEmail:
            $("sidebar-user-email"),

        sidebarAvatar:
            $("sidebar-avatar"),

        headerName:
            $("header-user-name"),

        headerAvatar:
            $("header-avatar"),

        settingsName:
            $("settings-name"),

        settingsEmail:
            $("settings-email")

    };


    if (elements.sidebarName) {

        elements.sidebarName.textContent =
            displayName;

    }

    if (elements.sidebarEmail) {

        elements.sidebarEmail.textContent =
            email;

    }

    if (elements.headerName) {

        elements.headerName.textContent =
            displayName;

    }

    const initial =
        displayName
            .charAt(0)
            .toUpperCase() ||
        "O";


    if (elements.sidebarAvatar) {

        elements.sidebarAvatar.textContent =
            initial;

    }

    if (elements.headerAvatar) {

        elements.headerAvatar.textContent =
            initial;

    }

    if (elements.settingsName) {

        if (
            !elements.settingsName.value
        ) {

            elements.settingsName.value =
                displayName;

        }

    }

    if (elements.settingsEmail) {

        elements.settingsEmail.value =
            email;

    }

}


/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

    const element =
        $("current-date");

    if (!element) {

        return;

    }

    const today =
        new Date();

    element.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    const year =
        $("login-year");

    if (year) {

        year.textContent =
            today.getFullYear();

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupSidebar() {

    $all(
        ".nav-item[data-section]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const section =
                            button.dataset.section;

                        navigateTo(
                            section
                        );

                    }
                );

            }
        );


    $all(
        "[data-section-link]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const section =
                            button.dataset.sectionLink;

                        navigateTo(
                            section
                        );

                    }
                );

            }
        );


    $all(
        "[data-action='new-booking']"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    openBookingModal
                );

            }
        );


    const mobileButton =
        $("mobile-menu-button");

    const overlay =
        $("sidebar-overlay");


    if (mobileButton) {

        mobileButton.addEventListener(
            "click",
            toggleMobileSidebar
        );

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeMobileSidebar
        );

    }

}


function navigateTo(
    section
) {

    const allowed = [
        "dashboard",
        "bookings",
        "calendar",
        "contracts",
        "gallery",
        "notifications",
        "settings"
    ];


    if (
        !allowed.includes(section)
    ) {

        return;

    }


    if (
        !RS_APP.authenticated
    ) {

        showLoginScreen();

        return;

    }


    RS_APP.currentSection =
        section;


    $all(
        ".nav-item[data-section]"
    )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                        section
                );

            }
        );


    $all(
        "[data-section-panel]"
    )
        .forEach(
            panel => {

                const active =
                    panel.dataset.sectionPanel ===
                    section;

                panel.hidden =
                    !active;

                panel.classList.toggle(
                    "active",
                    active
                );

            }
        );


    const titles = {

        dashboard: "Dashboard",

        bookings: "Bookings",

        calendar: "Calendar",

        contracts: "Contracts",

        gallery: "Gallery",

        notifications: "Notifications",

        settings: "Studio Settings"

    };


    const title =
        $("header-title");

    if (title) {

        title.textContent =
            titles[section] ||
            "Dashboard";

    }


    closeMobileSidebar();


    /*
     * Refresh section-specific content.
     */

    if (
        section ===
        "dashboard"
    ) {

        renderDashboard();

    }

    if (
        section ===
        "bookings"
    ) {

        renderBookings();

    }

    if (
        section ===
        "calendar"
    ) {

        renderCalendar();

    }

    if (
        section ===
        "contracts"
    ) {

        renderContracts();

    }

    if (
        section ===
        "gallery"
    ) {

        renderGallery();

    }

    if (
        section ===
        "notifications"
    ) {

        renderNotifications();

    }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function toggleMobileSidebar() {

    document.body.classList.toggle(
        "sidebar-open"
    );

    const button =
        $("mobile-menu-button");

    const overlay =
        $("sidebar-overlay");

    const open =
        document.body.classList.contains(
            "sidebar-open"
        );

    if (button) {

        button.setAttribute(
            "aria-expanded",
            String(open)
        );

    }

    if (overlay) {

        overlay.setAttribute(
            "aria-hidden",
            String(!open)
        );

    }

}


function closeMobileSidebar() {

    document.body.classList.remove(
        "sidebar-open"
    );

    const button =
        $("mobile-menu-button");

    if (button) {

        button.setAttribute(
            "aria-expanded",
            "false"
        );

    }

}


/* =========================================================
   APPLICATION DATA
========================================================= */

async function loadApplicationData() {

    if (
        !RS_APP.authenticated
    ) {

        return;

    }


    await Promise.allSettled(
        [
            loadBookings(),
            loadContracts(),
            loadGallery(),
            loadNotifications()
        ]
    );


    renderDashboard();

    renderBookings();

    renderCalendar();

    renderContracts();

    renderGallery();

    renderNotifications();

}


/* =========================================================
   CLEAR STATE
========================================================= */

function clearApplicationData() {

    RS_APP.bookings =
        [];

    RS_APP.contracts =
        [];

    RS_APP.gallery =
        [];

    RS_APP.notifications =
        [];

    renderDashboard();

    renderBookings();

    renderCalendar();

    renderContracts();

    renderGallery();

    renderNotifications();

}


/* =========================================================
   BOOKINGS
========================================================= */

async function loadBookings() {

    const supabase =
        getSupabase();

    if (
        !supabase ||
        !RS_APP.authenticated
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("orders")
                .select("*")
                .order(
                    "booking_date",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        RS_APP.bookings =
            Array.isArray(data)
                ? data
                : [];


    } catch (error) {

        console.error(
            "Could not load bookings:",
            error
        );

        RS_APP.bookings =
            [];

        showToast(
            databaseError(error),
            "error"
        );

    }

}


/* =========================================================
   BOOKING FILTERS
========================================================= */

function setupOrderFilters() {

    const search =
        $("booking-search");

    const status =
        $("booking-status-filter");

    const refresh =
        $("refresh-bookings");


    if (search) {

        search.addEventListener(
            "input",
            renderBookings
        );

    }


    if (status) {

        status.addEventListener(
            "change",
            renderBookings
        );

    }


    if (refresh) {

        refresh.addEventListener(
            "click",
            async () => {

                refresh.disabled =
                    true;

                await loadBookings();

                renderDashboard();

                renderBookings();

                renderCalendar();

                refresh.disabled =
                    false;

                showToast(
                    "Bookings refreshed."
                );

            }
        );

    }

}


/* =========================================================
   FILTERED BOOKINGS
========================================================= */

function getFilteredBookings() {

    const search =
        (
            $("booking-search")
                ?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const status =
        $("booking-status-filter")
            ?.value ||
        "all";


    return RS_APP.bookings.filter(
        booking => {

            const text =
                [
                    booking.customer_name,
                    booking.phone,
                    booking.location,
                    booking.function_type,
                    booking.notes
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


            const matchesSearch =
                !search ||
                text.includes(
                    search
                );


            const matchesStatus =
                status === "all" ||
                normalizeStatus(
                    booking.status
                ) === status;


            return (
                matchesSearch &&
                matchesStatus
            );

        }
    );

}


/* =========================================================
   RENDER BOOKINGS
========================================================= */

function renderBookings() {

    const container =
        $("bookings-table-container");

    if (!container) {

        return;

    }


    const bookings =
        getFilteredBookings();


    if (!bookings.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▣</div>
                <h3>No bookings found</h3>
                <p>Customer booking records will appear here.</p>
            </div>
        `;

        return;

    }


    const rows =
        bookings
            .map(
                booking => {

                    const id =
                        booking.id;

                    return `
                        <div class="booking-row">

                            <div>
                                <strong>
                                    ${escapeHTML(
                                        booking.customer_name ||
                                        "Unnamed customer"
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        booking.phone ||
                                        ""
                                    )}
                                </small>
                            </div>

                            <div>
                                ${escapeHTML(
                                    booking.function_type ||
                                    "—"
                                )}
                            </div>

                            <div>
                                ${formatDate(
                                    booking.booking_date
                                )}
                            </div>

                            <div>
                                ${formatTime(
                                    booking.booking_time
                                )}
                            </div>

                            <div>
                                ${escapeHTML(
                                    booking.location ||
                                    "—"
                                )}
                            </div>

                            <div>
                                ${formatMoney(
                                    booking.expected_money
                                )}
                            </div>

                            <div>
                                <span class="status-badge ${normalizeStatus(
                                    booking.status
                                )}">
                                    ${statusLabel(
                                        booking.status
                                    )}
                                </span>
                            </div>

                            <div class="booking-actions">

                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-booking-edit="${escapeHTML(
                                        id
                                    )}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="secondary-button"
                                    data-booking-delete="${escapeHTML(
                                        id
                                    )}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>
                    `;

                }
            )
            .join("");


    container.innerHTML = `
        <div class="booking-table">

            <div class="booking-table-header">

                <div>Customer</div>
                <div>Function</div>
                <div>Date</div>
                <div>Time</div>
                <div>Location</div>
                <div>Budget</div>
                <div>Status</div>
                <div>Actions</div>

            </div>

            ${rows}

        </div>
    `;


    container
        .querySelectorAll(
            "[data-booking-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const booking =
                            RS_APP.bookings.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        button.dataset.bookingEdit
                                    )
                            );

                        if (booking) {

                            openBookingModal(
                                booking
                            );

                        }

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-booking-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteBooking(
                            button.dataset.bookingDelete
                        );

                    }
                );

            }
        );

}


/* =========================================================
   BOOKING MODAL
========================================================= */

function setupNewOrderButton() {

    const button =
        $("new-booking-button");

    if (button) {

        button.addEventListener(
            "click",
            () => openBookingModal()
        );

    }

}


function openBookingModal(
    booking = null
) {

    if (
        !RS_APP.authenticated
    ) {

        showLoginScreen();

        return;

    }


    const modal =
        $("booking-modal");

    const form =
        $("booking-form");

    const title =
        $("booking-modal-title");

    if (
        !modal ||
        !form
    ) {

        return;

    }


    RS_APP.editingBookingId =
        booking?.id ||
        null;


    form.reset();


    if (title) {

        title.textContent =
            booking
                ? "Edit Booking"
                : "New Booking";

    }


    if (booking) {

        setValue(
            "booking-customer-name",
            booking.customer_name
        );

        setValue(
            "booking-phone",
            booking.phone
        );

        setValue(
            "booking-location",
            booking.location
        );

        setValue(
            "booking-date",
            booking.booking_date
        );

        setValue(
            "booking-time",
            booking.booking_time
        );

        setValue(
            "booking-function",
            booking.function_type
        );

        setValue(
            "booking-budget",
            booking.expected_money
        );

        setValue(
            "booking-status",
            normalizeStatus(
                booking.status
            )
        );

        setValue(
            "booking-notes",
            booking.notes
        );

    } else {

        setValue(
            "booking-date",
            dateToInputValue(
                new Date()
            )
        );

        setValue(
            "booking-status",
            "pending"
        );

    }


    clearFormMessage(
        $("booking-form-message")
    );


    modal.hidden =
        false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    setTimeout(
        () => {

            $("booking-customer-name")
                ?.focus();

        },
        50
    );

}


function closeBookingModal() {

    const modal =
        $("booking-modal");

    if (!modal) {

        return;

    }

    modal.hidden =
        true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    RS_APP.editingBookingId =
        null;

}


/* =========================================================
   BOOKING FORM
========================================================= */

function setupOrderForm() {

    const form =
        $("booking-form");

    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        saveBooking
    );


    $("close-booking-modal")
        ?.addEventListener(
            "click",
            closeBookingModal
        );


    $("cancel-booking")
        ?.addEventListener(
            "click",
            closeBookingModal
        );


    $("booking-modal")
        ?.querySelector(
            ".modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closeBookingModal
        );

}


async function saveBooking(
    event
) {

    event.preventDefault();


    const supabase =
        getSupabase();

    if (
        !supabase ||
        !RS_APP.authenticated
    ) {

        return;

    }


    const form =
        $("booking-form");

    const message =
        $("booking-form-message");


    const customerName =
        getValue(
            "booking-customer-name"
        ).trim();

    const phone =
        getValue(
            "booking-phone"
        ).trim();

    const location =
        getValue(
            "booking-location"
        ).trim();

    const bookingDate =
        getValue(
            "booking-date"
        );

    const bookingTime =
        getValue(
            "booking-time"
        );

    const functionType =
        getValue(
            "booking-function"
        );

    const expectedMoney =
        getValue(
            "booking-budget"
        );

    const status =
        normalizeStatus(
            getValue(
                "booking-status"
            )
        );

    const notes =
        getValue(
            "booking-notes"
        ).trim();


    if (
        !customerName ||
        !phone ||
        !location ||
        !bookingDate ||
        !bookingTime ||
        !functionType
    ) {

        showFormMessage(
            message,
            "Please complete all required booking fields.",
            "error"
        );

        return;

    }


    const submit =
        form.querySelector(
            "button[type='submit']"
        );

    if (submit) {

        submit.disabled =
            true;

    }


    clearFormMessage(
        message
    );


    const payload = {

        customer_name:
            customerName,

        phone:
            phone,

        location:
            location,

        booking_date:
            bookingDate,

        booking_time:
            bookingTime,

        function_type:
            functionType,

        expected_money:
            expectedMoney
                ? Number(expectedMoney)
                : 0,

        notes:
            notes,

        status:
            status

    };


    try {

        let response;


        if (
            RS_APP.editingBookingId
        ) {

            response =
                await supabase
                    .from("orders")
                    .update(payload)
                    .eq(
                        "id",
                        RS_APP.editingBookingId
                    )
                    .select()
                    .single();

        } else {

            response =
                await supabase
                    .from("orders")
                    .insert(
                        payload
                    )
                    .select()
                    .single();

        }


        if (response.error) {

            throw response.error;

        }


        if (
            response.data
        ) {

            if (
                RS_APP.editingBookingId
            ) {

                RS_APP.bookings =
                    RS_APP.bookings.map(
                        booking =>
                            String(
                                booking.id
                            ) ===
                            String(
                                RS_APP.editingBookingId
                            )
                                ? response.data
                                : booking
                    );

            } else {

                RS_APP.bookings.unshift(
                    response.data
                );

            }

        }


        closeBookingModal();

        renderDashboard();

        renderBookings();

        renderCalendar();


        showToast(
            RS_APP.editingBookingId
                ? "Booking updated."
                : "Booking created."
        );


    } catch (error) {

        console.error(
            "Save booking failed:",
            error
        );

        showFormMessage(
            message,
            databaseError(error),
            "error"
        );

    } finally {

        if (submit) {

            submit.disabled =
                false;

        }

    }

}


/* =========================================================
   DELETE BOOKING
========================================================= */

async function deleteBooking(
    id
) {

    if (
        !id ||
        !RS_APP.authenticated
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            "Delete this booking permanently?"
        );


    if (!confirmed) {

        return;

    }


    const supabase =
        getSupabase();

    if (!supabase) {

        return;

    }


    try {

        const {
            error
        } =
            await supabase
                .from("orders")
                .delete()
                .eq(
                    "id",
                    id
                );


        if (error) {

            throw error;

        }


        RS_APP.bookings =
            RS_APP.bookings.filter(
                booking =>
                    String(
                        booking.id
                    ) !==
                    String(id)
            );


        renderDashboard();

        renderBookings();

        renderCalendar();


        showToast(
            "Booking deleted."
        );


    } catch (error) {

        console.error(
            "Delete booking failed:",
            error
        );

        showToast(
            databaseError(error),
            "error"
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

    const bookings =
        RS_APP.bookings;


    const total =
        bookings.length;


    const pending =
        bookings.filter(
            booking =>
                normalizeStatus(
                    booking.status
                ) ===
                "pending"
        ).length;


    const confirmed =
        bookings.filter(
            booking =>
                normalizeStatus(
                    booking.status
                ) ===
                "confirmed"
        ).length;


    const revenue =
        bookings.reduce(
            (
                totalValue,
                booking
            ) => {

                return (
                    totalValue +
                    (
                        Number(
                            booking.expected_money
                        ) || 0
                    )
                );

            },
            0
        );


    setText(
        "stat-total-bookings",
        total
    );

    setText(
        "stat-pending",
        pending
    );

    setText(
        "stat-confirmed",
        confirmed
    );

    setText(
        "stat-revenue",
        formatMoney(
            revenue
        )
    );


    setText(
        "nav-booking-count",
        total
    );


    renderDashboardRecentBookings();

}


/* =========================================================
   DASHBOARD RECENT BOOKINGS
========================================================= */

function renderDashboardRecentBookings() {

    const container =
        $("dashboard-recent-bookings");

    if (!container) {

        return;

    }


    const bookings =
        [...RS_APP.bookings]
            .sort(
                sortBookingsByDate
            )
            .slice(
                0,
                5
            );


    if (!bookings.length) {

        container.innerHTML = `
            <div class="empty-state compact">
                <h3>No booking activity yet</h3>
                <p>Customer bookings will appear here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        bookings
            .map(
                booking => `
                    <div class="recent-booking">

                        <div>

                            <strong>
                                ${escapeHTML(
                                    booking.customer_name ||
                                    "Customer"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    booking.function_type ||
                                    "Photography"
                                )}
                            </small>

                        </div>

                        <div>

                            <strong>
                                ${formatDate(
                                    booking.booking_date
                                )}
                            </strong>

                            <small>
                                ${formatTime(
                                    booking.booking_time
                                )}
                            </small>

                        </div>

                        <span class="status-badge ${normalizeStatus(
                            booking.status
                        )}">
                            ${statusLabel(
                                booking.status
                            )}
                        </span>

                    </div>
                `
            )
            .join("");

}


/* =========================================================
   BOOKING SORT
========================================================= */

function sortBookingsByDate(
    first,
    second
) {

    const firstDate =
        `${first.booking_date || ""} ${
            first.booking_time || ""
        }`;

    const secondDate =
        `${second.booking_date || ""} ${
            second.booking_time || ""
        }`;

    return (
        firstDate.localeCompare(
            secondDate
        )
    );

}


/* =========================================================
   CALENDAR
========================================================= */

function setupCalendarControls() {

    $("calendar-previous")
        ?.addEventListener(
            "click",
            () => {

                RS_APP.calendarDate =
                    new Date(
                        RS_APP.calendarDate.getFullYear(),
                        RS_APP.calendarDate.getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );


    $("calendar-next")
        ?.addEventListener(
            "click",
            () => {

                RS_APP.calendarDate =
                    new Date(
                        RS_APP.calendarDate.getFullYear(),
                        RS_APP.calendarDate.getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );


    $("calendar-today")
        ?.addEventListener(
            "click",
            () => {

                const today =
                    new Date();

                RS_APP.calendarDate =
                    new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );

                RS_APP.selectedDate =
                    dateToInputValue(
                        today
                    );

                renderCalendar();

            }
        );

}


function renderCalendar() {

    const grid =
        $("calendar-grid");

    const title =
        $("calendar-month-title");

    if (
        !grid ||
        !title
    ) {

        return;

    }


    const year =
        RS_APP.calendarDate
            .getFullYear();

    const month =
        RS_APP.calendarDate
            .getMonth();


    title.textContent =
        RS_APP.calendarDate
            .toLocaleDateString(
                "en-IN",
                {
                    month: "long",
                    year: "numeric"
                }
            );


    const firstDay =
        new Date(
            year,
            month,
            1
        );


    const lastDay =
        new Date(
            year,
            month + 1,
            0
        );


    const start =
        firstDay.getDay();


    const days =
        lastDay.getDate();


    const previousLast =
        new Date(
            year,
            month,
            0
        ).getDate();


    const cells =
        [];


    for (
        let i = start - 1;
        i >= 0;
        i--
    ) {

        cells.push(
            {
                day:
                    previousLast - i,

                outside:
                    true,

                date:
                    new Date(
                        year,
                        month - 1,
                        previousLast - i
                    )
            }
        );

    }


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        cells.push(
            {
                day,

                outside:
                    false,

                date:
                    new Date(
                        year,
                        month,
                        day
                    )
            }
        );

    }


    while (
        cells.length % 7 !== 0
    ) {

        const nextDay =
            cells.length -
            (
                start +
                days
            ) +
            1;

        cells.push(
            {
                day:
                    nextDay,

                outside:
                    true,

                date:
                    new Date(
                        year,
                        month + 1,
                        nextDay
                    )
            }
        );

    }


    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    let html =
        weekdays
            .map(
                day =>
                    `<div class="calendar-weekday">${day}</div>`
            )
            .join("");


    html +=
        cells
            .map(
                cell => {

                    const dateString =
                        dateToInputValue(
                            cell.date
                        );


                    const bookings =
                        RS_APP.bookings.filter(
                            booking =>
                                booking.booking_date ===
                                dateString
                        );


                    const selected =
                        RS_APP.selectedDate ===
                        dateString;


                    const today =
                        isSameDate(
                            cell.date,
                            new Date()
                        );


                    const bookingDots =
                        bookings
                            .slice(
                                0,
                                3
                            )
                            .map(
                                booking =>
                                    `<span class="calendar-dot ${normalizeStatus(
                                        booking.status
                                    )}"></span>`
                            )
                            .join("");


                    return `
                        <button
                            type="button"
                            class="calendar-day
                                ${cell.outside ? "outside" : ""}
                                ${selected ? "selected" : ""}
                                ${today ? "today" : ""}"
                            data-calendar-date="${dateString}"
                        >

                            <span class="calendar-day-number">
                                ${cell.day}
                            </span>

                            <span class="calendar-booking-dots">
                                ${bookingDots}
                            </span>

                        </button>
                    `;

                }
            )
            .join("");


    grid.innerHTML =
        html;


    grid.querySelectorAll(
        "[data-calendar-date]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        RS_APP.selectedDate =
                            button.dataset.calendarDate;

                        renderCalendar();

                        showCalendarSelection();

                    }
                );

            }
        );


    showCalendarSelection();

}


/* =========================================================
   CALENDAR SELECTED DATE
========================================================= */

function showCalendarSelection() {

    /*
     * The current HTML does not require a separate selected
     * date panel. We therefore keep selection visual-only.
     *
     * Clicking a date also opens matching bookings in the
     * browser console for debugging.
     */

    if (
        !RS_APP.selectedDate
    ) {

        return;

    }


    const selected =
        RS_APP.bookings.filter(
            booking =>
                booking.booking_date ===
                RS_APP.selectedDate
        );


    console.log(
        "Selected calendar date:",
        RS_APP.selectedDate,
        selected
    );

}


/* =========================================================
   CONTRACTS
========================================================= */

async function loadContracts() {

    const supabase =
        getSupabase();

    if (
        !supabase ||
        !RS_APP.authenticated
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("contracts")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            /*
             * If contracts table hasn't been created,
             * don't crash the entire application.
             */

            console.warn(
                "Contracts unavailable:",
                error
            );

            RS_APP.contracts =
                [];

            return;

        }


        RS_APP.contracts =
            Array.isArray(data)
                ? data
                : [];


    } catch (error) {

        console.warn(
            "Contracts load error:",
            error
        );

        RS_APP.contracts =
            [];

    }

}


/* =========================================================
   CONTRACT BUTTON
========================================================= */

function setupContractButton() {

    $("new-contract-button")
        ?.addEventListener(
            "click",
            () => openContractModal()
        );


    $("close-contract-modal")
        ?.addEventListener(
            "click",
            closeContractModal
        );


    $("cancel-contract")
        ?.addEventListener(
            "click",
            closeContractModal
        );


    $("contract-modal")
        ?.querySelector(
            ".modal-backdrop"
        )
        ?.addEventListener(
            "click",
            closeContractModal
        );


    $("contract-form")
        ?.addEventListener(
            "submit",
            saveContract
        );

}


function openContractModal(
    contract = null
) {

    const modal =
        $("contract-modal");

    const form =
        $("contract-form");

    const title =
        $("contract-modal-title");


    if (
        !modal ||
        !form
    ) {

        return;

    }


    RS_APP.editingContractId =
        contract?.id ||
        null;


    form.reset();


    if (title) {

        title.textContent =
            contract
                ? "Edit Contract"
                : "New Contract";

    }


    if (contract) {

        setValue(
            "contract-customer",
            contract.customer_name
        );

        setValue(
            "contract-title",
            contract.title
        );

        setValue(
            "contract-notes",
            contract.notes
        );

    }


    clearFormMessage(
        $("contract-form-message")
    );


    modal.hidden =
        false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


function closeContractModal() {

    const modal =
        $("contract-modal");

    if (!modal) {

        return;

    }

    modal.hidden =
        true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    RS_APP.editingContractId =
        null;

}


/* =========================================================
   SAVE CONTRACT
========================================================= */

async function saveContract(
    event
) {

    event.preventDefault();


    const supabase =
        getSupabase();

    if (
        !supabase ||
        !RS_APP.authenticated
    ) {

        return;

    }


    const message =
        $("contract-form-message");


    const customer =
        getValue(
            "contract-customer"
        ).trim();

    const title =
        getValue(
            "contract-title"
        ).trim();

    const notes =
        getValue(
            "contract-notes"
        ).trim();


    if (
        !customer ||
        !title
    ) {

        showFormMessage(
            message,
            "Customer name and contract title are required.",
            "error"
        );

        return;

    }


    const payload = {

        customer_name:
            customer,

        title:
            title,

        notes:
            notes

    };


    const form =
        $("contract-form");

    const submit =
        form?.querySelector(
            "button[type='submit']"
        );


    if (submit) {

        submit.disabled =
            true;

    }


    try {

        let response;


        if (
            RS_APP.editingContractId
        ) {

            response =
                await supabase
                    .from("contracts")
                    .update(payload)
                    .eq(
                        "id",
                        RS_APP.editingContractId
                    )
                    .select()
                    .single();

        } else {

            response =
                await supabase
                    .from("contracts")
                    .insert(
                        payload
                    )
                    .select()
                    .single();

        }


        if (response.error) {

            throw response.error;

        }


        if (
            response.data
        ) {

            if (
                RS_APP.editingContractId
            ) {

                RS_APP.contracts =
                    RS_APP.contracts.map(
                        contract =>
                            String(
                                contract.id
                            ) ===
                            String(
                                RS_APP.editingContractId
                            )
                                ? response.data
                                : contract
                    );

            } else {

                RS_APP.contracts.unshift(
                    response.data
                );

            }

        }


        closeContractModal();

        renderContracts();

        showToast(
            "Contract saved."
        );


    } catch (error) {

        console.error(
            "Save contract failed:",
            error
        );

        showFormMessage(
            message,
            databaseError(error),
            "error"
        );

    } finally {

        if (submit) {

            submit.disabled =
                false;

        }

    }

}


/* =========================================================
   RENDER CONTRACTS
========================================================= */

function renderContracts() {

    const container =
        $("contracts-container");

    if (!container) {

        return;

    }


    if (
        !RS_APP.contracts.length
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▤</div>
                <h3>No contracts yet</h3>
                <p>Contracts will appear here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        RS_APP.contracts
            .map(
                contract => `
                    <article class="contract-card">

                        <h3>
                            ${escapeHTML(
                                contract.title ||
                                "Photography Contract"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                contract.customer_name ||
                                "Customer"
                            )}
                        </p>

                        <small>
                            ${escapeHTML(
                                contract.notes ||
                                ""
                            )}
                        </small>

                        <div class="contract-actions">

                            <button
                                type="button"
                                class="secondary-button"
                                data-contract-edit="${escapeHTML(
                                    contract.id
                                )}"
                            >
                                Edit
                            </button>

                        </div>

                    </article>
                `
            )
            .join("");


    container
        .querySelectorAll(
            "[data-contract-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const contract =
                            RS_APP.contracts.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        button.dataset.contractEdit
                                    )
                            );

                        if (contract) {

                            openContractModal(
                                contract
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   GALLERY
========================================================= */

async function loadGallery() {

    /*
     * Gallery database/storage implementation depends on
     * the Supabase Storage bucket configuration.
     *
     * We intentionally don't make a missing gallery table
     * crash the dashboard.
     */

    RS_APP.gallery =
        [];

    renderGallery();

}


function setupGalleryButton() {

    const button =
        $("gallery-upload-button");

    if (button) {

        button.addEventListener(
            "click",
            () => {

                showToast(
                    "Gallery upload will be connected to Supabase Storage.",
                    "warning"
                );

            }
        );

    }


    $all(
        "[data-gallery-filter]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        RS_APP.galleryFilter =
                            button.dataset.galleryFilter ||
                            "all";


                        $all(
                            "[data-gallery-filter]"
                        )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );

                                }
                            );


                        renderGallery();

                    }
                );

            }
        );

}


function renderGallery() {

    const container =
        $("gallery-grid");

    if (!container) {

        return;

    }


    const filter =
        RS_APP.galleryFilter;


    const media =
        RS_APP.gallery.filter(
            item =>
                filter === "all" ||
                item.type === filter
        );


    if (!media.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">▧</div>
                <h3>Gallery is empty</h3>
                <p>Your studio media will appear here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        media
            .map(
                item => {

                    if (
                        item.type ===
                        "video"
                    ) {

                        return `
                            <article class="gallery-card">
                                <video
                                    src="${escapeHTML(
                                        item.url
                                    )}"
                                    controls
                                    preload="metadata"
                                ></video>
                            </article>
                        `;

                    }


                    return `
                        <article class="gallery-card">
                            <img
                                src="${escapeHTML(
                                    item.url
                                )}"
                                alt="${escapeHTML(
                                    item.name ||
                                    "RS Photography"
                                )}"
                                loading="lazy"
                            >
                        </article>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    /*
     * Notifications are derived from booking activity.
     * This avoids requiring another table just to start
     * the dashboard.
     */

    RS_APP.notifications =
        RS_APP.bookings
            .slice(
                0,
                10
            )
            .map(
                booking => ({

                    id:
                        `booking-${booking.id}`,

                    title:
                        "Booking activity",

                    message:
                        `${booking.customer_name || "Customer"} has a ${normalizeStatus(
                            booking.status
                        )} booking.`,

                    created_at:
                        booking.created_at ||
                        booking.booking_date,

                    read:
                        false

                })
            );

}


function setupNotifications() {

    $("header-notification-button")
        ?.addEventListener(
            "click",
            () => {

                navigateTo(
                    "notifications"
                );

            }
        );


    $("mark-all-read")
        ?.addEventListener(
            "click",
            () => {

                RS_APP.notifications =
                    RS_APP.notifications.map(
                        notification => ({

                            ...notification,

                            read:
                                true

                        })
                    );

                renderNotifications();

                showToast(
                    "All notifications marked as read."
                );

            }
        );

}


function renderNotifications() {

    const container =
        $("notifications-list");

    if (!container) {

        return;

    }


    const unread =
        RS_APP.notifications.filter(
            item =>
                !item.read
        ).length;


    setText(
        "nav-notification-count",
        unread
    );


    const badge =
        $("header-notification-badge");


    if (badge) {

        badge.textContent =
            unread;

        badge.hidden =
            unread === 0;

    }


    if (
        !RS_APP.notifications.length
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">♢</div>
                <h3>You're all caught up</h3>
                <p>New notifications will appear here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        RS_APP.notifications
            .map(
                notification => `
                    <article
                        class="notification-item ${
                            notification.read
                                ? "read"
                                : "unread"
                        }"
                    >

                        <div>

                            <strong>
                                ${escapeHTML(
                                    notification.title
                                )}
                            </strong>

                            <p>
                                ${escapeHTML(
                                    notification.message
                                )}
                            </p>

                        </div>

                        <small>
                            ${formatDate(
                                notification.created_at
                            )}
                        </small>

                    </article>
                `
            )
            .join("");

}


/* =========================================================
   SETTINGS
========================================================= */

function setupStudioSettings() {

    $("profile-settings-form")
        ?.addEventListener(
            "submit",
            saveProfileSettings
        );


    $("studio-settings-form")
        ?.addEventListener(
            "submit",
            saveStudioSettings
        );

}


async function saveProfileSettings(
    event
) {

    event.preventDefault();


    const supabase =
        getSupabase();

    if (
        !supabase ||
        !RS_APP.user
    ) {

        return;

    }


    const name =
        getValue(
            "settings-name"
        ).trim();


    if (!name) {

        showToast(
            "Enter a display name.",
            "error"
        );

        return;

    }


    try {

        const {
            data,
            error
        } =
            await supabase.auth.updateUser(
                {
                    data: {

                        display_name:
                            name,

                        full_name:
                            name

                    }

                }
            );


        if (error) {

            throw error;

        }


        RS_APP.user =
            data.user;

        updateUserUI();

        showToast(
            "Profile saved."
        );


    } catch (error) {

        console.error(
            "Profile update failed:",
            error
        );

        showToast(
            databaseError(error),
            "error"
        );

    }

}


async function saveStudioSettings(
    event
) {

    event.preventDefault();


    const studioName =
        getValue(
            "studio-name"
        ).trim();

    const phone =
        getValue(
            "studio-phone"
        ).trim();

    const location =
        getValue(
            "studio-location"
        ).trim();


    /*
     * For the first stable version, keep studio configuration
     * locally because the HTML does not define a dedicated
     * settings database table.
     */

    try {

        localStorage.setItem(
            "rs_studio_settings",
            JSON.stringify(
                {
                    name:
                        studioName,

                    phone:
                        phone,

                    location:
                        location
                }
            )
        );


        showToast(
            "Studio settings saved on this device."
        );


    } catch (error) {

        console.error(
            "Settings save failed:",
            error
        );

        showToast(
            "Could not save studio settings.",
            "error"
        );

    }

}


/* =========================================================
   LOAD LOCAL STUDIO SETTINGS
========================================================= */

function loadLocalStudioSettings() {

    try {

        const raw =
            localStorage.getItem(
                "rs_studio_settings"
            );

        if (!raw) {

            return;

        }


        const settings =
            JSON.parse(raw);


        setValue(
            "studio-name",
            settings.name ||
                "RS Photography"
        );

        setValue(
            "studio-phone",
            settings.phone ||
                ""
        );

        setValue(
            "studio-location",
            settings.location ||
                ""
        );


    } catch (error) {

        console.warn(
            "Could not load local studio settings:",
            error
        );

    }

}


/* =========================================================
   MODAL ESCAPE KEY
========================================================= */

function setupModalControls() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            closeBookingModal();

            closeContractModal();

            closeMobileSidebar();

        }
    );

}


/* =========================================================
   GLOBAL PROTECTION
========================================================= */

function setupGlobalProtection() {

    /*
     * If an unauthenticated user somehow tries to manipulate
     * the DOM and show owner-app manually, immediately hide it.
     *
     * This is UI protection only.
     *
     * Real security still comes from Supabase Auth + RLS.
     */

    setInterval(
        () => {

            if (
                !RS_APP.authenticated
            ) {

                const owner =
                    $("owner-app");

                if (owner) {

                    owner.hidden =
                        true;

                }

            }

        },
        1000
    );

}


/* =========================================================
   GENERIC INPUT HELPERS
========================================================= */

function getValue(id) {

    const element =
        $(id);

    return element
        ? element.value
        : "";

}


function setValue(
    id,
    value
) {

    const element =
        $(id);

    if (!element) {

        return;

    }

    element.value =
        value === null ||
        value === undefined
            ? ""
            : value;

}


function setText(
    id,
    value
) {

    const element =
        $(id);

    if (!element) {

        return;

    }

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : value;

}


/* =========================================================
   GLOBAL ERROR HANDLERS
========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "RS Photography JavaScript error:",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "RS Photography promise rejection:",
            event.reason
        );

    }
);


/* =========================================================
   APPLICATION INITIALIZATION
========================================================= */

async function initializeApplication() {

    if (
        RS_APP.initialized
    ) {

        return;

    }


    RS_APP.initialized =
        true;


    console.log(
        "RS Photography Owner Dashboard starting..."
    );


    /*
     * SECURITY FIRST:
     *
     * Never trust URL credentials.
     */

    cleanAuthenticationUrl();


    /*
     * Always begin with the login screen.
     *
     * This prevents the dashboard from flashing
     * before authentication has been verified.
     */

    showLoginScreen();


    /*
     * Setup UI.
     */

    setupPasswordToggle();

    setupLogoutButtons();

    setupSidebar();

    setupOrderFilters();

    setupNewOrderButton();

    setupOrderForm();

    setupCalendarControls();

    setupContractButton();

    setupStudioSettings();

    setupGalleryButton();

    setupNotifications();

    setupModalControls();

    setupGlobalProtection();


    updateCurrentDate();

    loadLocalStudioSettings();


    /*
     * Initialize calendar.
     */

    const today =
        new Date();

    RS_APP.calendarDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    RS_APP.selectedDate =
        dateToInputValue(
            today
        );


    renderCalendar();


    /*
     * Make sure Supabase exists.
     */

    const supabase =
        getSupabase();


    if (!supabase) {

        console.error(
            "Supabase client unavailable."
        );

        showLoginMessage(
            "Database connection is unavailable. Check supabase.js.",
            "error"
        );

        setLoginLoading(
            false
        );

        return;

    }


    /*
     * Login form.
     */

    const loginForm =
        $("login-form");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    /*
     * Listen for Supabase authentication changes.
     */

    setupAuthListener();


    /*
     * Check existing session.
     */

    try {

        const session =
            await getCurrentSession();


        if (session) {

            RS_APP.session =
                session;

            RS_APP.user =
                session.user;

            RS_APP.authenticated =
                true;

            await enterDashboard();

        } else {

            RS_APP.authenticated =
                false;

            showLoginScreen();

        }


    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );

        RS_APP.authenticated =
            false;

        showLoginScreen();

        showLoginMessage(
            "Could not verify your login session.",
            "error"
        );

    }


    console.log(
        "RS Photography Owner Dashboard initialized."
    );

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication,
        {
            once: true
        }
    );

} else {

    initializeApplication();

}