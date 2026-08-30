/* =========================================================
   RS PHOTOGRAPHY
   OWNER / ADMIN DASHBOARD
   SCRIPT.JS
   ---------------------------------------------------------
   COMPLETE OWNER DASHBOARD CONTROLLER
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

    orders: [],

    contracts: [],

    customers: [],

    currentPage: "dashboardHome",

    calendarDate: new Date(),

    selectedDate: null,

    selectedOrderId: null,

    loading: false,

    refreshing: false

};


/* =========================================================
   SUPABASE HELPER
========================================================= */

function getSupabase() {

    if (
        typeof window.supabaseClient === "undefined" ||
        !window.supabaseClient
    ) {

        throw new Error(
            "Supabase client is not available."
        );

    }

    return window.supabaseClient;

}


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector) {

    return document.querySelector(selector);

}


function $all(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );

}


/* =========================================================
   ELEMENTS
========================================================= */

const elements = {

    loginScreen:
        document.getElementById("loginScreen"),

    loginForm:
        document.getElementById("loginForm"),

    loginEmail:
        document.getElementById("loginEmail"),

    loginPassword:
        document.getElementById("loginPassword"),

    loginButton:
        document.getElementById("loginButton"),

    loginMessage:
        document.getElementById("loginMessage"),

    togglePassword:
        document.getElementById("togglePassword"),

    dashboard:
        document.getElementById("dashboard"),

    sidebar:
        document.getElementById("sidebar"),

    sidebarOverlay:
        document.getElementById("sidebarOverlay"),

    menuButton:
        document.getElementById("menuButton"),

    sidebarClose:
        document.getElementById("sidebarClose"),

    logoutButton:
        document.getElementById("logoutButton"),

    settingsLogout:
        document.getElementById("settingsLogout"),

    ownerName:
        document.getElementById("ownerName"),

    ownerEmail:
        document.getElementById("ownerEmail"),

    welcomeName:
        document.getElementById("welcomeName"),

    settingsEmail:
        document.getElementById("settingsEmail"),

    sessionStatus:
        document.getElementById("sessionStatus"),

    pageTitle:
        document.getElementById("pageTitle"),

    pageEyebrow:
        document.getElementById("pageEyebrow"),

    currentDate:
        document.getElementById("currentDate"),

    globalMessage:
        document.getElementById("globalMessage"),

    toast:
        document.getElementById("toast"),

    toastText:
        document.getElementById("toastText"),

    toastIcon:
        document.getElementById("toastIcon"),

    refreshButton:
        document.getElementById("refreshButton"),

    notificationButton:
        document.getElementById("notificationButton"),

    notificationDot:
        document.getElementById("notificationDot"),

    totalOrders:
        document.getElementById("totalOrders"),

    pendingOrders:
        document.getElementById("pendingOrders"),

    confirmedOrders:
        document.getElementById("confirmedOrders"),

    monthlyRevenue:
        document.getElementById("monthlyRevenue"),

    orderBadge:
        document.getElementById("orderBadge"),

    upcomingBookings:
        document.getElementById("upcomingBookings"),

    recentOrders:
        document.getElementById("recentOrders"),

    ordersTableBody:
        document.getElementById("ordersTableBody"),

    orderSearch:
        document.getElementById("orderSearch"),

    orderStatusFilter:
        document.getElementById("orderStatusFilter"),

    newOrderButton:
        document.getElementById("newOrderButton"),

    orderModal:
        document.getElementById("orderModal"),

    orderForm:
        document.getElementById("orderForm"),

    orderDetailsModal:
        document.getElementById("orderDetailsModal"),

    orderDetailsContent:
        document.getElementById("orderDetailsContent"),

    calendarGrid:
        document.getElementById("calendarGrid"),

    calendarMonth:
        document.getElementById("calendarMonth"),

    previousMonth:
        document.getElementById("previousMonth"),

    nextMonth:
        document.getElementById("nextMonth"),

    todayButton:
        document.getElementById("todayButton"),

    selectedDateTitle:
        document.getElementById("selectedDateTitle"),

    selectedDayBookings:
        document.getElementById("selectedDayBookings"),

    customerSearch:
        document.getElementById("customerSearch"),

    customersGrid:
        document.getElementById("customersGrid"),

    contractsGrid:
        document.getElementById("contractsGrid"),

    newContractButton:
        document.getElementById("newContractButton"),

    contractModal:
        document.getElementById("contractModal"),

    contractForm:
        document.getElementById("contractForm"),

    uploadGalleryButton:
        document.getElementById("uploadGalleryButton"),

    studioSettingsForm:
        document.getElementById("studioSettingsForm"),

    studioName:
        document.getElementById("studioName"),

    studioPhone:
        document.getElementById("studioPhone"),

    studioLocation:
        document.getElementById("studioLocation")

};


/* =========================================================
   PAGE INFORMATION
========================================================= */

const PAGE_INFO = {

    dashboardHome: {
        title: "Dashboard",
        eyebrow: "OWNER STUDIO"
    },

    ordersPage: {
        title: "Orders",
        eyebrow: "BOOKINGS"
    },

    calendarPage: {
        title: "Calendar",
        eyebrow: "SCHEDULE"
    },

    customersPage: {
        title: "Customers",
        eyebrow: "CLIENTS"
    },

    contractsPage: {
        title: "Contracts",
        eyebrow: "DOCUMENTS"
    },

    galleryPage: {
        title: "Gallery",
        eyebrow: "PORTFOLIO"
    },

    messagesPage: {
        title: "Messages",
        eyebrow: "COMMUNICATION"
    },

    settingsPage: {
        title: "Settings",
        eyebrow: "CONFIGURATION"
    }

};


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = ""
) {

    if (!elements.loginMessage) {
        return;
    }

    elements.loginMessage.textContent =
        message;

    elements.loginMessage.className =
        "form-message";

    if (type) {

        elements.loginMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   GLOBAL MESSAGE
========================================================= */

function showGlobalMessage(
    message,
    type = ""
) {

    if (!elements.globalMessage) {
        return;
    }

    elements.globalMessage.textContent =
        message;

    elements.globalMessage.className =
        "global-message";

    if (type) {

        elements.globalMessage.classList.add(
            type
        );

    }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message,
    type = "success"
) {

    if (!elements.toast) {
        return;
    }

    if (toastTimer) {

        clearTimeout(
            toastTimer
        );

    }

    if (elements.toastText) {

        elements.toastText.textContent =
            message;

    }

    if (elements.toastIcon) {

        elements.toastIcon.textContent =
            type === "error"
                ? "!"
                : type === "warning"
                    ? "!"
                    : "✓";

    }

    elements.toast.classList.remove(
        "error",
        "warning",
        "success"
    );

    elements.toast.classList.add(
        type
    );

    elements.toast.classList.add(
        "show"
    );

    toastTimer =
        setTimeout(() => {

            elements.toast.classList.remove(
                "show"
            );

        }, 3500);

}


/* =========================================================
   LOADING BUTTON
========================================================= */

function setLoginLoading(
    loading
) {

    if (!elements.loginButton) {
        return;
    }

    elements.loginButton.disabled =
        loading;

    const text =
        elements.loginButton.querySelector(
            ".button-text"
        );

    const loader =
        elements.loginButton.querySelector(
            ".button-loader"
        );

    if (text) {

        text.textContent =
            loading
                ? "Signing in..."
                : "Sign In";

    }

    if (loader) {

        loader.classList.toggle(
            "active",
            loading
        );

    }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginOwner(
    email,
    password
) {

    const supabase =
        getSupabase();


    const cleanEmail =
        String(email || "")
            .trim()
            .toLowerCase();


    if (!cleanEmail) {

        throw new Error(
            "Please enter your email."
        );

    }


    if (!password) {

        throw new Error(
            "Please enter your password."
        );

    }


    /*
     * IMPORTANT:
     *
     * This sends credentials directly to
     * Supabase Auth.
     *
     * It does NOT submit the HTML form to the
     * GitHub Pages URL.
     */

    const {
        data,
        error
    } =
        await supabase.auth.signInWithPassword({

            email:
                cleanEmail,

            password:
                password

        });


    if (error) {

        throw error;

    }


    if (
        !data ||
        !data.session
    ) {

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


    return data;

}


/* =========================================================
   LOGIN FORM
========================================================= */

function setupLogin() {

    if (!elements.loginForm) {
        return;
    }


    elements.loginForm.addEventListener(
        "submit",
        async event => {

            /*
             * This is the critical fix.
             *
             * Prevents:
             *
             * ?email=...&password=...
             */

            event.preventDefault();

            event.stopPropagation();


            const email =
                elements.loginEmail
                    ? elements.loginEmail.value
                    : "";


            const password =
                elements.loginPassword
                    ? elements.loginPassword.value
                    : "";


            showLoginMessage(
                ""
            );


            setLoginLoading(
                true
            );


            try {

                await loginOwner(
                    email,
                    password
                );


                /*
                 * Remove credentials from URL if
                 * an old URL contains them.
                 */

                cleanAuthenticationUrl();


                showLoginMessage(
                    "Login successful.",
                    "success"
                );


                /*
                 * Open dashboard.
                 */

                await enterDashboard();


            } catch (error) {

                console.error(
                    "RS Photography login error:",
                    error
                );


                showLoginMessage(
                    getFriendlyAuthError(
                        error
                    ),
                    "error"
                );


                setLoginLoading(
                    false
                );

            }

        }
    );

}


/* =========================================================
   AUTH ERROR TRANSLATOR
========================================================= */

function getFriendlyAuthError(
    error
) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();


    if (
        message.includes(
            "invalid login credentials"
        )
    ) {

        return "Incorrect email or password.";

    }


    if (
        message.includes(
            "email not confirmed"
        )
    ) {

        return "Your owner email has not been confirmed in Supabase.";

    }


    if (
        message.includes(
            "too many requests"
        )
    ) {

        return "Too many login attempts. Please wait and try again.";

    }


    if (
        message.includes(
            "network"
        )
    ) {

        return "Network connection failed. Check your internet connection.";

    }


    return (
        error?.message ||
        "Login failed. Please try again."
    );

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function setupPasswordToggle() {

    if (
        !elements.togglePassword ||
        !elements.loginPassword
    ) {

        return;

    }


    elements.togglePassword.addEventListener(
        "click",
        () => {

            const hidden =
                elements.loginPassword.type ===
                "password";


            elements.loginPassword.type =
                hidden
                    ? "text"
                    : "password";


            elements.togglePassword.textContent =
                hidden
                    ? "Hide"
                    : "Show";


            elements.togglePassword.setAttribute(
                "aria-label",
                hidden
                    ? "Hide password"
                    : "Show password"
            );

        }
    );

}


/* =========================================================
   AUTH SESSION
========================================================= */

async function getCurrentSession() {

    const supabase =
        getSupabase();


    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (error) {

        throw error;

    }


    return data.session;

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

    const supabase =
        getSupabase();


    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Auth event:",
                event
            );


            RS_APP.session =
                session;

            RS_APP.user =
                session?.user || null;


            if (session) {

                RS_APP.authenticated =
                    true;


                /*
                 * Do not repeatedly rebuild dashboard
                 * during token refresh.
                 */

                if (
                    event === "SIGNED_IN" ||
                    event === "INITIAL_SESSION"
                ) {

                    await enterDashboard();

                }

            } else {

                RS_APP.authenticated =
                    false;

                showLoginScreen();

            }

        }
    );

}


/* =========================================================
   DASHBOARD ENTRY
========================================================= */

async function enterDashboard() {

    if (!RS_APP.session) {

        try {

            RS_APP.session =
                await getCurrentSession();

            RS_APP.user =
                RS_APP.session?.user || null;

        } catch (error) {

            console.error(
                "Session error:",
                error
            );

            showLoginScreen();

            return;

        }

    }


    if (!RS_APP.session) {

        showLoginScreen();

        return;

    }


    RS_APP.authenticated =
        true;


    hideLoginScreen();

    showDashboard();


    updateOwnerInformation();

    updateCurrentDate();

    initializeNavigation();

    await refreshAllData();

    setSessionStatus(
        "Active"
    );

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginScreen() {

    if (elements.loginScreen) {

        elements.loginScreen.classList.remove(
            "hidden"
        );

    }


    if (elements.dashboard) {

        elements.dashboard.classList.add(
            "hidden"
        );

    }


    setSessionStatus(
        "Signed out"
    );

}


/* =========================================================
   HIDE LOGIN
========================================================= */

function hideLoginScreen() {

    if (elements.loginScreen) {

        elements.loginScreen.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    if (!elements.dashboard) {
        return;
    }


    elements.dashboard.classList.remove(
        "hidden"
    );

}


/* =========================================================
   OWNER INFORMATION
========================================================= */

function updateOwnerInformation() {

    const user =
        RS_APP.user;


    if (!user) {
        return;
    }


    const email =
        user.email ||
        "Owner";


    /*
     * Try metadata first.
     */

    const metadata =
        user.user_metadata ||
        {};


    const name =
        metadata.full_name ||
        metadata.name ||
        metadata.display_name ||
        "Owner";


    if (elements.ownerName) {

        elements.ownerName.textContent =
            name;

    }


    if (elements.welcomeName) {

        elements.welcomeName.textContent =
            name;

    }


    if (elements.ownerEmail) {

        elements.ownerEmail.textContent =
            email;

    }


    if (elements.settingsEmail) {

        elements.settingsEmail.textContent =
            email;

    }

}


/* =========================================================
   SESSION STATUS
========================================================= */

function setSessionStatus(
    status
) {

    if (
        elements.sessionStatus
    ) {

        elements.sessionStatus.textContent =
            status;

    }

}


/* =========================================================
   URL CLEANUP
========================================================= */

function cleanAuthenticationUrl() {

    try {

        const url =
            new URL(
                window.location.href
            );


        /*
         * Remove old insecure query parameters.
         */

        url.searchParams.delete(
            "email"
        );

        url.searchParams.delete(
            "password"
        );


        /*
         * Remove Supabase auth hash after
         * the session has been processed.
         */

        if (
            url.hash &&
            (
                url.hash.includes(
                    "access_token"
                ) ||
                url.hash.includes(
                    "refresh_token"
                )
            )
        ) {

            url.hash =
                "";

        }


        window.history.replaceState(
            {},
            document.title,
            url.pathname +
            url.search +
            url.hash
        );

    } catch (error) {

        console.warn(
            "Could not clean authentication URL:",
            error
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutOwner() {

    try {

        const supabase =
            getSupabase();


        await supabase.auth.signOut();


        RS_APP.session =
            null;

        RS_APP.user =
            null;

        RS_APP.authenticated =
            false;


        showLoginScreen();


        if (elements.loginForm) {

            elements.loginForm.reset();

        }


        showLoginMessage(
            "You have been signed out.",
            "success"
        );


        closeAllModals();

        closeSidebar();


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        showToast(
            "Could not sign out.",
            "error"
        );

    }

}


/* =========================================================
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

    if (elements.logoutButton) {

        elements.logoutButton.addEventListener(
            "click",
            logoutOwner
        );

    }


    if (elements.settingsLogout) {

        elements.settingsLogout.addEventListener(
            "click",
            logoutOwner
        );

    }

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    $all(
        "[data-page]"
    ).forEach(
        element => {

            if (
                element.dataset.navigationBound
            ) {

                return;

            }


            element.dataset.navigationBound =
                "true";


            element.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const page =
                        element.dataset.page;


                    if (!page) {
                        return;
                    }


                    navigateToPage(
                        page
                    );

                }
            );

        }
    );

}


/* =========================================================
   NAVIGATE PAGE
========================================================= */

function navigateToPage(
    page
) {

    const target =
        document.getElementById(
            page
        );


    if (!target) {

        console.warn(
            "Page not found:",
            page
        );

        return;

    }


    RS_APP.currentPage =
        page;


    /*
     * Hide all page sections.
     */

    $all(
        ".page-section"
    ).forEach(
        section => {

            section.classList.remove(
                "active-page"
            );

        }
    );


    target.classList.add(
        "active-page"
    );


    /*
     * Navigation active state.
     */

    $all(
        ".nav-item"
    ).forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        }
    );


    /*
     * Page title.
     */

    const info =
        PAGE_INFO[page] ||
        {
            title: "RS Photography",
            eyebrow: "OWNER STUDIO"
        };


    if (elements.pageTitle) {

        elements.pageTitle.textContent =
            info.title;

    }


    if (elements.pageEyebrow) {

        elements.pageEyebrow.textContent =
            info.eyebrow;

    }


    closeSidebar();


    /*
     * Refresh page-specific content.
     */

    if (
        page === "calendarPage"
    ) {

        renderCalendar();

    }


    if (
        page === "customersPage"
    ) {

        renderCustomers();

    }


    if (
        page === "contractsPage"
    ) {

        renderContracts();

    }


    if (
        page === "ordersPage"
    ) {

        renderOrders();

    }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function openSidebar() {

    if (elements.sidebar) {

        elements.sidebar.classList.add(
            "open"
        );

    }


    if (elements.sidebarOverlay) {

        elements.sidebarOverlay.classList.add(
            "show"
        );

    }


    document.body.classList.add(
        "sidebar-open"
    );

}


function closeSidebar() {

    if (elements.sidebar) {

        elements.sidebar.classList.remove(
            "open"
        );

    }


    if (elements.sidebarOverlay) {

        elements.sidebarOverlay.classList.remove(
            "show"
        );

    }


    document.body.classList.remove(
        "sidebar-open"
    );

}


function setupSidebar() {

    if (elements.menuButton) {

        elements.menuButton.addEventListener(
            "click",
            openSidebar
        );

    }


    if (elements.sidebarClose) {

        elements.sidebarClose.addEventListener(
            "click",
            closeSidebar
        );

    }


    if (elements.sidebarOverlay) {

        elements.sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );

    }

}


/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

    if (!elements.currentDate) {
        return;
    }


    const now =
        new Date();


    elements.currentDate.textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   ORDERS: LOAD
========================================================= */

async function loadOrders() {

    const supabase =
        getSupabase();


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

        console.error(
            "Orders load error:",
            error
        );

        throw error;

    }


    RS_APP.orders =
        Array.isArray(data)
            ? data
            : [];


    return RS_APP.orders;

}


/* =========================================================
   CONTRACTS: LOAD
========================================================= */

async function loadContracts() {

    const supabase =
        getSupabase();


    const {
        data,
        error
    } =
        await supabase
            .from("contracts")
            .select("*")
            .order(
                "contract_date",
                {
                    ascending: false
                }
            );


    /*
     * If contracts table does not exist yet,
     * don't crash the entire dashboard.
     */

    if (error) {

        console.warn(
            "Contracts could not be loaded:",
            error
        );


        RS_APP.contracts =
            [];


        return [];

    }


    RS_APP.contracts =
        Array.isArray(data)
            ? data
            : [];


    return RS_APP.contracts;

}


/* =========================================================
   CUSTOMERS: BUILD FROM ORDERS
========================================================= */

function buildCustomers() {

    const map =
        new Map();


    RS_APP.orders.forEach(
        order => {

            const name =
                String(
                    order.customer_name ||
                    ""
                ).trim();


            const phone =
                String(
                    order.phone ||
                    ""
                ).trim();


            if (!name && !phone) {
                return;
            }


            const key =
                phone ||
                name.toLowerCase();


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    {
                        name:
                            name ||
                            "Customer",

                        phone:
                            phone ||
                            "—",

                        location:
                            order.location ||
                            "—",

                        bookings:
                            0,

                        lastDate:
                            order.booking_date ||
                            null
                    }
                );

            }


            const customer =
                map.get(
                    key
                );


            customer.bookings +=
                1;


            if (
                order.booking_date &&
                (
                    !customer.lastDate ||
                    order.booking_date >
                    customer.lastDate
                )
            ) {

                customer.lastDate =
                    order.booking_date;

            }

        }
    );


    RS_APP.customers =
        Array.from(
            map.values()
        );


    return RS_APP.customers;

}


/* =========================================================
   REFRESH ALL DATA
========================================================= */

async function refreshAllData() {

    if (RS_APP.refreshing) {
        return;
    }


    RS_APP.refreshing =
        true;


    try {

        await loadOrders();

        await loadContracts();

        buildCustomers();

        updateDashboardStats();

        renderRecentOrders();

        renderUpcomingBookings();

        renderOrders();

        renderCalendar();

        renderCustomers();

        renderContracts();

        updateNotificationState();


    } catch (error) {

        console.error(
            "Dashboard refresh failed:",
            error
        );


        showGlobalMessage(
            "Could not load dashboard data.",
            "error"
        );

    } finally {

        RS_APP.refreshing =
            false;

    }

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function updateDashboardStats() {

    const orders =
        RS_APP.orders;


    const total =
        orders.length;


    const pending =
        orders.filter(
            order =>
                normalizeStatus(
                    order.status
                ) === "pending"
        ).length;


    const confirmed =
        orders.filter(
            order =>
                normalizeStatus(
                    order.status
                ) === "confirmed"
        ).length;


    const now =
        new Date();


    const month =
        now.getMonth();


    const year =
        now.getFullYear();


    const monthlyRevenue =
        orders
            .filter(
                order => {

                    if (
                        normalizeStatus(
                            order.status
                        ) === "cancelled"
                    ) {

                        return false;

                    }


                    const date =
                        parseDate(
                            order.booking_date
                        );


                    return (
                        date &&
                        date.getMonth() === month &&
                        date.getFullYear() === year
                    );

                }
            )
            .reduce(
                (
                    total,
                    order
                ) => {

                    return total +
                        Number(
                            order.expected_money ||
                            0
                        );

                },
                0
            );


    setText(
        elements.totalOrders,
        total
    );


    setText(
        elements.pendingOrders,
        pending
    );


    setText(
        elements.confirmedOrders,
        confirmed
    );


    setText(
        elements.monthlyRevenue,
        formatCurrency(
            monthlyRevenue
        )
    );


    setText(
        elements.orderBadge,
        pending
    );

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    element,
    value
) {

    if (element) {

        element.textContent =
            String(value);

    }

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
    amount
) {

    const number =
        Number(amount || 0);


    return number.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    );

}


/* =========================================================
   STATUS
========================================================= */

function normalizeStatus(
    status
) {

    return String(
        status ||
        "pending"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   DATE PARSER
========================================================= */

function parseDate(
    value
) {

    if (!value) {
        return null;
    }


    const date =
        new Date(
            `${value}T00:00:00`
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


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value,
    options = {}
) {

    const date =
        parseDate(
            value
        );


    if (!date) {
        return "—";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                options.day ||
                "numeric",

            month:
                options.month ||
                "short",

            year:
                options.year ||
                "numeric"
        }
    );

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    value
) {

    if (!value) {
        return "—";
    }


    const parts =
        String(value)
            .split(":");


    if (
        parts.length < 2
    ) {

        return value;

    }


    const hours =
        Number(
            parts[0]
        );


    const minutes =
        parts[1];


    if (
        Number.isNaN(
            hours
        )
    ) {

        return value;

    }


    const suffix =
        hours >= 12
            ? "PM"
            : "AM";


    const displayHour =
        hours % 12 || 12;


    return (
        displayHour +
        ":" +
        minutes +
        " " +
        suffix
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   STATUS CLASS
========================================================= */

function statusClass(
    status
) {

    return (
        "status-" +
        normalizeStatus(
            status
        )
    );

}


/* =========================================================
   RECENT ORDERS
========================================================= */

function renderRecentOrders() {

    if (!elements.recentOrders) {
        return;
    }


    const orders =
        [...RS_APP.orders]
            .sort(
                (
                    a,
                    b
                ) => {

                    const ad =
                        new Date(
                            a.created_at ||
                            a.booking_date ||
                            0
                        ).getTime();


                    const bd =
                        new Date(
                            b.created_at ||
                            b.booking_date ||
                            0
                        ).getTime();


                    return bd - ad;

                }
            )
            .slice(
                0,
                6
            );


    if (
        orders.length === 0
    ) {

        elements.recentOrders.innerHTML =
            emptyStateHTML(
                "◫",
                "No orders yet",
                "Customer bookings will appear here automatically."
            );

        return;

    }


    elements.recentOrders.innerHTML =
        orders
            .map(
                order =>
                    `
                    <button
                        type="button"
                        class="order-list-item"
                        data-order-id="${escapeHTML(order.id)}"
                    >

                        <span class="order-avatar">
                            ${escapeHTML(
                                initials(
                                    order.customer_name
                                )
                            )}
                        </span>

                        <span class="order-main">

                            <strong>
                                ${escapeHTML(
                                    order.customer_name ||
                                    "Customer"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    order.function_type ||
                                    "Booking"
                                )}
                            </small>

                        </span>

                        <span class="order-meta">

                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        order.booking_date
                                    )
                                )}
                            </strong>

                            <small
                                class="${statusClass(order.status)}"
                            >
                                ${escapeHTML(
                                    capitalize(
                                        normalizeStatus(
                                            order.status
                                        )
                                    )
                                )}
                            </small>

                        </span>

                    </button>
                    `
            )
            .join("");


    elements.recentOrders
        .querySelectorAll(
            "[data-order-id]"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        openOrderDetails(
                            item.dataset.orderId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   UPCOMING BOOKINGS
========================================================= */

function renderUpcomingBookings() {

    if (!elements.upcomingBookings) {
        return;
    }


    const today =
        startOfToday();


    const bookings =
        RS_APP.orders
            .filter(
                order => {

                    const date =
                        parseDate(
                            order.booking_date
                        );


                    return (
                        date &&
                        date >= today &&
                        normalizeStatus(
                            order.status
                        ) !== "cancelled"
                    );

                }
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    return (
                        parseDate(
                            a.booking_date
                        ) -
                        parseDate(
                            b.booking_date
                        )
                    );

                }
            )
            .slice(
                0,
                5
            );


    if (
        bookings.length === 0
    ) {

        elements.upcomingBookings.innerHTML =
            emptyStateHTML(
                "◷",
                "No upcoming bookings",
                "New confirmed bookings will appear here."
            );

        return;

    }


    elements.upcomingBookings.innerHTML =
        bookings
            .map(
                order =>
                    `
                    <button
                        type="button"
                        class="booking-list-item"
                        data-order-id="${escapeHTML(order.id)}"
                    >

                        <span class="booking-date-box">

                            <strong>
                                ${escapeHTML(
                                    dayNumber(
                                        order.booking_date
                                    )
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    monthShort(
                                        order.booking_date
                                    )
                                )}
                            </small>

                        </span>

                        <span class="booking-content">

                            <strong>
                                ${escapeHTML(
                                    order.customer_name ||
                                    "Customer"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    order.function_type ||
                                    "Photography"
                                )}
                                ·
                                ${escapeHTML(
                                    formatTime(
                                        order.booking_time
                                    )
                                )}
                            </small>

                        </span>

                        <span class="booking-status ${statusClass(order.status)}">
                            ${escapeHTML(
                                capitalize(
                                    normalizeStatus(
                                        order.status
                                    )
                                )
                            )}
                        </span>

                    </button>
                    `
            )
            .join("");


    elements.upcomingBookings
        .querySelectorAll(
            "[data-order-id]"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        openOrderDetails(
                            item.dataset.orderId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   ORDERS TABLE
========================================================= */

function renderOrders() {

    if (!elements.ordersTableBody) {
        return;
    }


    const search =
        String(
            elements.orderSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const statusFilter =
        String(
            elements.orderStatusFilter?.value ||
            "all"
        )
            .toLowerCase();


    const filtered =
        RS_APP.orders.filter(
            order => {

                const searchable =
                    [
                        order.customer_name,
                        order.phone,
                        order.location,
                        order.function_type,
                        order.notes
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(
                        search
                    );


                const matchesStatus =
                    statusFilter === "all" ||
                    normalizeStatus(
                        order.status
                    ) === statusFilter;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (
        filtered.length === 0
    ) {

        elements.ordersTableBody.innerHTML =
            `
            <tr>
                <td
                    colspan="6"
                    class="table-empty"
                >
                    No matching orders found.
                </td>
            </tr>
            `;

        return;

    }


    elements.ordersTableBody.innerHTML =
        filtered
            .map(
                order =>
                    `
                    <tr>

                        <td>

                            <button
                                type="button"
                                class="table-customer"
                                data-order-id="${escapeHTML(order.id)}"
                            >

                                <span class="table-avatar">
                                    ${escapeHTML(
                                        initials(
                                            order.customer_name
                                        )
                                    )}
                                </span>

                                <span>

                                    <strong>
                                        ${escapeHTML(
                                            order.customer_name ||
                                            "Customer"
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            order.phone ||
                                            "No phone"
                                        )}
                                    </small>

                                </span>

                            </button>

                        </td>


                        <td>
                            <strong>
                                ${escapeHTML(
                                    order.function_type ||
                                    "Photography"
                                )}
                            </strong>
                        </td>


                        <td>

                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        order.booking_date
                                    )
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    formatTime(
                                        order.booking_time
                                    )
                                )}
                            </small>

                        </td>


                        <td>
                            ${escapeHTML(
                                order.location ||
                                "—"
                            )}
                        </td>


                        <td>

                            <span
                                class="status-badge ${statusClass(order.status)}"
                            >
                                ${escapeHTML(
                                    capitalize(
                                        normalizeStatus(
                                            order.status
                                        )
                                    )
                                )}
                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="table-action"
                                data-order-id="${escapeHTML(order.id)}"
                            >
                                View
                            </button>

                        </td>

                    </tr>
                    `
            )
            .join("");


    elements.ordersTableBody
        .querySelectorAll(
            "[data-order-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openOrderDetails(
                            button.dataset.orderId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SEARCH / FILTER
========================================================= */

function setupOrderFilters() {

    if (elements.orderSearch) {

        elements.orderSearch.addEventListener(
            "input",
            renderOrders
        );

    }


    if (elements.orderStatusFilter) {

        elements.orderStatusFilter.addEventListener(
            "change",
            renderOrders
        );

    }


    if (elements.customerSearch) {

        elements.customerSearch.addEventListener(
            "input",
            renderCustomers
        );

    }

}


/* =========================================================
   NEW ORDER MODAL
========================================================= */

function openOrderModal() {

    if (!elements.orderModal) {
        return;
    }


    if (elements.orderForm) {

        elements.orderForm.reset();

    }


    setInputValue(
        "orderDate",
        dateToInputValue(
            new Date()
        )
    );


    openModal(
        elements.orderModal
    );

}


function setupNewOrderButton() {

    if (elements.newOrderButton) {

        elements.newOrderButton.addEventListener(
            "click",
            openOrderModal
        );

    }

}


/* =========================================================
   ORDER FORM
========================================================= */

function setupOrderForm() {

    if (!elements.orderForm) {
        return;
    }


    elements.orderForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const form =
                new FormData(
                    elements.orderForm
                );


            const booking = {

                customer_name:
                    cleanString(
                        form.get(
                            "customer_name"
                        )
                    ),

                phone:
                    cleanString(
                        form.get(
                            "phone"
                        )
                    ),

                location:
                    cleanString(
                        form.get(
                            "location"
                        )
                    ),

                function_type:
                    cleanString(
                        form.get(
                            "function_type"
                        )
                    ),

                booking_date:
                    cleanString(
                        form.get(
                            "booking_date"
                        )
                    ),

                booking_time:
                    cleanString(
                        form.get(
                            "booking_time"
                        )
                    ),

                expected_money:
                    numberOrNull(
                        form.get(
                            "expected_money"
                        )
                    ),

                status:
                    cleanString(
                        form.get(
                            "status"
                        )
                    ) ||
                    "pending",

                notes:
                    cleanString(
                        form.get(
                            "notes"
                        )
                    ) ||
                    null

            };


            if (
                !booking.customer_name ||
                !booking.phone ||
                !booking.location ||
                !booking.function_type ||
                !booking.booking_date ||
                !booking.booking_time
            ) {

                showToast(
                    "Please fill all required order fields.",
                    "error"
                );

                return;

            }


            if (
                isPastDateTime(
                    booking.booking_date,
                    booking.booking_time
                )
            ) {

                showToast(
                    "Booking date and time must be in the future.",
                    "error"
                );

                return;

            }


            const submit =
                elements.orderForm.querySelector(
                    'button[type="submit"]'
                );


            if (submit) {

                submit.disabled =
                    true;

                submit.textContent =
                    "Saving...";

            }


            try {

                const supabase =
                    getSupabase();


                const {
                    data,
                    error
                } =
                    await supabase
                        .from("orders")
                        .insert(
                            booking
                        )
                        .select()
                        .single();


                if (error) {

                    throw error;

                }


                /*
                 * Add locally immediately.
                 */

                if (data) {

                    RS_APP.orders.push(
                        data
                    );

                }


                buildCustomers();

                updateDashboardStats();

                renderOrders();

                renderRecentOrders();

                renderUpcomingBookings();

                renderCalendar();

                renderCustomers();


                closeModal(
                    elements.orderModal
                );


                showToast(
                    "Order saved successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Create order error:",
                    error
                );


                showToast(
                    friendlyDatabaseError(
                        error
                    ),
                    "error"
                );

            } finally {

                if (submit) {

                    submit.disabled =
                        false;

                    submit.textContent =
                        "Save Order";

                }

            }

        }
    );

}


/* =========================================================
   ORDER DETAILS
========================================================= */

function openOrderDetails(
    orderId
) {

    const order =
        RS_APP.orders.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    orderId
                )
        );


    if (!order) {

        showToast(
            "Order could not be found.",
            "error"
        );

        return;

    }


    RS_APP.selectedOrderId =
        order.id;


    if (!elements.orderDetailsModal) {
        return;
    }


    if (elements.orderDetailsContent) {

        elements.orderDetailsContent.innerHTML =
            `
            <div class="details-summary">

                <div class="details-avatar">
                    ${escapeHTML(
                        initials(
                            order.customer_name
                        )
                    )}
                </div>

                <div>

                    <span class="section-kicker">
                        CUSTOMER
                    </span>

                    <h3>
                        ${escapeHTML(
                            order.customer_name ||
                            "Customer"
                        )}
                    </h3>

                    <span
                        class="status-badge ${statusClass(order.status)}"
                    >
                        ${escapeHTML(
                            capitalize(
                                normalizeStatus(
                                    order.status
                                )
                            )
                        )}
                    </span>

                </div>

            </div>


            <div class="details-grid">

                <div class="detail-row">
                    <span>Phone</span>
                    <strong>
                        ${escapeHTML(
                            order.phone ||
                            "—"
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Event</span>
                    <strong>
                        ${escapeHTML(
                            order.function_type ||
                            "—"
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Date</span>
                    <strong>
                        ${escapeHTML(
                            formatDate(
                                order.booking_date
                            )
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Time</span>
                    <strong>
                        ${escapeHTML(
                            formatTime(
                                order.booking_time
                            )
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Location</span>
                    <strong>
                        ${escapeHTML(
                            order.location ||
                            "—"
                        )}
                    </strong>
                </div>


                <div class="detail-row">
                    <span>Expected amount</span>
                    <strong>
                        ${escapeHTML(
                            formatCurrency(
                                order.expected_money
                            )
                        )}
                    </strong>
                </div>

            </div>


            <div class="detail-notes">

                <span>
                    NOTES
                </span>

                <p>
                    ${escapeHTML(
                        order.notes ||
                        "No additional notes."
                    )}
                </p>

            </div>


            <div class="details-actions">

                <button
                    type="button"
                    class="secondary-button"
                    data-detail-status="pending"
                >
                    Pending
                </button>

                <button
                    type="button"
                    class="primary-button"
                    data-detail-status="confirmed"
                >
                    Confirm
                </button>

                <button
                    type="button"
                    class="secondary-button"
                    data-detail-status="completed"
                >
                    Complete
                </button>

                <button
                    type="button"
                    class="danger-button"
                    data-detail-status="cancelled"
                >
                    Cancel
                </button>

            </div>
            `;


        elements.orderDetailsContent
            .querySelectorAll(
                "[data-detail-status]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            await updateOrderStatus(
                                order.id,
                                button.dataset.detailStatus
                            );

                        }
                    );

                }
            );

    }


    openModal(
        elements.orderDetailsModal
    );

}


/* =========================================================
   UPDATE ORDER STATUS
========================================================= */

async function updateOrderStatus(
    orderId,
    status
) {

    const validStatuses = [
        "pending",
        "confirmed",
        "completed",
        "cancelled"
    ];


    if (
        !validStatuses.includes(
            status
        )
    ) {

        return;

    }


    try {

        const supabase =
            getSupabase();


        const {
            data,
            error
        } =
            await supabase
                .from("orders")
                .update({
                    status:
                        status
                })
                .eq(
                    "id",
                    orderId
                )
                .select()
                .single();


        if (error) {

            throw error;

        }


        const index =
            RS_APP.orders.findIndex(
                order =>
                    String(
                        order.id
                    ) ===
                    String(
                        orderId
                    )
            );


        if (
            index !== -1 &&
            data
        ) {

            RS_APP.orders[
                index
            ] =
                data;

        }


        updateDashboardStats();

        renderOrders();

        renderRecentOrders();

        renderUpcomingBookings();

        renderCalendar();


        showToast(
            "Order status updated.",
            "success"
        );


        if (
            elements.orderDetailsModal
        ) {

            closeModal(
                elements.orderDetailsModal
            );

        }


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        showToast(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    if (
        !elements.calendarGrid ||
        !elements.calendarMonth
    ) {

        return;

    }


    const year =
        RS_APP.calendarDate.getFullYear();


    const month =
        RS_APP.calendarDate.getMonth();


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


    const daysInMonth =
        lastDay.getDate();


    const startingDay =
        firstDay.getDay();


    elements.calendarMonth.textContent =
        RS_APP.calendarDate.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    const cells = [];


    /*
     * Previous month cells.
     */

    for (
        let i = 0;
        i < startingDay;
        i++
    ) {

        cells.push(
            {
                type:
                    "empty"
            }
        );

    }


    /*
     * Current month.
     */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        cells.push(
            {
                type:
                    "day",

                date:
                    date
            }
        );

    }


    elements.calendarGrid.innerHTML =
        cells
            .map(
                cell => {

                    if (
                        cell.type ===
                        "empty"
                    ) {

                        return `
                            <div
                                class="calendar-cell empty"
                            ></div>
                        `;

                    }


                    const date =
                        cell.date;


                    const dateValue =
                        dateToInputValue(
                            date
                        );


                    const bookings =
                        RS_APP.orders.filter(
                            order =>
                                order.booking_date ===
                                dateValue
                        );


                    const isToday =
                        isSameDate(
                            date,
                            new Date()
                        );


                    const isSelected =
                        RS_APP.selectedDate ===
                        dateValue;


                    return `
                        <button
                            type="button"
                            class="
                                calendar-cell
                                ${isToday ? "today" : ""}
                                ${isSelected ? "selected" : ""}
                                ${bookings.length ? "has-bookings" : ""}
                            "
                            data-calendar-date="${dateValue}"
                        >

                            <span class="calendar-day-number">
                                ${day}
                            </span>

                            ${
                                bookings.length
                                    ? `
                                        <span class="calendar-events">
                                            ${bookings
                                                .slice(
                                                    0,
                                                    3
                                                )
                                                .map(
                                                    booking =>
                                                        `
                                                        <span
                                                            class="calendar-event"
                                                        >
                                                            ${escapeHTML(
                                                                booking.customer_name ||
                                                                "Booking"
                                                            )}
                                                        </span>
                                                        `
                                                )
                                                .join("")}
                                        </span>
                                    `
                                    : ""
                            }

                        </button>
                    `;

                }
            )
            .join("");


    elements.calendarGrid
        .querySelectorAll(
            "[data-calendar-date]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectCalendarDate(
                            button.dataset.calendarDate
                        );

                    }
                );

            }
        );


    if (
        RS_APP.selectedDate
    ) {

        renderSelectedDay();

    }

}


/* =========================================================
   CALENDAR DATE SELECTION
========================================================= */

function selectCalendarDate(
    date
) {

    RS_APP.selectedDate =
        date;


    renderCalendar();

    renderSelectedDay();

}


/* =========================================================
   SELECTED DAY
========================================================= */

function renderSelectedDay() {

    if (
        !elements.selectedDayBookings ||
        !elements.selectedDateTitle
    ) {

        return;

    }


    if (
        !RS_APP.selectedDate
    ) {

        elements.selectedDateTitle.textContent =
            "Select a date";


        elements.selectedDayBookings.innerHTML =
            emptyStateHTML(
                "□",
                "",
                "Select a date to view bookings."
            );


        return;

    }


    elements.selectedDateTitle.textContent =
        formatDate(
            RS_APP.selectedDate,
            {
                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        );


    const bookings =
        RS_APP.orders
            .filter(
                order =>
                    order.booking_date ===
                    RS_APP.selectedDate
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    String(
                        a.booking_time ||
                        ""
                    ).localeCompare(
                        String(
                            b.booking_time ||
                            ""
                        )
                    )
            );


    if (
        bookings.length === 0
    ) {

        elements.selectedDayBookings.innerHTML =
            emptyStateHTML(
                "□",
                "No bookings",
                "Nothing is scheduled for this date."
            );

        return;

    }


    elements.selectedDayBookings.innerHTML =
        bookings
            .map(
                order =>
                    `
                    <button
                        type="button"
                        class="selected-booking"
                        data-order-id="${escapeHTML(order.id)}"
                    >

                        <span class="selected-booking-time">
                            ${escapeHTML(
                                formatTime(
                                    order.booking_time
                                )
                            )}
                        </span>

                        <span class="selected-booking-info">

                            <strong>
                                ${escapeHTML(
                                    order.customer_name ||
                                    "Customer"
                                )}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    order.function_type ||
                                    "Photography"
                                )}
                                ·
                                ${escapeHTML(
                                    order.location ||
                                    "—"
                                )}
                            </small>

                        </span>

                        <span
                            class="status-badge ${statusClass(order.status)}"
                        >
                            ${escapeHTML(
                                capitalize(
                                    normalizeStatus(
                                        order.status
                                    )
                                )
                            )}
                        </span>

                    </button>
                    `
            )
            .join("");


    elements.selectedDayBookings
        .querySelectorAll(
            "[data-order-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openOrderDetails(
                            button.dataset.orderId
                        );

                    }
                );

            }
        );

}


/* =========================================================
   CALENDAR CONTROLS
========================================================= */

function setupCalendarControls() {

    if (elements.previousMonth) {

        elements.previousMonth.addEventListener(
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

    }


    if (elements.nextMonth) {

        elements.nextMonth.addEventListener(
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

    }


    if (elements.todayButton) {

        elements.todayButton.addEventListener(
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

                renderSelectedDay();

            }
        );

    }

}


/* =========================================================
   CUSTOMERS
========================================================= */

function renderCustomers() {

    if (!elements.customersGrid) {
        return;
    }


    const search =
        String(
            elements.customerSearch?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const customers =
        RS_APP.customers.filter(
            customer => {

                const text =
                    [
                        customer.name,
                        customer.phone,
                        customer.location
                    ]
                        .join(" ")
                        .toLowerCase();


                return (
                    !search ||
                    text.includes(
                        search
                    )
                );

            }
        );


    if (
        customers.length === 0
    ) {

        elements.customersGrid.innerHTML =
            emptyStateHTML(
                "◎",
                "No customers yet",
                "Customers will be created automatically from orders."
            );

        return;

    }


    elements.customersGrid.innerHTML =
        customers
            .map(
                customer =>
                    `
                    <article class="customer-card">

                        <div class="customer-card-top">

                            <div class="customer-avatar">
                                ${escapeHTML(
                                    initials(
                                        customer.name
                                    )
                                )}
                            </div>

                            <div>

                                <h3>
                                    ${escapeHTML(
                                        customer.name
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        customer.phone
                                    )}
                                </p>

                            </div>

                        </div>


                        <div class="customer-details">

                            <div>
                                <span>
                                    LOCATION
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        customer.location
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    BOOKINGS
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        customer.bookings
                                    )}
                                </strong>
                            </div>


                            <div>
                                <span>
                                    LAST BOOKING
                                </span>

                                <strong>
                                    ${escapeHTML(
                                        formatDate(
                                            customer.lastDate
                                        )
                                    )}
                                </strong>
                            </div>

                        </div>

                    </article>
                    `
            )
            .join("");

}


/* =========================================================
   CONTRACTS
========================================================= */

function renderContracts() {

    if (!elements.contractsGrid) {
        return;
    }


    if (
        RS_APP.contracts.length === 0
    ) {

        elements.contractsGrid.innerHTML =
            emptyStateHTML(
                "▤",
                "No contracts yet",
                "Create a contract and it will appear here."
            );

        return;

    }


    elements.contractsGrid.innerHTML =
        RS_APP.contracts
            .map(
                contract =>
                    `
                    <article class="contract-card">

                        <div class="contract-top">

                            <div class="contract-icon">
                                ▤
                            </div>

                            <span
                                class="status-badge contract-${escapeHTML(
                                    normalizeStatus(
                                        contract.status
                                    )
                                )}"
                            >
                                ${escapeHTML(
                                    capitalize(
                                        normalizeStatus(
                                            contract.status
                                        )
                                    )
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeHTML(
                                contract.customer_name ||
                                "Client Contract"
                            )}
                        </h3>


                        <p>
                            Contract date:
                            ${escapeHTML(
                                formatDate(
                                    contract.contract_date
                                )
                            )}
                        </p>


                        <strong>
                            ${escapeHTML(
                                formatCurrency(
                                    contract.amount
                                )
                            )}
                        </strong>


                        ${
                            contract.notes
                                ? `
                                    <div class="contract-notes">
                                        ${escapeHTML(
                                            contract.notes
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </article>
                    `
            )
            .join("");

}


/* =========================================================
   NEW CONTRACT
========================================================= */

function setupContractButton() {

    if (elements.newContractButton) {

        elements.newContractButton.addEventListener(
            "click",
            () => {

                if (
                    elements.contractForm
                ) {

                    elements.contractForm.reset();

                }


                setInputValue(
                    "contractDate",
                    dateToInputValue(
                        new Date()
                    )
                );


                openModal(
                    elements.contractModal
                );

            }
        );

    }

}


/* =========================================================
   CONTRACT FORM
========================================================= */

function setupContractForm() {

    if (!elements.contractForm) {
        return;
    }


    elements.contractForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const form =
                new FormData(
                    elements.contractForm
                );


            const contract = {

                customer_name:
                    cleanString(
                        form.get(
                            "customer_name"
                        )
                    ),

                contract_date:
                    cleanString(
                        form.get(
                            "contract_date"
                        )
                    ),

                amount:
                    numberOrNull(
                        form.get(
                            "amount"
                        )
                    ),

                status:
                    cleanString(
                        form.get(
                            "status"
                        )
                    ) ||
                    "draft",

                notes:
                    cleanString(
                        form.get(
                            "notes"
                        )
                    ) ||
                    null

            };


            if (
                !contract.customer_name ||
                !contract.contract_date
            ) {

                showToast(
                    "Customer and contract date are required.",
                    "error"
                );

                return;

            }


            const submit =
                elements.contractForm.querySelector(
                    'button[type="submit"]'
                );


            if (submit) {

                submit.disabled =
                    true;

                submit.textContent =
                    "Saving...";

            }


            try {

                const supabase =
                    getSupabase();


                const {
                    data,
                    error
                } =
                    await supabase
                        .from("contracts")
                        .insert(
                            contract
                        )
                        .select()
                        .single();


                if (error) {

                    throw error;

                }


                if (data) {

                    RS_APP.contracts.unshift(
                        data
                    );

                }


                renderContracts();

                closeModal(
                    elements.contractModal
                );


                showToast(
                    "Contract saved successfully.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "Contract creation error:",
                    error
                );


                showToast(
                    friendlyDatabaseError(
                        error
                    ),
                    "error"
                );

            } finally {

                if (submit) {

                    submit.disabled =
                        false;

                    submit.textContent =
                        "Save Contract";

                }

            }

        }
    );

}


/* =========================================================
   STUDIO SETTINGS
========================================================= */

function setupStudioSettings() {

    if (
        !elements.studioSettingsForm
    ) {

        return;

    }


    elements.studioSettingsForm.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            /*
             * This is currently stored locally.
             *
             * If you later create a studio_settings table,
             * this function can save it to Supabase.
             */

            const settings = {

                studio_name:
                    elements.studioName?.value ||
                    "RS Photography",

                studio_phone:
                    elements.studioPhone?.value ||
                    "",

                studio_location:
                    elements.studioLocation?.value ||
                    ""

            };


            localStorage.setItem(
                "rsPhotographyStudioSettings",
                JSON.stringify(
                    settings
                )
            );


            showToast(
                "Studio settings saved.",
                "success"
            );

        }
    );


    loadStudioSettings();

}


/* =========================================================
   LOAD STUDIO SETTINGS
========================================================= */

function loadStudioSettings() {

    try {

        const saved =
            localStorage.getItem(
                "rsPhotographyStudioSettings"
            );


        if (!saved) {
            return;
        }


        const settings =
            JSON.parse(
                saved
            );


        if (
            elements.studioName &&
            settings.studio_name
        ) {

            elements.studioName.value =
                settings.studio_name;

        }


        if (
            elements.studioPhone
        ) {

            elements.studioPhone.value =
                settings.studio_phone ||
                "";

        }


        if (
            elements.studioLocation
        ) {

            elements.studioLocation.value =
                settings.studio_location ||
                "";

        }

    } catch (error) {

        console.warn(
            "Studio settings could not be loaded.",
            error
        );

    }

}


/* =========================================================
   GALLERY
========================================================= */

function setupGalleryButton() {

    if (
        !elements.uploadGalleryButton
    ) {

        return;

    }


    elements.uploadGalleryButton.addEventListener(
        "click",
        () => {

            showToast(
                "Gallery storage is not connected yet.",
                "warning"
            );

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function updateNotificationState() {

    const pending =
        RS_APP.orders.filter(
            order =>
                normalizeStatus(
                    order.status
                ) ===
                "pending"
        ).length;


    if (
        elements.notificationDot
    ) {

        elements.notificationDot.classList.toggle(
            "hidden",
            pending === 0
        );

    }

}


function setupNotifications() {

    if (
        elements.notificationButton
    ) {

        elements.notificationButton.addEventListener(
            "click",
            () => {

                const pending =
                    RS_APP.orders.filter(
                        order =>
                            normalizeStatus(
                                order.status
                            ) ===
                            "pending"
                    ).length;


                if (pending > 0) {

                    showToast(
                        `${pending} pending booking${pending === 1 ? "" : "s"}.`,
                        "warning"
                    );

                    navigateToPage(
                        "ordersPage"
                    );

                } else {

                    showToast(
                        "No new booking notifications.",
                        "success"
                    );

                }

            }
        );

    }

}


/* =========================================================
   REFRESH
========================================================= */

function setupRefresh() {

    if (
        !elements.refreshButton
    ) {

        return;

    }


    elements.refreshButton.addEventListener(
        "click",
        async () => {

            if (
                RS_APP.refreshing
            ) {

                return;

            }


            elements.refreshButton.classList.add(
                "spinning"
            );


            try {

                await refreshAllData();


                showToast(
                    "Dashboard refreshed.",
                    "success"
                );


            } finally {

                elements.refreshButton.classList.remove(
                    "spinning"
                );

            }

        }
    );

}


/* =========================================================
   MODALS
========================================================= */

function openModal(
    modal
) {

    if (!modal) {
        return;
    }


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        () => {

            const firstInput =
                modal.querySelector(
                    "input, textarea, select"
                );


            if (firstInput) {

                firstInput.focus();

            }

        },
        50
    );

}


function closeModal(
    modal
) {

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (
        !document.querySelector(
            ".modal.open"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


function closeAllModals() {

    $all(
        ".modal.open"
    ).forEach(
        modal => {

            closeModal(
                modal
            );

        }
    );

}


function setupModalControls() {

    $all(
        "[data-close-modal]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const modalId =
                        button.dataset.closeModal;


                    closeModal(
                        document.getElementById(
                            modalId
                        )
                    );

                }
            );

        }
    );


    $all(
        ".modal-backdrop"
    ).forEach(
        backdrop => {

            backdrop.addEventListener(
                "click",
                () => {

                    const modal =
                        backdrop.closest(
                            ".modal"
                        );


                    closeModal(
                        modal
                    );

                }
            );

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeAllModals();

                closeSidebar();

            }

        }
    );

}


/* =========================================================
   KEYBOARD PROTECTION
========================================================= */

function setupGlobalProtection() {

    /*
     * Prevent accidental form submission from creating
     * query-string credentials.
     *
     * Login has its own explicit submit listener.
     */

    if (elements.loginForm) {

        elements.loginForm.setAttribute(
            "method",
            "post"
        );

        elements.loginForm.setAttribute(
            "action",
            "#"
        );

    }

}


/* =========================================================
   UTILITY: EMPTY STATE
========================================================= */

function emptyStateHTML(
    icon,
    title,
    message
) {

    return `
        <div class="empty-state">

            <span class="empty-icon">
                ${escapeHTML(icon)}
            </span>

            ${
                title
                    ? `
                        <h4>
                            ${escapeHTML(title)}
                        </h4>
                    `
                    : ""
            }

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;

}


/* =========================================================
   UTILITY: INITIALS
========================================================= */

function initials(
    name
) {

    const value =
        String(
            name ||
            "RS"
        )
            .trim();


    if (!value) {
        return "RS";
    }


    const words =
        value.split(
            /\s+/
        );


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    )
        .toUpperCase();

}


/* =========================================================
   UTILITY: CAPITALIZE
========================================================= */

function capitalize(
    value
) {

    const string =
        String(
            value ||
            ""
        );


    return string.charAt(0).toUpperCase() +
        string.slice(1);

}


/* =========================================================
   UTILITY: CLEAN STRING
========================================================= */

function cleanString(
    value
) {

    return String(
        value ??
        ""
    )
        .trim();

}


/* =========================================================
   UTILITY: NUMBER
========================================================= */

function numberOrNull(
    value
) {

    const string =
        String(
            value ??
            ""
        )
            .trim();


    if (!string) {
        return null;
    }


    const number =
        Number(
            string
        );


    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* =========================================================
   UTILITY: INPUT VALUE
========================================================= */

function setInputValue(
    id,
    value
) {

    const input =
        document.getElementById(
            id
        );


    if (input) {

        input.value =
            value;

    }

}


/* =========================================================
   UTILITY: DATE TO INPUT
========================================================= */

function dateToInputValue(
    date
) {

    if (!date) {
        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/* =========================================================
   UTILITY: TODAY
========================================================= */

function startOfToday() {

    const today =
        new Date();


    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

}


/* =========================================================
   UTILITY: SAME DATE
========================================================= */

function isSameDate(
    first,
    second
) {

    return (
        first.getFullYear() ===
        second.getFullYear() &&

        first.getMonth() ===
        second.getMonth() &&

        first.getDate() ===
        second.getDate()
    );

}


/* =========================================================
   UTILITY: DAY NUMBER
========================================================= */

function dayNumber(
    value
) {

    const date =
        parseDate(
            value
        );


    return date
        ? date.getDate()
        : "—";

}


/* =========================================================
   UTILITY: MONTH
========================================================= */

function monthShort(
    value
) {

    const date =
        parseDate(
            value
        );


    return date
        ? date.toLocaleDateString(
            "en-IN",
            {
                month: "short"
            }
        )
        : "—";

}


/* =========================================================
   FUTURE DATE/TIME VALIDATION
========================================================= */

function isPastDateTime(
    dateString,
    timeString
) {

    if (
        !dateString ||
        !timeString
    ) {

        return false;

    }


    const target =
        new Date(
            `${dateString}T${timeString}`
        );


    if (
        Number.isNaN(
            target.getTime()
        )
    ) {

        return false;

    }


    return (
        target.getTime() <=
        Date.now()
    );

}


/* =========================================================
   DATABASE ERROR
========================================================= */

function friendlyDatabaseError(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        );


    if (
        message.includes(
            "relation"
        ) &&
        message.includes(
            "does not exist"
        )
    ) {

        return "The required Supabase table does not exist yet.";

    }


    if (
        message.includes(
            "permission denied"
        ) ||
        message.includes(
            "row-level security"
        )
    ) {

        return "Supabase Row Level Security is blocking this operation.";

    }


    if (
        message.includes(
            "violates row-level security policy"
        )
    ) {

        return "Your Supabase RLS policy does not allow this operation.";

    }


    if (
        message.includes(
            "duplicate"
        )
    ) {

        return "This record already exists.";

    }


    return (
        message ||
        "Database operation failed."
    );

}


/* =========================================================
   GLOBAL ERROR HANDLING
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
            "RS Photography promise error:",
            event.reason
        );

    }
);


/* =========================================================
   INITIAL APPLICATION START
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
     * Configure URL cleanup immediately.
     */

    cleanAuthenticationUrl();


    /*
     * Basic UI.
     */

    setupLogin();

    setupPasswordToggle();

    setupLogoutButtons();

    setupSidebar();

    setupOrderFilters();

    setupNewOrderButton();

    setupOrderForm();

    setupCalendarControls();

    setupContractButton();

    setupContractForm();

    setupStudioSettings();

    setupGalleryButton();

    setupNotifications();

    setupRefresh();

    setupModalControls();

    setupGlobalProtection();


    updateCurrentDate();


    /*
     * Start calendar on current month.
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
     * Wait for Supabase client.
     *
     * Normally supabase.js executes first because
     * both scripts are loaded with defer in order.
     */

    let attempts =
        0;


    while (
        (
            typeof window.supabaseClient ===
            "undefined" ||
            !window.supabaseClient
        ) &&
        attempts < 50
    ) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );


        attempts++;

    }


    /*
     * If Supabase still isn't available,
     * show a useful error instead of infinite loading.
     */

    if (
        !window.supabaseClient
    ) {

        console.error(
            "Supabase client unavailable."
        );


        showLoginMessage(
            "Database connection is unavailable. Check supabase.js and the Supabase library.",
            "error"
        );


        setLoginLoading(
            false
        );


        return;

    }


    /*
     * Authentication listener.
     */

    setupAuthListener();


    /*
     * Check existing persistent session.
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

            showLoginScreen();

            setLoginLoading(
                false
            );

        }

    } catch (error) {

        console.error(
            "Initial session check failed:",
            error
        );


        showLoginScreen();


        showLoginMessage(
            "Could not verify your login session.",
            "error"
        );


        setLoginLoading(
            false
        );

    }


    console.log(
        "RS Photography Owner Dashboard initialized."
    );

}


/* =========================================================
   DOM READY
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