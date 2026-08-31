/* =========================================================
   RS PHOTOGRAPHY
   OWNER STUDIO DASHBOARD
   script.js
   =========================================================

   RESPONSIBILITIES
   ----------------
   1. Authentication
   2. Session handling
   3. Dashboard navigation
   4. Orders
   5. Calendar
   6. Customers
   7. Contracts
   8. Gallery
   9. Messages
   10. Studio settings
   11. Modals
   12. Notifications
   13. Error handling

   IMPORTANT
   ----------
   Supabase client is created by supabase.js.

   Expected global:
       window.supabaseClient

   This file must NOT contain a service_role key.
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

    customers: [],

    contracts: [],

    gallery: [],

    messages: [],

    filteredOrders: [],

    currentOrder: null,

    currentContract: null,

    currentPage: "dashboard",

    selectedDate: null,

    calendarDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
    ),

    loading: false,

    listenersReady: false

};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector, parent = document) {

    try {

        return parent.querySelector(selector);

    } catch (error) {

        console.warn(
            "Invalid selector:",
            selector,
            error
        );

        return null;

    }

}


function $all(selector, parent = document) {

    try {

        return Array.from(
            parent.querySelectorAll(selector)
        );

    } catch (error) {

        console.warn(
            "Invalid selector:",
            selector,
            error
        );

        return [];

    }

}


/* =========================================================
   ELEMENT FINDER
   Supports IDs and common HTML naming variations.
========================================================= */

function findElement(...selectors) {

    for (const selector of selectors) {

        if (!selector) {
            continue;
        }

        const element = $(selector);

        if (element) {
            return element;
        }

    }

    return null;

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);

}


/* =========================================================
   VALUE HELPER
========================================================= */

function getValue(element) {

    if (!element) {
        return "";
    }

    return String(
        element.value ?? ""
    ).trim();

}


/* =========================================================
   SAFE HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   DATE -> INPUT VALUE
========================================================= */

function dateToInputValue(date) {

    if (!(date instanceof Date)) {
        return "";
    }

    if (Number.isNaN(date.getTime())) {
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

    return `${year}-${month}-${day}`;

}


/* =========================================================
   TODAY
========================================================= */

function startOfToday() {

    const now =
        new Date();

    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );

}


/* =========================================================
   DATE PARSER
========================================================= */

function parseDate(value) {

    if (!value) {
        return null;
    }

    if (value instanceof Date) {

        return Number.isNaN(
            value.getTime()
        )
            ? null
            : value;

    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


/* =========================================================
   SAME DATE
========================================================= */

function isSameDate(first, second) {

    if (
        !(first instanceof Date) ||
        !(second instanceof Date)
    ) {

        return false;

    }

    return (

        first.getFullYear() ===
        second.getFullYear()

        &&

        first.getMonth() ===
        second.getMonth()

        &&

        first.getDate() ===
        second.getDate()

    );

}


/* =========================================================
   DATE DISPLAY
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
   TIME DISPLAY
========================================================= */

function formatTime(value) {

    if (!value) {
        return "—";
    }

    const parts =
        String(value).split(":");

    if (parts.length < 2) {
        return String(value);
    }

    const hour =
        Number(parts[0]);

    const minute =
        parts[1];

    if (
        Number.isNaN(hour)
    ) {

        return String(value);

    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {

        return "₹0";

    }

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


/* =========================================================
   NOTIFICATION SYSTEM
========================================================= */

function showToast(
    message,
    type = "info"
) {

    const text =
        String(message || "").trim();

    if (!text) {
        return;
    }

    let container =
        findElement(
            "#toast-container",
            ".toast-container",
            "[data-toast-container]"
        );

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toast-container";

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.setAttribute(
        "role",
        "status"
    );

    toast.textContent =
        text;

    container.appendChild(
        toast
    );

    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });

    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3500);

}


/* =========================================================
   DATABASE ERROR MESSAGE
========================================================= */

function friendlyDatabaseError(error) {

    const message =
        String(
            error?.message ||
            error?.details ||
            ""
        );

    const lower =
        message.toLowerCase();

    if (
        lower.includes("relation") &&
        lower.includes("does not exist")
    ) {

        return "The required Supabase table does not exist.";

    }

    if (
        lower.includes("row-level security") ||
        lower.includes("violates row-level security")
    ) {

        return "Supabase Row Level Security blocked this operation.";

    }

    if (
        lower.includes("permission denied")
    ) {

        return "Supabase permissions blocked this operation.";

    }

    if (
        lower.includes("duplicate") ||
        lower.includes("unique constraint")
    ) {

        return "This record already exists.";

    }

    if (
        lower.includes("jwt")
    ) {

        return "Your login session is invalid or expired.";

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

    const client =
        window.supabaseClient;

    if (
        !client ||
        !client.auth ||
        !client.from
    ) {

        throw new Error(
            "Supabase client is unavailable."
        );

    }

    return client;

}


/* =========================================================
   LOGIN ELEMENTS
========================================================= */

function getLoginElements() {

    return {

        screen:
            findElement(
                "#login-screen",
                ".login-screen",
                "[data-login-screen]"
            ),

        form:
            findElement(
                "#login-form",
                ".login-form",
                "form[data-login-form]"
            ),

        email:
            findElement(
                "#login-email",
                "#owner-email",
                'input[type="email"]'
            ),

        password:
            findElement(
                "#login-password",
                "#owner-password",
                'input[type="password"]'
            ),

        button:
            findElement(
                "#login-button",
                "#sign-in-button",
                'button[type="submit"]'
            ),

        message:
            findElement(
                "#login-message",
                ".login-message",
                "[data-login-message]"
            )

    };

}


/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

function getDashboardElement() {

    return findElement(
        "#app",
        "#dashboard-app",
        ".dashboard-app",
        "[data-dashboard]"
    );

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = "error"
) {

    const elements =
        getLoginElements();

    if (!elements.message) {
        return;
    }

    elements.message.textContent =
        message || "";

    elements.message.className =
        `login-message ${type}`;

}


/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(
    loading
) {

    const elements =
        getLoginElements();

    if (!elements.button) {
        return;
    }

    elements.button.disabled =
        Boolean(loading);

    if (loading) {

        elements.button.dataset.originalText =
            elements.button.textContent;

        elements.button.textContent =
            "Signing in...";

    } else {

        elements.button.textContent =
            elements.button.dataset.originalText ||
            "Sign In";

    }

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginScreen() {

    const elements =
        getLoginElements();

    if (elements.screen) {

        elements.screen.hidden =
            false;

        elements.screen.style.display =
            "";

    }

    const dashboard =
        getDashboardElement();

    if (dashboard) {

        dashboard.hidden =
            true;

    }

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    const elements =
        getLoginElements();

    if (elements.screen) {

        elements.screen.hidden =
            true;

        elements.screen.style.display =
            "none";

    }

    const dashboard =
        getDashboardElement();

    if (dashboard) {

        dashboard.hidden =
            false;

        dashboard.style.display =
            "";

    }

}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function signIn(
    email,
    password
) {

    if (!email || !password) {

        throw new Error(
            "Enter both email and password."
        );

    }

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

    if (!data?.session) {

        throw new Error(
            "Login succeeded but no session was returned."
        );

    }

    return data;

}


/* =========================================================
   GET CURRENT SESSION
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

    return data?.session || null;

}


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

    if (RS_APP.listenersReady) {
        return;
    }

    const supabase =
        getSupabase();

    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Supabase auth event:",
                event
            );

            if (
                event ===
                "SIGNED_OUT"
            ) {

                RS_APP.session =
                    null;

                RS_APP.user =
                    null;

                RS_APP.authenticated =
                    false;

                showLoginScreen();

                return;

            }

            if (
                session &&
                (
                    event === "SIGNED_IN" ||
                    event === "INITIAL_SESSION" ||
                    event === "TOKEN_REFRESHED"
                )
            ) {

                RS_APP.session =
                    session;

                RS_APP.user =
                    session.user;

                RS_APP.authenticated =
                    true;

                updateAuthenticatedUser();

            }

        }
    );

    RS_APP.listenersReady =
        true;

}


/* =========================================================
   UPDATE USER INFORMATION
========================================================= */

function updateAuthenticatedUser() {

    const email =
        RS_APP.user?.email ||
        "Owner";

    $all(
        "[data-owner-email], .owner-email, #account-email"
    )
        .forEach(
            element =>
                setText(
                    element,
                    email
                )
        );

    $all(
        "[data-owner-name], .owner-name"
    )
        .forEach(
            element =>
                setText(
                    element,
                    "Owner"
                )
        );

}


/* =========================================================
   LOGIN SETUP
========================================================= */

function setupLogin() {

    const elements =
        getLoginElements();

    if (!elements.form) {
        return;
    }

    elements.form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (
                RS_APP.loading
            ) {
                return;
            }

            const email =
                getValue(elements.email);

            const password =
                getValue(elements.password);

            if (!email || !password) {

                showLoginMessage(
                    "Please enter your email and password.",
                    "error"
                );

                return;

            }

            RS_APP.loading =
                true;

            setLoginLoading(
                true
            );

            showLoginMessage(
                "",
                "info"
            );

            try {

                const result =
                    await signIn(
                        email,
                        password
                    );

                RS_APP.session =
                    result.session;

                RS_APP.user =
                    result.user;

                RS_APP.authenticated =
                    true;

                await enterDashboard();

            } catch (error) {

                console.error(
                    "Login failed:",
                    error
                );

                showLoginMessage(
                    friendlyDatabaseError(
                        error
                    ),
                    "error"
                );

            } finally {

                RS_APP.loading =
                    false;

                setLoginLoading(
                    false
                );

            }

        }
    );

}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function setupPasswordToggle() {

    const password =
        findElement(
            "#login-password",
            "#owner-password"
        );

    const toggle =
        findElement(
            "#toggle-password",
            "[data-toggle-password]",
            ".password-toggle"
        );

    if (
        !password ||
        !toggle
    ) {

        return;

    }

    toggle.addEventListener(
        "click",
        () => {

            const visible =
                password.type ===
                "text";

            password.type =
                visible
                    ? "password"
                    : "text";

            toggle.setAttribute(
                "aria-label",
                visible
                    ? "Show password"
                    : "Hide password"
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

async function logout() {

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
            "Logout failed:",
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
   LOGOUT BUTTONS
========================================================= */

function setupLogoutButtons() {

    $all(
        "#logout-button, #sign-out-button, [data-action='logout']"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        await logout();

                    }
                );

            }
        );

}


/* =========================================================
   ENTER DASHBOARD
========================================================= */

async function enterDashboard() {

    if (
        !RS_APP.authenticated
    ) {

        showLoginScreen();

        return;

    }

    showDashboard();

    updateAuthenticatedUser();

    updateCurrentDate();

    await loadDashboardData();

}


/* =========================================================
   DASHBOARD DATA
========================================================= */

async function loadDashboardData() {

    try {

        await loadOrders();

    } catch (error) {

        console.error(
            "Dashboard data load failed:",
            error
        );

        showToast(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

    renderDashboard();

    renderOrders();

    renderCalendar();

    renderCustomers();

    renderContracts();

    renderGallery();

}


/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

    const today =
        new Date();

    const text =
        today.toLocaleDateString(
            "en-IN",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    $all(
        "[data-current-date], #current-date, .current-date"
    )
        .forEach(
            element =>
                setText(
                    element,
                    text
                )
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

    try {

        setupLogin();

        setupPasswordToggle();

        setupLogoutButtons();

        setupNavigation();

        setupGlobalButtons();

        setupModalSystem();

        updateCurrentDate();

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

        /*
         * Wait briefly for supabase.js.
         */

        let attempts =
            0;

        while (
            !window.supabaseClient &&
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

        if (
            !window.supabaseClient
        ) {

            throw new Error(
                "Supabase client unavailable. Check supabase.js."
            );

        }

        setupAuthListener();

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

        console.log(
            "RS Photography Owner Dashboard initialized."
        );

    } catch (error) {

        console.error(
            "Application initialization failed:",
            error
        );

        showLoginScreen();

        showLoginMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   START APPLICATION
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