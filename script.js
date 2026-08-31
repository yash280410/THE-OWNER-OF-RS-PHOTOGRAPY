/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   COMPLETE CLEAN SCRIPT.JS
   =========================================================

   REQUIREMENTS
   ---------------------------------------------------------
   1. supabase.js must load before this file.
   2. supabase.js must create:
        window.supabaseClient
   3. Supabase JS v2 must be loaded before supabase.js.
   4. This file uses the normal browser Supabase client.
   5. NEVER put a service_role/secret key in browser JS.

   MAIN FEATURES
   ---------------------------------------------------------
   - Owner authentication
   - Persistent session
   - Login/logout
   - Orders
   - Order filtering
   - New order
   - Order editing
   - Order deletion
   - Calendar
   - Contracts
   - Studio settings
   - Gallery
   - Notifications
   - Refresh
   - Modals
   - Sidebar/mobile navigation
   - Date validation
   - Error handling
   ========================================================= */


/* =========================================================
   GLOBAL CONFIGURATION
========================================================= */

const RS_CONFIG = {

    tables: {

        orders:
            "orders",

        contracts:
            "contracts",

        gallery:
            "gallery",

        notifications:
            "notifications",

        studio:
            "studio_settings"

    },

    selectors: {

        loginScreen: [
            "#loginScreen",
            "#login-screen",
            ".login-screen"
        ],

        dashboard: [
            "#dashboard",
            "#dashboardScreen",
            "#ownerDashboard",
            ".dashboard"
        ],

        loginForm: [
            "#loginForm",
            "#login-form"
        ],

        email: [
            "#loginEmail",
            "#email",
            'input[type="email"]'
        ],

        password: [
            "#loginPassword",
            "#password",
            'input[type="password"]'
        ],

        loginButton: [
            "#loginButton",
            "#loginBtn",
            "#loginForm button[type='submit']"
        ],

        loginMessage: [
            "#loginMessage",
            "#login-message"
        ],

        logout: [
            "#logoutButton",
            "#logoutBtn",
            "[data-action='logout']"
        ],

        sidebar: [
            "#sidebar",
            ".sidebar"
        ],

        sidebarToggle: [
            "#sidebarToggle",
            "#menuToggle",
            ".menu-toggle"
        ],

        ordersContainer: [
            "#ordersContainer",
            "#ordersList",
            "#ordersTableBody",
            ".orders-list"
        ],

        orderForm: [
            "#orderForm",
            "#newOrderForm"
        ],

        newOrderButton: [
            "#newOrderButton",
            "#newOrderBtn",
            "[data-action='new-order']"
        ],

        orderModal: [
            "#orderModal",
            "#newOrderModal",
            "#orderFormModal"
        ],

        calendar: [
            "#calendar",
            "#calendarGrid"
        ],

        calendarTitle: [
            "#calendarTitle",
            "#calendarMonth"
        ],

        previousMonth: [
            "#previousMonth",
            "#prevMonth",
            "[data-calendar='previous']"
        ],

        nextMonth: [
            "#nextMonth",
            "[data-calendar='next']"
        ],

        todayButton: [
            "#todayButton",
            "#calendarToday",
            "[data-calendar='today']"
        ],

        contractButton: [
            "#contractButton",
            "#newContractButton",
            "[data-action='contract']"
        ],

        contractForm: [
            "#contractForm",
            "#newContractForm"
        ],

        contractModal: [
            "#contractModal",
            "#contractFormModal"
        ],

        galleryButton: [
            "#galleryButton",
            "[data-action='gallery']"
        ],

        refreshButton: [
            "#refreshButton",
            "#refreshBtn",
            "[data-action='refresh']"
        ],

        notificationButton: [
            "#notificationButton",
            "#notificationsButton"
        ],

        notificationContainer: [
            "#notificationContainer",
            "#notifications"
        ],

        modal: [
            ".modal",
            "[role='dialog']"
        ],

        modalClose: [
            ".modal-close",
            "[data-modal-close]",
            "[data-action='close-modal']"
        ],

        orderSearch: [
            "#orderSearch",
            "#searchOrders",
            "[data-order-search]"
        ],

        orderStatus: [
            "#orderStatusFilter",
            "#statusFilter",
            "[data-order-status]"
        ]

    }

};


/* =========================================================
   GLOBAL APPLICATION STATE
========================================================= */

const RS_APP = {

    initialized:
        false,

    authenticated:
        false,

    dashboardLoading:
        false,

    signingIn:
        false,

    loading:
        false,

    session:
        null,

    user:
        null,

    orders:
        [],

    filteredOrders:
        [],

    contracts:
        [],

    gallery:
        [],

    notifications:
        [],

    studio:
        null,

    selectedOrder:
        null,

    editingOrderId:
        null,

    editingContractId:
        null,

    selectedDate:
        null,

    calendarDate:
        null,

    orderFilter:
        "all",

    orderSearch:
        "",

    authSubscription:
        null

};


/* =========================================================
   BASIC DOM HELPERS
========================================================= */

function firstElement(selectors) {

    if (!Array.isArray(selectors)) {
        selectors = [selectors];
    }

    for (const selector of selectors) {

        try {

            const element =
                document.querySelector(selector);

            if (element) {
                return element;
            }

        } catch (error) {

            console.warn(
                "Invalid selector:",
                selector
            );

        }

    }

    return null;
}


function allElements(selectors) {

    if (!Array.isArray(selectors)) {
        selectors = [selectors];
    }

    const result = [];

    for (const selector of selectors) {

        try {

            document
                .querySelectorAll(selector)
                .forEach(element => {

                    if (!result.includes(element)) {
                        result.push(element);
                    }

                });

        } catch (error) {

            console.warn(
                "Invalid selector:",
                selector
            );

        }

    }

    return result;

}


function getElement(name) {

    const selectors =
        RS_CONFIG.selectors[name];

    return selectors
        ? firstElement(selectors)
        : null;

}


function setText(
    selectorOrElement,
    value
) {

    const element =
        typeof selectorOrElement === "string"
            ? document.querySelector(selectorOrElement)
            : selectorOrElement;

    if (!element) {
        return;
    }

    element.textContent =
        value == null
            ? ""
            : String(value);

}


function setValue(
    selectorOrElement,
    value
) {

    const element =
        typeof selectorOrElement === "string"
            ? document.querySelector(selectorOrElement)
            : selectorOrElement;

    if (!element) {
        return;
    }

    element.value =
        value == null
            ? ""
            : String(value);

}


function escapeHTML(value) {

    return String(
        value == null
            ? ""
            : value
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   SUPABASE CLIENT
========================================================= */

function getSupabase() {

    if (
        typeof window.supabaseClient ===
        "undefined" ||
        !window.supabaseClient
    ) {

        throw new Error(
            "Supabase client is unavailable."
        );

    }

    return window.supabaseClient;

}


/* =========================================================
   DATE TO INPUT
========================================================= */

function dateToInputValue(date) {

    if (!date) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}


/* =========================================================
   START OF TODAY
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
   SAME DATE
========================================================= */

function isSameDate(
    first,
    second
) {

    if (!first || !second) {
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


/* =========================================================
   SAFE DATE PARSER
========================================================= */

function parseDate(value) {

    if (!value) {
        return null;
    }

    const string =
        String(value).trim();

    let date;

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(string)
    ) {

        date =
            new Date(
                `${string}T00:00:00`
            );

    } else {

        date =
            new Date(string);

    }

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
   DAY NUMBER
========================================================= */

function dayNumber(value) {

    const date =
        parseDate(value);

    return date
        ? date.getDate()
        : "—";

}


/* =========================================================
   MONTH SHORT
========================================================= */

function monthShort(value) {

    const date =
        parseDate(value);

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
   FORMAT DATE
========================================================= */

function formatDate(value) {

    const date =
        parseDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(value) {

    if (!value) {
        return "—";
    }

    const string =
        String(value);

    const match =
        string.match(
            /^(\d{1,2}):(\d{2})/
        );

    if (!match) {
        return string;
    }

    let hour =
        Number(match[1]);

    const minute =
        match[2];

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${suffix}`;

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

function friendlyDatabaseError(error) {

    const message =
        String(
            error?.message ||
            ""
        );

    const lower =
        message.toLowerCase();

    if (
        lower.includes("relation") &&
        lower.includes("does not exist")
    ) {

        return (
            "The required Supabase table does not exist."
        );

    }

    if (
        lower.includes("row-level security") ||
        lower.includes("permission denied") ||
        lower.includes(
            "violates row-level security policy"
        )
    ) {

        return (
            "Supabase Row Level Security is blocking this operation."
        );

    }

    if (
        lower.includes("duplicate") ||
        lower.includes("unique constraint")
    ) {

        return (
            "This record already exists."
        );

    }

    if (
        lower.includes("foreign key")
    ) {

        return (
            "This record references data that does not exist."
        );

    }

    return (
        message ||
        "Database operation failed."
    );

}


/* =========================================================
   GLOBAL MESSAGE
========================================================= */

function showMessage(
    message,
    type = "info"
) {

    let container =
        document.querySelector(
            "#globalMessage"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.id =
            "globalMessage";

        container.setAttribute(
            "role",
            "status"
        );

        document.body.appendChild(
            container
        );

    }

    container.textContent =
        message;

    container.dataset.type =
        type;

    container.classList.add(
        "show"
    );

    clearTimeout(
        container._hideTimer
    );

    container._hideTimer =
        setTimeout(() => {

            container.classList.remove(
                "show"
            );

        }, 4000);

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = "info"
) {

    const element =
        getElement(
            "loginMessage"
        );

    if (!element) {

        showMessage(
            message,
            type
        );

        return;

    }

    element.textContent =
        message;

    element.dataset.type =
        type;

    element.classList.add(
        "show"
    );

}


/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(
    loading
) {

    const button =
        getElement(
            "loginButton"
        );

    if (!button) {
        return;
    }

    button.disabled =
        loading;

    if (!button.dataset.originalText) {

        button.dataset.originalText =
            button.textContent;

    }

    button.textContent =
        loading
            ? "Signing in..."
            : button.dataset.originalText;

}


/* =========================================================
   LOGIN SCREEN
========================================================= */

function showLoginScreen() {

    const login =
        getElement(
            "loginScreen"
        );

    const dashboard =
        getElement(
            "dashboard"
        );

    if (login) {

        login.hidden =
            false;

        login.style.display =
            "";

    }

    if (dashboard) {

        dashboard.hidden =
            true;

        dashboard.style.display =
            "none";

    }

}


/* =========================================================
   DASHBOARD SCREEN
========================================================= */

function showDashboard() {

    const login =
        getElement(
            "loginScreen"
        );

    const dashboard =
        getElement(
            "dashboard"
        );

    if (login) {

        login.hidden =
            true;

        login.style.display =
            "none";

    }

    if (dashboard) {

        dashboard.hidden =
            false;

        dashboard.style.display =
            "";

    }

}


/* =========================================================
   HIDE LOGIN
========================================================= */

function hideLoginScreen() {

    showDashboard();

}


/* =========================================================
   LOGIN SETUP
========================================================= */

function setupLogin() {

    const form =
        getElement(
            "loginForm"
        );

    if (!form) {

        console.warn(
            "Login form not found."
        );

        return;

    }

    form.addEventListener(
        "submit",
        handleLoginSubmit
    );

}


/* =========================================================
   LOGIN SUBMIT
========================================================= */

async function handleLoginSubmit(event) {

    event.preventDefault();

    if (RS_APP.signingIn) {
        return;
    }

    const emailInput =
        getElement(
            "email"
        );

    const passwordInput =
        getElement(
            "password"
        );

    const email =
        emailInput?.value
            ?.trim()
            .toLowerCase();

    const password =
        passwordInput?.value ||
        "";

    if (!email) {

        showLoginMessage(
            "Enter your email address.",
            "error"
        );

        emailInput?.focus();

        return;

    }

    if (!password) {

        showLoginMessage(
            "Enter your password.",
            "error"
        );

        passwordInput?.focus();

        return;

    }

    RS_APP.signingIn =
        true;

    setLoginLoading(true);

    showLoginMessage(
        "Signing in...",
        "info"
    );

    try {

        const supabase =
            getSupabase();

        const {
            data,
            error
        } =
            await supabase.auth.signInWithPassword({

                email,
                password

            });

        if (error) {
            throw error;
        }

        RS_APP.session =
            data?.session ||
            null;

        RS_APP.user =
            data?.user ||
            data?.session?.user ||
            null;

        RS_APP.authenticated =
            Boolean(
                RS_APP.session
            );

        if (!RS_APP.session) {

            throw new Error(
                "Login succeeded but no session was returned."
            );

        }

        showLoginMessage(
            "Login successful.",
            "success"
        );

        await enterDashboard();

    } catch (error) {

        console.error(
            "Login error:",
            error
        );

        showLoginMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    } finally {

        RS_APP.signingIn =
            false;

        setLoginLoading(false);

    }

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function setupPasswordToggle() {

    const buttons =
        allElements([
            "#togglePassword",
            "#passwordToggle",
            "[data-toggle-password]"
        ]);

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const password =
                    getElement(
                        "password"
                    );

                if (!password) {
                    return;
                }

                const visible =
                    password.type ===
                    "text";

                password.type =
                    visible
                        ? "password"
                        : "text";

                button.setAttribute(
                    "aria-label",
                    visible
                        ? "Show password"
                        : "Hide password"
                );

            }
        );

    });

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogoutButtons() {

    const buttons =
        allElements(
            RS_CONFIG.selectors.logout
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            handleLogout
        );

    });

}


/* =========================================================
   LOGOUT HANDLER
========================================================= */

async function handleLogout(event) {

    event?.preventDefault();

    try {

        const supabase =
            getSupabase();

        const {
            error
        } =
            await supabase.auth.signOut();

        if (error) {
            throw error;
        }

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

        return;

    }

    RS_APP.authenticated =
        false;

    RS_APP.session =
        null;

    RS_APP.user =
        null;

    RS_APP.orders =
        [];

    RS_APP.filteredOrders =
        [];

    RS_APP.contracts =
        [];

    RS_APP.gallery =
        [];

    showLoginScreen();

}


/* =========================================================
   AUTH LISTENER
========================================================= */

function setupAuthListener() {

    if (RS_APP.authSubscription) {
        return;
    }

    const supabase =
        getSupabase();

    const {
        data
    } =
        supabase.auth.onAuthStateChange(
            (
                event,
                session
            ) => {

                console.log(
                    "Supabase auth event:",
                    event
                );

                RS_APP.session =
                    session ||
                    null;

                RS_APP.user =
                    session?.user ||
                    null;

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    RS_APP.authenticated =
                        false;

                    showLoginScreen();

                    return;

                }

                /*
                 * Do not use INITIAL_SESSION
                 * to start the dashboard.
                 *
                 * initializeApplication()
                 * handles the initial session.
                 */

                if (
                    event ===
                    "SIGNED_IN"
                ) {

                    RS_APP.authenticated =
                        Boolean(session);

                    setTimeout(
                        () => {

                            enterDashboard();

                        },
                        0
                    );

                }

            }
        );

    RS_APP.authSubscription =
        data?.subscription ||
        null;

}


/* =========================================================
   CURRENT SESSION
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

    return (
        data?.session ||
        null
    );

}


/* =========================================================
   ENTER DASHBOARD
========================================================= */

async function enterDashboard() {

    if (RS_APP.dashboardLoading) {
        return;
    }

    RS_APP.dashboardLoading =
        true;

    try {

        if (!RS_APP.session) {

            RS_APP.session =
                await getCurrentSession();

            RS_APP.user =
                RS_APP.session?.user ||
                null;

        }

        if (!RS_APP.session) {

            RS_APP.authenticated =
                false;

            showLoginScreen();

            return;

        }

        RS_APP.authenticated =
            true;

        showDashboard();

        updateOwnerInformation();

        updateCurrentDate();

        initializeNavigation();

        await refreshAllData();

        setSessionStatus(
            "Active"
        );

    } catch (error) {

        console.error(
            "Dashboard entry error:",
            error
        );

        showMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    } finally {

        RS_APP.dashboardLoading =
            false;

        setLoginLoading(false);

    }

}


/* =========================================================
   OWNER INFORMATION
========================================================= */

function updateOwnerInformation() {

    const email =
        RS_APP.user?.email ||
        "Owner";

    allElements([
        "#ownerEmail",
        "#userEmail",
        "[data-owner-email]"
    ])
        .forEach(
            element => {

                element.textContent =
                    email;

            }
        );

    const name =
        RS_APP.user?.user_metadata
            ?.full_name ||
        RS_APP.user?.user_metadata
            ?.name ||
        "RS Photography";

    allElements([
        "#ownerName",
        "#userName",
        "[data-owner-name]"
    ])
        .forEach(
            element => {

                element.textContent =
                    name;

            }
        );

}


/* =========================================================
   SESSION STATUS
========================================================= */

function setSessionStatus(
    status
) {

    allElements([
        "#sessionStatus",
        "#connectionStatus",
        "[data-session-status]"
    ])
        .forEach(
            element => {

                element.textContent =
                    status;

                element.dataset.status =
                    status.toLowerCase();

            }
        );

}


/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

    const today =
        new Date();

    const formatted =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    allElements([
        "#currentDate",
        "#todayDate",
        "[data-current-date]"
    ])
        .forEach(
            element => {

                element.textContent =
                    formatted;

            }
        );

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const toggle =
        getElement(
            "sidebarToggle"
        );

    const sidebar =
        getElement(
            "sidebar"
        );

    if (!toggle || !sidebar) {
        return;
    }

    toggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            document.body.classList.toggle(
                "sidebar-open"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                window.innerWidth >
                900
            ) {

                return;

            }

            if (
                !sidebar.classList.contains(
                    "open"
                )
            ) {

                return;

            }

            if (
                sidebar.contains(
                    event.target
                ) ||
                toggle.contains(
                    event.target
                )
            ) {

                return;

            }

            sidebar.classList.remove(
                "open"
            );

            document.body.classList.remove(
                "sidebar-open"
            );

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const links =
        allElements([
            "[data-section]",
            "[data-page]",
            ".nav-link"
        ]);

    links.forEach(link => {

        if (
            link.dataset.navigationBound
        ) {

            return;

        }

        link.dataset.navigationBound =
            "true";

        link.addEventListener(
            "click",
            event => {

                const section =
                    link.dataset.section ||
                    link.dataset.page;

                if (!section) {
                    return;
                }

                event.preventDefault();

                showSection(
                    section
                );

                const sidebar =
                    getElement(
                        "sidebar"
                    );

                sidebar?.classList.remove(
                    "open"
                );

            }
        );

    });

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showSection(
    section
) {

    const normalized =
        String(section)
            .toLowerCase()
            .trim();

    const sections =
        document.querySelectorAll(
            "[data-section-content]"
        );

    sections.forEach(
        element => {

            const name =
                String(
                    element.dataset.sectionContent ||
                    ""
                )
                    .toLowerCase()
                    .trim();

            element.hidden =
                name !== normalized;

        }
    );


    const pages =
        document.querySelectorAll(
            ".dashboard-section, .page-section"
        );

    pages.forEach(
        element => {

            const id =
                String(
                    element.id ||
                    ""
                )
                    .toLowerCase()
                    .replace(
                        /section$/,
                        ""
                    );

            if (!id) {
                return;
            }

            element.hidden =
                id !== normalized;

        }
    );


    document
        .querySelectorAll(
            "[data-section], [data-page]"
        )
        .forEach(
            link => {

                const value =
                    String(
                        link.dataset.section ||
                        link.dataset.page ||
                        ""
                    )
                        .toLowerCase();

                link.classList.toggle(
                    "active",
                    value === normalized
                );

            }
        );

}


/* =========================================================
   ORDER FILTERS
========================================================= */

function setupOrderFilters() {

    const search =
        getElement(
            "orderSearch"
        );

    const status =
        getElement(
            "orderStatus"
        );

    if (search) {

        search.addEventListener(
            "input",
            () => {

                RS_APP.orderSearch =
                    search.value
                        .trim()
                        .toLowerCase();

                applyOrderFilters();

            }
        );

    }

    if (status) {

        status.addEventListener(
            "change",
            () => {

                RS_APP.orderFilter =
                    status.value ||
                    "all";

                applyOrderFilters();

            }
        );

    }


    allElements([
        "[data-order-filter]"
    ])
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        RS_APP.orderFilter =
                            button.dataset.orderFilter ||
                            "all";

                        allElements(
                            "[data-order-filter]"
                        )
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );

                                }
                            );

                        applyOrderFilters();

                    }
                );

            }
        );

}


/* =========================================================
   APPLY ORDER FILTERS
========================================================= */

function applyOrderFilters() {

    let orders =
        [...RS_APP.orders];

    const filter =
        String(
            RS_APP.orderFilter ||
            "all"
        )
            .toLowerCase();

    const search =
        RS_APP.orderSearch;

    if (
        filter !== "all"
    ) {

        orders =
            orders.filter(
                order => {

                    const status =
                        String(
                            order.status ||
                            ""
                        )
                            .toLowerCase();

                    return (
                        status ===
                        filter
                    );

                }
            );

    }


    if (search) {

        orders =
            orders.filter(
                order => {

                    const searchable = [

                        order.customer_name,

                        order.customerName,

                        order.name,

                        order.phone,

                        order.email,

                        order.location,

                        order.event_type,

                        order.function_type,

                        order.status,

                        order.notes

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return searchable.includes(
                        search
                    );

                }
            );

    }


    RS_APP.filteredOrders =
        orders;

    renderOrders(
        orders
    );

}


/* =========================================================
   NEW ORDER BUTTON
========================================================= */

function setupNewOrderButton() {

    const buttons =
        allElements(
            RS_CONFIG.selectors.newOrderButton
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openOrderModal();

                }
            );

        }
    );

}


/* =========================================================
   ORDER FORM
========================================================= */

function setupOrderForm() {

    const form =
        getElement(
            "orderForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        handleOrderSubmit
    );

}


/* =========================================================
   READ FORM FIELD
========================================================= */

function readField(
    form,
    names
) {

    if (!Array.isArray(names)) {
        names = [names];
    }

    for (const name of names) {

        const element =
            form.querySelector(
                `[name="${name}"]`
            );

        if (element) {

            return element.value?.trim() ||
                "";

        }

    }

    return "";

}


/* =========================================================
   ORDER FORM DATA
========================================================= */

function getOrderFormData(
    form
) {

    return {

        customer_name:
            readField(
                form,
                [
                    "customer_name",
                    "customerName",
                    "name"
                ]
            ),

        phone:
            readField(
                form,
                [
                    "phone",
                    "customer_phone",
                    "customerPhone"
                ]
            ),

        email:
            readField(
                form,
                [
                    "email",
                    "customer_email"
                ]
            ),

        location:
            readField(
                form,
                [
                    "location",
                    "event_location"
                ]
            ),

        event_type:
            readField(
                form,
                [
                    "event_type",
                    "function_type",
                    "eventType"
                ]
            ),

        booking_date:
            readField(
                form,
                [
                    "booking_date",
                    "date",
                    "event_date"
                ]
            ),

        booking_time:
            readField(
                form,
                [
                    "booking_time",
                    "time",
                    "event_time"
                ]
            ),

        expected_money:
            readField(
                form,
                [
                    "expected_money",
                    "amount",
                    "price",
                    "budget"
                ]
            ),

        status:
            readField(
                form,
                [
                    "status"
                ]
            ) || "pending",

        notes:
            readField(
                form,
                [
                    "notes",
                    "message",
                    "description"
                ]
            )

    };

}


/* =========================================================
   ORDER VALIDATION
========================================================= */

function validateOrder(
    order
) {

    if (!order.customer_name) {

        return "Customer name is required.";

    }

    if (!order.phone) {

        return "Customer phone number is required.";

    }

    if (!order.booking_date) {

        return "Booking date is required.";

    }

    if (!order.booking_time) {

        return "Booking time is required.";

    }


    if (
        isPastDateTime(
            order.booking_date,
            order.booking_time
        )
    ) {

        return (
            "Booking date and time must be in the future."
        );

    }


    return null;

}


/* =========================================================
   ORDER SUBMIT
========================================================= */

async function handleOrderSubmit(
    event
) {

    event.preventDefault();

    const form =
        event.currentTarget;

    const order =
        getOrderFormData(
            form
        );

    const validationError =
        validateOrder(
            order
        );

    if (validationError) {

        showMessage(
            validationError,
            "error"
        );

        return;

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );

    if (button) {
        button.disabled = true;
    }


    try {

        const supabase =
            getSupabase();

        let result;

        if (
            RS_APP.editingOrderId
        ) {

            result =
                await supabase
                    .from(
                        RS_CONFIG.tables.orders
                    )
                    .update(order)
                    .eq(
                        "id",
                        RS_APP.editingOrderId
                    )
                    .select()
                    .single();

        } else {

            result =
                await supabase
                    .from(
                        RS_CONFIG.tables.orders
                    )
                    .insert([
                        order
                    ])
                    .select()
                    .single();

        }


        if (result.error) {
            throw result.error;
        }


        showMessage(
            RS_APP.editingOrderId
                ? "Order updated successfully."
                : "Booking request submitted successfully.",
            "success"
        );


        closeOrderModal();

        await loadOrders();

        renderDashboardStats();

    } catch (error) {

        console.error(
            "Order save error:",
            error
        );

        showMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

    const supabase =
        getSupabase();

    const {
        data,
        error
    } =
        await supabase
            .from(
                RS_CONFIG.tables.orders
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
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

    applyOrderFilters();

    renderDashboardStats();

    return RS_APP.orders;

}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders(
    orders
) {

    const container =
        getElement(
            "ordersContainer"
        );

    if (!container) {
        return;
    }


    if (!orders.length) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📷</div>
                <h3>No bookings found</h3>
                <p>No orders match the current filter.</p>
            </div>
        `;

        return;

    }


    const rows =
        orders.map(
            order => {

                const id =
                    order.id;

                const customer =
                    order.customer_name ||
                    order.customerName ||
                    order.name ||
                    "Unknown customer";

                const date =
                    formatDate(
                        order.booking_date ||
                        order.event_date
                    );

                const time =
                    formatTime(
                        order.booking_time ||
                        order.event_time
                    );

                const status =
                    order.status ||
                    "pending";

                return `
                    <div
                        class="order-card"
                        data-order-id="${escapeHTML(id)}"
                    >

                        <div class="order-card-main">

                            <h3>
                                ${escapeHTML(customer)}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    order.event_type ||
                                    order.function_type ||
                                    "Photography"
                                )}
                            </p>

                            <p>
                                ${escapeHTML(date)}
                                ·
                                ${escapeHTML(time)}
                            </p>

                            <p>
                                ${escapeHTML(
                                    order.phone || "—"
                                )}
                            </p>

                        </div>

                        <div class="order-card-status">

                            <span
                                class="status-badge status-${escapeHTML(
                                    String(status).toLowerCase()
                                )}"
                            >
                                ${escapeHTML(status)}
                            </span>

                        </div>

                        <div class="order-card-actions">

                            <button
                                type="button"
                                data-action="view-order"
                                data-id="${escapeHTML(id)}"
                            >
                                View
                            </button>

                            <button
                                type="button"
                                data-action="edit-order"
                                data-id="${escapeHTML(id)}"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                data-action="delete-order"
                                data-id="${escapeHTML(id)}"
                            >
                                Delete
                            </button>

                        </div>

                    </div>
                `;

            }
        )
        .join("");


    container.innerHTML =
        rows;


    container
        .querySelectorAll(
            "[data-action='view-order']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        viewOrder(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-action='edit-order']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editOrder(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    container
        .querySelectorAll(
            "[data-action='delete-order']"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteOrder(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   FIND ORDER
========================================================= */

function findOrder(
    id
) {

    return RS_APP.orders.find(
        order =>
            String(order.id) ===
            String(id)
    ) || null;

}


/* =========================================================
   VIEW ORDER
========================================================= */

function viewOrder(
    id
) {

    const order =
        findOrder(id);

    if (!order) {

        showMessage(
            "Order could not be found.",
            "error"
        );

        return;

    }

    RS_APP.selectedOrder =
        order;

    let message = [

        `Customer: ${
            order.customer_name ||
            order.name ||
            "—"
        }`,

        `Phone: ${
            order.phone ||
            "—"
        }`,

        `Email: ${
            order.email ||
            "—"
        }`,

        `Event: ${
            order.event_type ||
            order.function_type ||
            "—"
        }`,

        `Date: ${
            formatDate(
                order.booking_date ||
                order.event_date
            )
        }`,

        `Time: ${
            formatTime(
                order.booking_time ||
                order.event_time
            )
        }`,

        `Location: ${
            order.location ||
            "—"
        }`,

        `Status: ${
            order.status ||
            "—"
        }`,

        `Amount: ${
            order.expected_money ||
            "—"
        }`,

        `Notes: ${
            order.notes ||
            "—"
        }`

    ].join("\n");

    showMessage(
        message,
        "info"
    );

}


/* =========================================================
   EDIT ORDER
========================================================= */

function editOrder(
    id
) {

    const order =
        findOrder(id);

    if (!order) {

        showMessage(
            "Order could not be found.",
            "error"
        );

        return;

    }

    const form =
        getElement(
            "orderForm"
        );

    if (!form) {
        return;
    }

    RS_APP.editingOrderId =
        order.id;


    const fields = {

        customer_name:
            order.customer_name,

        customerName:
            order.customer_name,

        name:
            order.customer_name,

        phone:
            order.phone,

        customer_phone:
            order.phone,

        email:
            order.email,

        customer_email:
            order.email,

        location:
            order.location,

        event_location:
            order.location,

        event_type:
            order.event_type ||
            order.function_type,

        function_type:
            order.event_type ||
            order.function_type,

        booking_date:
            order.booking_date ||
            order.event_date,

        event_date:
            order.booking_date ||
            order.event_date,

        booking_time:
            order.booking_time ||
            order.event_time,

        event_time:
            order.booking_time ||
            order.event_time,

        expected_money:
            order.expected_money,

        amount:
            order.expected_money,

        price:
            order.expected_money,

        budget:
            order.expected_money,

        status:
            order.status,

        notes:
            order.notes

    };


    Object.entries(
        fields
    )
        .forEach(
            ([name, value]) => {

                const input =
                    form.querySelector(
                        `[name="${name}"]`
                    );

                if (input) {
                    input.value =
                        value || "";
                }

            }
        );


    openOrderModal();

}


/* =========================================================
   DELETE ORDER
========================================================= */

async function deleteOrder(
    id
) {

    const order =
        findOrder(id);

    if (!order) {
        return;
    }


    const customer =
        order.customer_name ||
        order.name ||
        "this booking";


    const confirmed =
        window.confirm(
            `Delete booking for ${customer}?`
        );

    if (!confirmed) {
        return;
    }


    try {

        const supabase =
            getSupabase();

        const {
            error
        } =
            await supabase
                .from(
                    RS_CONFIG.tables.orders
                )
                .delete()
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }


        showMessage(
            "Booking deleted successfully.",
            "success"
        );

        await loadOrders();

    } catch (error) {

        console.error(
            "Order delete error:",
            error
        );

        showMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   ORDER MODAL
========================================================= */

function openOrderModal() {

    const modal =
        getElement(
            "orderModal"
        );

    if (!modal) {

        const form =
            getElement(
                "orderForm"
            );

        form?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return;

    }

    modal.hidden =
        false;

    modal.classList.add(
        "open",
        "active"
    );

}


function closeOrderModal() {

    const modal =
        getElement(
            "orderModal"
        );

    if (modal) {

        modal.hidden =
            true;

        modal.classList.remove(
            "open",
            "active"
        );

    }

    const form =
        getElement(
            "orderForm"
        );

    form?.reset();

    RS_APP.editingOrderId =
        null;

}


/* =========================================================
   CALENDAR CONTROLS
========================================================= */

function setupCalendarControls() {

    const previous =
        getElement(
            "previousMonth"
        );

    const next =
        getElement(
            "nextMonth"
        );

    const today =
        getElement(
            "todayButton"
        );


    previous?.addEventListener(
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


    next?.addEventListener(
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


    today?.addEventListener(
        "click",
        () => {

            const now =
                new Date();

            RS_APP.calendarDate =
                new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    1
                );

            RS_APP.selectedDate =
                dateToInputValue(
                    now
                );

            renderCalendar();

        }
    );

}


/* =========================================================
   RENDER CALENDAR
========================================================= */

function renderCalendar() {

    const calendar =
        getElement(
            "calendar"
        );

    if (!calendar) {
        return;
    }


    if (!RS_APP.calendarDate) {

        const today =
            new Date();

        RS_APP.calendarDate =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

    }


    const year =
        RS_APP.calendarDate.getFullYear();

    const month =
        RS_APP.calendarDate.getMonth();


    const monthName =
        RS_APP.calendarDate.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    setText(
        getElement(
            "calendarTitle"
        ),
        monthName
    );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    const previousDays =
        new Date(
            year,
            month,
            0
        ).getDate();


    let html = "";


    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    html += weekdays
        .map(
            day => `
                <div class="calendar-weekday">
                    ${day}
                </div>
            `
        )
        .join("");


    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        const day =
            previousDays - i;

        html += `
            <div class="calendar-day other-month">
                <span>${day}</span>
            </div>
        `;

    }


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

        const dateString =
            dateToInputValue(
                date
            );


        const today =
            isSameDate(
                date,
                new Date()
            );


        const selected =
            RS_APP.selectedDate ===
            dateString;


        const bookings =
            RS_APP.orders.filter(
                order => {

                    const bookingDate =
                        order.booking_date ||
                        order.event_date;

                    return (
                        String(
                            bookingDate ||
                            ""
                        )
                            .slice(0, 10) ===
                        dateString
                    );

                }
            );


        html += `
            <button
                type="button"
                class="calendar-day ${
                    today
                        ? "today"
                        : ""
                } ${
                    selected
                        ? "selected"
                        : ""
                } ${
                    bookings.length
                        ? "has-bookings"
                        : ""
                }"
                data-calendar-date="${dateString}"
            >

                <span class="calendar-day-number">
                    ${day}
                </span>

                ${
                    bookings.length
                        ? `
                            <span class="calendar-bookings">
                                ${bookings.length}
                            </span>
                        `
                        : ""
                }

            </button>
        `;

    }


    const totalCells =
        firstDay +
        daysInMonth;

    const remaining =
        Math.ceil(
            totalCells / 7
        ) * 7 -
        totalCells;


    for (
        let day = 1;
        day <= remaining;
        day++
    ) {

        html += `
            <div class="calendar-day other-month">
                <span>${day}</span>
            </div>
        `;

    }


    calendar.innerHTML =
        html;


    calendar
        .querySelectorAll(
            "[data-calendar-date]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const date =
                            button.dataset.calendarDate;

                        RS_APP.selectedDate =
                            date;

                        renderCalendar();

                        showBookingsForDate(
                            date
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SHOW BOOKINGS FOR DATE
========================================================= */

function showBookingsForDate(
    dateString
) {

    const bookings =
        RS_APP.orders.filter(
            order => {

                const date =
                    order.booking_date ||
                    order.event_date;

                return (
                    String(
                        date || ""
                    )
                        .slice(0, 10) ===
                    dateString
                );

            }
        );


    const container =
        firstElement([
            "#selectedDateBookings",
            "#calendarBookings",
            "[data-selected-date-bookings]"
        ]);


    if (!container) {
        return;
    }


    if (!bookings.length) {

        container.innerHTML = `
            <div class="empty-state">
                No bookings on ${escapeHTML(
                    formatDate(dateString)
                )}.
            </div>
        `;

        return;

    }


    container.innerHTML =
        bookings.map(
            order => `

                <div
                    class="calendar-booking"
                    data-order-id="${escapeHTML(order.id)}"
                >

                    <strong>
                        ${escapeHTML(
                            order.customer_name ||
                            order.name ||
                            "Customer"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            formatTime(
                                order.booking_time ||
                                order.event_time
                            )
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            order.event_type ||
                            order.function_type ||
                            "Photography"
                        )}
                    </span>

                </div>

            `
        )
        .join("");

}


/* =========================================================
   CONTRACT BUTTON
========================================================= */

function setupContractButton() {

    const buttons =
        allElements(
            RS_CONFIG.selectors.contractButton
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    openContractModal();

                }
            );

        }
    );

}


/* =========================================================
   CONTRACT FORM
========================================================= */

function setupContractForm() {

    const form =
        getElement(
            "contractForm"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        handleContractSubmit
    );

}


/* =========================================================
   CONTRACT DATA
========================================================= */

function getContractFormData(
    form
) {

    return {

        order_id:
            readField(
                form,
                [
                    "order_id",
                    "orderId"
                ]
            ) || null,

        customer_name:
            readField(
                form,
                [
                    "customer_name",
                    "customerName",
                    "name"
                ]
            ),

        contract_date:
            readField(
                form,
                [
                    "contract_date",
                    "date"
                ]
            ),

        status:
            readField(
                form,
                [
                    "status"
                ]
            ) || "draft",

        amount:
            readField(
                form,
                [
                    "amount",
                    "contract_amount"
                ]
            ),

        notes:
            readField(
                form,
                [
                    "notes",
                    "description"
                ]
            )

    };

}


/* =========================================================
   CONTRACT SUBMIT
========================================================= */

async function handleContractSubmit(
    event
) {

    event.preventDefault();

    const form =
        event.currentTarget;

    const contract =
        getContractFormData(
            form
        );


    if (!contract.customer_name) {

        showMessage(
            "Customer name is required.",
            "error"
        );

        return;

    }


    try {

        const supabase =
            getSupabase();

        let result;


        if (
            RS_APP.editingContractId
        ) {

            result =
                await supabase
                    .from(
                        RS_CONFIG.tables.contracts
                    )
                    .update(contract)
                    .eq(
                        "id",
                        RS_APP.editingContractId
                    )
                    .select()
                    .single();

        } else {

            result =
                await supabase
                    .from(
                        RS_CONFIG.tables.contracts
                    )
                    .insert([
                        contract
                    ])
                    .select()
                    .single();

        }


        if (result.error) {
            throw result.error;
        }


        showMessage(
            RS_APP.editingContractId
                ? "Contract updated successfully."
                : "Contract created successfully.",
            "success"
        );


        closeContractModal();

        await loadContracts();

    } catch (error) {

        console.error(
            "Contract save error:",
            error
        );

        showMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   LOAD CONTRACTS
========================================================= */

async function loadContracts() {

    const supabase =
        getSupabase();

    const {
        data,
        error
    } =
        await supabase
            .from(
                RS_CONFIG.tables.contracts
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Contracts load error:",
            error
        );

        /*
         * Do NOT silently convert a database
         * failure into an empty array.
         */
        throw error;

    }


    RS_APP.contracts =
        Array.isArray(data)
            ? data
            : [];


    renderContracts();


    return RS_APP.contracts;

}


/* =========================================================
   RENDER CONTRACTS
========================================================= */

function renderContracts() {

    const container =
        firstElement([
            "#contractsContainer",
            "#contractsList",
            "#contractsTableBody",
            "[data-contracts]"
        ]);

    if (!container) {
        return;
    }


    if (!RS_APP.contracts.length) {

        container.innerHTML = `
            <div class="empty-state">
                No contracts found.
            </div>
        `;

        return;

    }


    container.innerHTML =
        RS_APP.contracts
            .map(
                contract => `

                    <div
                        class="contract-card"
                        data-contract-id="${escapeHTML(
                            contract.id
                        )}"
                    >

                        <h3>
                            ${escapeHTML(
                                contract.customer_name ||
                                "Customer"
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                formatDate(
                                    contract.contract_date
                                )
                            )}
                        </p>

                        <span>
                            ${escapeHTML(
                                contract.status ||
                                "draft"
                            )}
                        </span>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   CONTRACT MODAL
========================================================= */

function openContractModal() {

    const modal =
        getElement(
            "contractModal"
        );

    if (!modal) {
        return;
    }

    modal.hidden =
        false;

    modal.classList.add(
        "open",
        "active"
    );

}


function closeContractModal() {

    const modal =
        getElement(
            "contractModal"
        );

    if (modal) {

        modal.hidden =
            true;

        modal.classList.remove(
            "open",
            "active"
        );

    }


    const form =
        getElement(
            "contractForm"
        );

    form?.reset();

    RS_APP.editingContractId =
        null;

}


/* =========================================================
   STUDIO SETTINGS
========================================================= */

function setupStudioSettings() {

    const form =
        firstElement([
            "#studioSettingsForm",
            "#settingsForm",
            "[data-studio-settings-form]"
        ]);

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        handleStudioSettingsSubmit
    );

}


/* =========================================================
   LOAD STUDIO SETTINGS
========================================================= */

async function loadStudioSettings() {

    const supabase =
        getSupabase();

    const {
        data,
        error
    } =
        await supabase
            .from(
                RS_CONFIG.tables.studio
            )
            .select("*")
            .limit(1);


    if (error) {

        console.warn(
            "Studio settings unavailable:",
            error
        );

        return null;

    }


    RS_APP.studio =
        data?.[0] ||
        null;


    populateStudioSettings();

    return RS_APP.studio;

}


/* =========================================================
   POPULATE STUDIO SETTINGS
========================================================= */

function populateStudioSettings() {

    const settings =
        RS_APP.studio;

    if (!settings) {
        return;
    }


    const form =
        firstElement([
            "#studioSettingsForm",
            "#settingsForm",
            "[data-studio-settings-form]"
        ]);

    if (!form) {
        return;
    }


    Object.entries(
        settings
    )
        .forEach(
            ([key, value]) => {

                const input =
                    form.querySelector(
                        `[name="${key}"]`
                    );

                if (input) {
                    input.value =
                        value ?? "";
                }

            }
        );

}


/* =========================================================
   SAVE STUDIO SETTINGS
========================================================= */

async function handleStudioSettingsSubmit(
    event
) {

    event.preventDefault();

    const form =
        event.currentTarget;

    const values = {};


    Array.from(
        form.elements
    )
        .forEach(
            element => {

                if (
                    !element.name ||
                    element.disabled
                ) {

                    return;

                }

                values[element.name] =
                    element.value;

            }
        );


    try {

        const supabase =
            getSupabase();


        let result;


        if (
            RS_APP.studio?.id
        ) {

            result =
                await supabase
                    .from(
                        RS_CONFIG.tables.studio
                    )
                    .update(values)
                    .eq(
                        "id",
                        RS_APP.studio.id
                    )
                    .select()
                    .single();

        } else {

            result =
                await supabase
                    .from(
                        RS_CONFIG.tables.studio
                    )
                    .insert([
                        values
                    ])
                    .select()
                    .single();

        }


        if (result.error) {
            throw result.error;
        }


        RS_APP.studio =
            result.data;

        showMessage(
            "Studio settings saved.",
            "success"
        );

    } catch (error) {

        console.error(
            "Studio settings error:",
            error
        );

        showMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   GALLERY
========================================================= */

function setupGalleryButton() {

    const buttons =
        allElements(
            RS_CONFIG.selectors.galleryButton
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showSection(
                        "gallery"
                    );

                }
            );

        }
    );

}


/* =========================================================
   LOAD GALLERY
========================================================= */

async function loadGallery() {

    const supabase =
        getSupabase();

    const {
        data,
        error
    } =
        await supabase
            .from(
                RS_CONFIG.tables.gallery
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.warn(
            "Gallery unavailable:",
            error
        );

        RS_APP.gallery =
            [];

        return [];

    }


    RS_APP.gallery =
        Array.isArray(data)
            ? data
            : [];


    renderGallery();


    return RS_APP.gallery;

}


/* =========================================================
   RENDER GALLERY
========================================================= */

function renderGallery() {

    const container =
        firstElement([
            "#galleryContainer",
            "#galleryGrid",
            "[data-gallery]"
        ]);

    if (!container) {
        return;
    }


    if (!RS_APP.gallery.length) {

        container.innerHTML = `
            <div class="empty-state">
                Gallery is empty.
            </div>
        `;

        return;

    }


    container.innerHTML =
        RS_APP.gallery
            .map(
                item => {

                    const url =
                        item.url ||
                        item.image_url ||
                        item.public_url ||
                        "";

                    const title =
                        item.title ||
                        item.name ||
                        "Photography";


                    if (!url) {

                        return `
                            <div class="gallery-item">
                                <div class="gallery-placeholder">
                                    ${escapeHTML(title)}
                                </div>
                            </div>
                        `;

                    }


                    return `
                        <div class="gallery-item">

                            <img
                                src="${escapeHTML(url)}"
                                alt="${escapeHTML(title)}"
                                loading="lazy"
                            >

                            <div class="gallery-caption">
                                ${escapeHTML(title)}
                            </div>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    const button =
        getElement(
            "notificationButton"
        );

    const container =
        getElement(
            "notificationContainer"
        );

    if (!button || !container) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            container.classList.toggle(
                "open"
            );

        }
    );


    document.addEventListener(
        "click",
        event => {

            if (
                container.contains(
                    event.target
                ) ||
                button.contains(
                    event.target
                )
            ) {

                return;

            }

            container.classList.remove(