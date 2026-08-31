/* =========================================================
   RS PHOTOGRAPHY
   OWNER STUDIO DASHBOARD
   COMPLETE script.js
   =========================================================

   REQUIRED:
   ----------
   supabase.js must load BEFORE this file.

   supabase.js must expose:

       window.supabaseClient

   MAIN DATABASE TABLE:
   --------------------
       public.orders

   EXPECTED orders columns:
   ------------------------
       id
       customer_name
       phone
       location
       event_type
       booking_date
       booking_time
       expected_amount
       status
       notes
       created_at

   IMPORTANT:
   ----------
   Do NOT put Supabase service_role key here.
   Browser code must use the normal publishable/anon key.
========================================================= */

"use strict";


/* =========================================================
   APPLICATION STATE
========================================================= */

const RS_APP = {

    initialized: false,

    authenticated: false,

    session: null,

    user: null,

    orders: [],

    filteredOrders: [],

    customers: [],

    contracts: [],

    gallery: [],

    messages: [],

    currentOrder: null,

    currentContract: null,

    currentPage: "dashboard",

    selectedDate: null,

    calendarDate: new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
    ),

    orderSearch: "",

    orderStatus: "",

    customerSearch: "",

    busy: false,

    authSubscription: null

};


/* =========================================================
   DATABASE CONFIGURATION
========================================================= */

const RS_DB = {

    ordersTable: "orders",

    contractsTable: "contracts",

    galleryTable: "gallery",

    messagesTable: "messages",

    settingsTable: "studio_settings"

};


/* =========================================================
   DOM HELPERS
========================================================= */

function $(selector, parent = document) {

    try {

        return parent.querySelector(selector);

    } catch (error) {

        console.error(
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

        console.error(
            "Invalid selector:",
            selector,
            error
        );

        return [];

    }

}


/* =========================================================
   MULTIPLE SELECTOR FINDER
========================================================= */

function firstElement(...selectors) {

    for (
        const selector of selectors
    ) {

        if (!selector) {
            continue;
        }

        const element =
            $(selector);

        if (element) {
            return element;
        }

    }

    return null;

}


/* =========================================================
   TEXT
========================================================= */

function setText(
    element,
    value
) {

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
   VALUE
========================================================= */

function valueOf(element) {

    if (!element) {
        return "";
    }

    return String(
        element.value ?? ""
    ).trim();

}


/* =========================================================
   HTML ESCAPE
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
   SUPABASE
========================================================= */

function getSupabase() {

    const client =
        window.supabaseClient;

    if (
        !client ||
        !client.auth ||
        typeof client.from !== "function"
    ) {

        throw new Error(
            "Supabase client is not available. Check supabase.js."
        );

    }

    return client;

}


/* =========================================================
   ERROR HANDLING
========================================================= */

function friendlyDatabaseError(error) {

    const message =
        String(
            error?.message ||
            error?.details ||
            error?.hint ||
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
        lower.includes(
            "violates row-level security policy"
        )
    ) {

        return "Supabase RLS is blocking this operation.";

    }

    if (
        lower.includes(
            "row-level security"
        )
    ) {

        return "Supabase Row Level Security is blocking this operation.";

    }

    if (
        lower.includes(
            "permission denied"
        )
    ) {

        return "Supabase permissions denied this operation.";

    }

    if (
        lower.includes("duplicate") ||
        lower.includes("unique constraint")
    ) {

        return "This record already exists.";

    }

    if (
        lower.includes("invalid login credentials")
    ) {

        return "Incorrect email or password.";

    }

    if (
        lower.includes("jwt")
    ) {

        return "Your login session has expired.";

    }

    if (
        lower.includes("failed to fetch")
    ) {

        return "Could not connect to Supabase.";

    }

    return (
        message ||
        "Database operation failed."
    );

}


/* =========================================================
   TOAST SYSTEM
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
        firstElement(
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

        Object.assign(
            container.style,
            {
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: "99999",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                maxWidth: "min(380px, 90vw)"
            }
        );

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement("div");

    toast.className =
        `rs-toast rs-toast-${type}`;

    Object.assign(
        toast.style,
        {
            padding: "13px 16px",
            borderRadius: "12px",
            background: "#171717",
            color: "#fff",
            boxShadow: "0 12px 30px rgba(0,0,0,.22)",
            fontSize: "14px",
            lineHeight: "1.4",
            opacity: "0",
            transform: "translateY(-8px)",
            transition: "all .25s ease"
        }
    );

    toast.textContent =
        text;

    container.appendChild(
        toast
    );

    requestAnimationFrame(
        () => {

            toast.style.opacity =
                "1";

            toast.style.transform =
                "translateY(0)";

        }
    );

    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(-8px)";

            setTimeout(
                () => toast.remove(),
                300
            );

        },
        3500
    );

}


/* =========================================================
   DATE PARSER
========================================================= */

function parseDate(value) {

    if (!value) {
        return null;
    }

    if (
        value instanceof Date
    ) {

        return Number.isNaN(
            value.getTime()
        )
            ? null
            : value;

    }

    const date =
        new Date(value);

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
   DATE -> YYYY-MM-DD
========================================================= */

function dateToInputValue(date) {

    if (
        !(date instanceof Date) ||
        Number.isNaN(date.getTime())
    ) {

        return "";

    }

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(2, "0"),

        String(
            date.getDate()
        ).padStart(2, "0")

    ].join("-");

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
   SAME DATE
========================================================= */

function isSameDate(
    first,
    second
) {

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

    const text =
        String(value);

    const parts =
        text.split(":");

    if (
        parts.length < 2
    ) {

        return text;

    }

    const hour =
        Number(parts[0]);

    const minute =
        parts[1];

    if (
        Number.isNaN(hour)
    ) {

        return text;

    }

    const suffix =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return (
        `${displayHour}:${minute} ${suffix}`
    );

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
   PAST DATE/TIME
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
   LOGIN ELEMENTS
========================================================= */

function getLoginElements() {

    return {

        screen:
            firstElement(
                "#login-screen",
                ".login-screen",
                "[data-login-screen]"
            ),

        form:
            firstElement(
                "#login-form",
                ".login-form",
                "[data-login-form]"
            ),

        email:
            firstElement(
                "#login-email",
                "#owner-email",
                'input[type="email"]'
            ),

        password:
            firstElement(
                "#login-password",
                "#owner-password",
                'input[type="password"]'
            ),

        submit:
            firstElement(
                "#login-button",
                "#sign-in-button",
                "#login-form button[type='submit']",
                ".login-form button[type='submit']"
            ),

        message:
            firstElement(
                "#login-message",
                ".login-message",
                "[data-login-message]"
            )

    };

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLoginScreen() {

    const login =
        getLoginElements();

    if (login.screen) {

        login.screen.hidden =
            false;

        login.screen.style.display =
            "";

    }

    const app =
        firstElement(
            "#app",
            "#dashboard-app",
            ".dashboard-app",
            "[data-dashboard]"
        );

    if (app) {

        app.hidden =
            true;

    }

}


/* =========================================================
   SHOW DASHBOARD
========================================================= */

function showDashboard() {

    const login =
        getLoginElements();

    if (login.screen) {

        login.screen.hidden =
            true;

        login.screen.style.display =
            "none";

    }

    const app =
        firstElement(
            "#app",
            "#dashboard-app",
            ".dashboard-app",
            "[data-dashboard]"
        );

    if (app) {

        app.hidden =
            false;

        app.style.display =
            "";

    }

}


/* =========================================================
   LOGIN MESSAGE
========================================================= */

function showLoginMessage(
    message,
    type = "error"
) {

    const login =
        getLoginElements();

    if (!login.message) {
        return;
    }

    login.message.textContent =
        message || "";

    login.message.className =
        `login-message ${type}`;

}


/* =========================================================
   LOGIN BUTTON STATE
========================================================= */

function setLoginLoading(
    loading
) {

    const login =
        getLoginElements();

    if (!login.submit) {
        return;
    }

    login.submit.disabled =
        Boolean(loading);

    if (loading) {

        if (
            !login.submit.dataset.originalText
        ) {

            login.submit.dataset.originalText =
                login.submit.textContent;

        }

        login.submit.textContent =
            "Signing in...";

    } else {

        login.submit.textContent =
            login.submit.dataset.originalText ||
            "Sign In";

    }

}


/* =========================================================
   SIGN IN
========================================================= */

async function signIn(
    email,
    password
) {

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

    return data;

}


/* =========================================================
   GET SESSION
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
   LOGIN SETUP
========================================================= */

function setupLogin() {

    const login =
        getLoginElements();

    if (!login.form) {

        console.warn(
            "Login form not found."
        );

        return;

    }

    login.form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (
                RS_APP.busy
            ) {

                return;

            }

            const email =
                valueOf(login.email);

            const password =
                valueOf(login.password);

            if (!email) {

                showLoginMessage(
                    "Enter your email address.",
                    "error"
                );

                login.email?.focus();

                return;

            }

            if (!password) {

                showLoginMessage(
                    "Enter your password.",
                    "error"
                );

                login.password?.focus();

                return;

            }

            RS_APP.busy =
                true;

            setLoginLoading(
                true
            );

            showLoginMessage(
                "",
                "info"
            );

            try {

                const data =
                    await signIn(
                        email,
                        password
                    );

                RS_APP.session =
                    data?.session ||
                    null;

                RS_APP.user =
                    data?.user ||
                    null;

                RS_APP.authenticated =
                    Boolean(
                        RS_APP.session
                    );

                if (
                    !RS_APP.authenticated
                ) {

                    throw new Error(
                        "Login succeeded but no session was returned."
                    );

                }

                showToast(
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

                RS_APP.busy =
                    false;

                setLoginLoading(
                    false
                );

            }

        }
    );

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function setupPasswordToggle() {

    const password =
        firstElement(
            "#login-password",
            "#owner-password"
        );

    const toggle =
        firstElement(
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
        event => {

            event.preventDefault();

            const visible =
                password.type ===
                "text";

            password.type =
                visible
                    ? "password"
                    : "text";

            toggle.textContent =
                visible
                    ? "Show"
                    : "Hide";

        }
    );

}


/* =========================================================
   AUTH LISTENER
========================================================= */

function setupAuthListener() {

    if (
        RS_APP.authSubscription
    ) {

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
                    "Auth event:",
                    event
                );

                if (
                    session
                ) {

                    RS_APP.session =
                        session;

                    RS_APP.user =
                        session.user;

                    RS_APP.authenticated =
                        true;

                    updateOwnerUI();

                }

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

                    RS_APP.orders =
                        [];

                    RS_APP.filteredOrders =
                        [];

                    showLoginScreen();

                }

            }
        );

    RS_APP.authSubscription =
        data?.subscription ||
        null;

}


/* =========================================================
   UPDATE OWNER UI
========================================================= */

function updateOwnerUI() {

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

        showToast(
            "Signed out.",
            "success"
        );

    } catch (error) {

        console.error(
            "Logout error:",
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

    const buttons =
        $all(
            "#logout-button, #sign-out-button, [data-action='logout']"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logout();

                }
            );

        }
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const links =
        $all(
            "[data-page], [data-section], .nav-link, .sidebar-link"
        );

    links.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    const page =
                        link.dataset.page ||
                        link.dataset.section;

                    if (!page) {
                        return;
                    }

                    event.preventDefault();

                    navigateTo(
                        page
                    );

                }
            );

        }
    );

}


/* =========================================================
   NAVIGATE
========================================================= */

function navigateTo(
    page
) {

    if (!page) {
        return;
    }

    RS_APP.currentPage =
        page;

    $all(
        "[data-page-content], [data-section-content]"
    )
        .forEach(
            section => {

                const sectionPage =
                    section.dataset.pageContent ||
                    section.dataset.sectionContent;

                section.hidden =
                    sectionPage !== page;

            }
        );

    $all(
        "[data-page], [data-section], .nav-link, .sidebar-link"
    )
        .forEach(
            link => {

                const linkPage =
                    link.dataset.page ||
                    link.dataset.section;

                link.classList.toggle(
                    "active",
                    linkPage === page
                );

            }
        );

    if (
        page === "orders"
    ) {

        renderOrders();

    }

    if (
        page === "calendar"
    ) {

        renderCalendar();

    }

    if (
        page === "customers"
    ) {

        renderCustomers();

    }

    if (
        page === "contracts"
    ) {

        renderContracts();

    }

    if (
        page === "gallery"
    ) {

        renderGallery();

    }

}


/* =========================================================
   CURRENT DATE
========================================================= */

function updateCurrentDate() {

    const now =
        new Date();

    const text =
        now.toLocaleDateString(
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
                RS_DB.ordersTable
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        throw error;
    }

    RS_APP.orders =
        Array.isArray(data)
            ? data
            : [];

    applyOrderFilters();

    return RS_APP.orders;

}


/* =========================================================
   ORDER SEARCH + FILTER
========================================================= */

function applyOrderFilters() {

    const search =
        RS_APP.orderSearch
            .toLowerCase()
            .trim();

    const status =
        RS_APP.orderStatus
            .toLowerCase()
            .trim();

    RS_APP.filteredOrders =
        RS_APP.orders.filter(
            order => {

                const searchable = [

                    order.customer_name,

                    order.name,

                    order.phone,

                    order.location,

                    order.event_type,

                    order.status

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                const searchMatch =
                    !search ||
                    searchable.includes(
                        search
                    );

                const statusMatch =
                    !status ||
                    String(
                        order.status || ""
                    ).toLowerCase() ===
                    status;

                return (
                    searchMatch &&
                    statusMatch
                );

            }
        );

}


/* =========================================================
   ORDER FILTER SETUP
========================================================= */

function setupOrderFilters() {

    const search =
        firstElement(
            "#order-search",
            "#orders-search",
            "[data-order-search]",
            "input[placeholder*='Search customers']"
        );

    const status =
        firstElement(
            "#order-status-filter",
            "#status-filter",
            "[data-order-status-filter]"
        );

    if (search) {

        search.addEventListener(
            "input",
            () => {

                RS_APP.orderSearch =
                    valueOf(search);

                applyOrderFilters();

                renderOrders();

            }
        );

    }

    if (status) {

        status.addEventListener(
            "change",
            () => {

                RS_APP.orderStatus =
                    valueOf(status);

                applyOrderFilters();

                renderOrders();

            }
        );

    }

}


/* =========================================================
   ORDER FORM ELEMENTS
========================================================= */

function getOrderFormElements() {

    const form =
        firstElement(
            "#order-form",
            "#new-order-form",
            "[data-order-form]"
        );

    if (!form) {

        return {
            form: null
        };

    }

    return {

        form,

        name:
            firstElement(
                "#order-customer-name",
                "#customer-name",
                "[name='customer_name']",
                "[name='name']",
                "input[placeholder*='Customer']",
                form
            ),

        phone:
            firstElement(
                "#order-phone",
                "#customer-phone",
                "[name='phone']",
                "input[type='tel']",
                form
            ),

        location:
            firstElement(
                "#order-location",
                "#customer-location",
                "[name='location']",
                form
            ),

        event:
            firstElement(
                "#order-event-type",
                "#event-type",
                "[name='event_type']",
                form
            ),

        date:
            firstElement(
                "#order-date",
                "#booking-date",
                "[name='booking_date']",
                "input[type='date']",
                form
            ),

        time:
            firstElement(
                "#order-time",
                "#booking-time",
                "[name='booking_time']",
                "input[type='time']",
                form
            ),

        amount:
            firstElement(
                "#order-amount",
                "#expected-amount",
                "[name='expected_amount']",
                "[name='amount']",
                form
            ),

        status:
            firstElement(
                "#order-status",
                "[name='status']",
                "select",
                form
            ),

        notes:
            firstElement(
                "#order-notes",
                "[name='notes']",
                "textarea",
                form
            )

    };

}


/* =========================================================
   OPEN NEW ORDER
========================================================= */

function openNewOrder() {

    RS_APP.currentOrder =
        null;

    const elements =
        getOrderFormElements();

    if (
        !elements.form
    ) {

        showToast(
            "New Order form was not found in HTML.",
            "error"
        );

        return;

    }

    elements.form.reset();

    if (elements.status) {

        elements.status.value =
            "pending";

    }

    if (elements.date) {

        elements.date.min =
            dateToInputValue(
                startOfToday()
            );

    }

    openModalByNames(
        "#order-modal",
        "#new-order-modal",
        ".order-modal",
        "[data-modal='order']"
    );

}


/* =========================================================
   CLOSE ORDER MODAL
========================================================= */

function closeOrderModal() {

    closeModalByNames(
        "#order-modal",
        "#new-order-modal",
        ".order-modal",
        "[data-modal='order']"
    );

    RS_APP.currentOrder =
        null;

}


/* =========================================================
   NEW ORDER BUTTON
========================================================= */

function setupNewOrderButton() {

    $all(
        "#new-order-button, #new-order-btn, [data-action='new-order']"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        openNewOrder();

                    }
                );

            }
        );

}


/* =========================================================
   ORDER FORM SETUP
========================================================= */

function setupOrderForm() {

    const elements =
        getOrderFormElements();

    if (
        !elements.form
    ) {

        console.warn(
            "Order form not found."
        );

        return;

    }

    elements.form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            if (
                RS_APP.busy
            ) {

                return;

            }

            try {

                RS_APP.busy =
                    true;

                await saveOrder();

            } catch (error) {

                console.error(
                    "Save order error:",
                    error
                );

                showToast(
                    friendlyDatabaseError(
                        error
                    ),
                    "error"
                );

            } finally {

                RS_APP.busy =
                    false;

            }

        }
    );

}


/* =========================================================
   SAVE ORDER
========================================================= */

async function saveOrder() {

    const elements =
        getOrderFormElements();

    if (
        !elements.form
    ) {

        throw new Error(
            "Order form not found."
        );

    }

    const customerName =
        valueOf(elements.name);

    const phone =
        valueOf(elements.phone);

    const location =
        valueOf(elements.location);

    const eventType =
        valueOf(elements.event);

    const bookingDate =
        valueOf(elements.date);

    const bookingTime =
        valueOf(elements.time);

    const amount =
        valueOf(elements.amount);

    const status =
        valueOf(elements.status) ||
        "pending";

    const notes =
        valueOf(elements.notes);

    if (!customerName) {

        throw new Error(
            "Customer name is required."
        );

    }

    if (!phone) {

        throw new Error(
            "Phone number is required."
        );

    }

    if (!bookingDate) {

        throw new Error(
            "Booking date is required."
        );

    }

    if (
        bookingTime &&
        isPastDateTime(
            bookingDate,
            bookingTime
        )
    ) {

        throw new Error(
            "Booking date and time must be in the future."
        );

    }

    const payload = {

        customer_name:
            customerName,

        phone:
            phone,

        location:
            location || null,

        event_type:
            eventType || null,

        booking_date:
            bookingDate,

        booking_time:
            bookingTime || null,

        expected_amount:
            amount
                ? Number(amount)
                : 0,

        status:
            status,

        notes:
            notes || null

    };

    const supabase =
        getSupabase();

    let query;

    if (
        RS_APP.currentOrder?.id
    ) {

        query =
            supabase
                .from(
                    RS_DB.ordersTable
                )
                .update(
                    payload
                )
                .eq(
                    "id",
                    RS_APP.currentOrder.id
                );

    } else {

        query =
            supabase
                .from(
                    RS_DB.ordersTable
                )
                .insert(
                    payload
                );

    }

    const {
        error
    } =
        await query;

    if (error) {
        throw error;
    }

    showToast(
        RS_APP.currentOrder
            ? "Order updated successfully."
            : "Order created successfully.",
        "success"
    );

    closeOrderModal();

    await loadOrders();

    renderAll();

}


/* =========================================================
   EDIT ORDER
========================================================= */

function editOrder(id) {

    const order =
        RS_APP.orders.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!order) {

        showToast(
            "Order not found.",
            "error"
        );

        return;

    }

    RS_APP.currentOrder =
        order;

    const elements =
        getOrderFormElements();

    if (
        !elements.form
    ) {

        return;

    }

    if (elements.name) {

        elements.name.value =
            order.customer_name ||
            order.name ||
            "";

    }

    if (elements.phone) {

        elements.phone.value =
            order.phone ||
            "";

    }

    if (elements.location) {

        elements.location.value =
            order.location ||
            "";

    }

    if (elements.event) {

        elements.event.value =
            order.event_type ||
            "";

    }

    if (elements.date) {

        elements.date.value =
            order.booking_date ||
            "";

    }

    if (elements.time) {

        elements.time.value =
            order.booking_time ||
            "";

    }

    if (elements.amount) {

        elements.amount.value =
            order.expected_amount ??
            order.amount ??
            "";

    }

    if (elements.status) {

        elements.status.value =
            order.status ||
            "pending";

    }

    if (elements.notes) {

        elements.notes.value =
            order.notes ||
            "";

    }

    openModalByNames(
        "#order-modal",
        "#new-order-modal",
        ".order-modal",
        "[data-modal='order']"
    );

}


/* =========================================================
   DELETE ORDER
========================================================= */

async function deleteOrder(id) {

    const order =
        RS_APP.orders.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!order) {
        return;
    }

    const confirmed =
        window.confirm(
            `Delete booking for ${order.customer_name || "this customer"}?`
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
                    RS_DB.ordersTable
                )
                .delete()
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }

        showToast(
            "Order deleted.",
            "success"
        );

        await loadOrders();

        renderAll();

    } catch (error) {

        console.error(
            "Delete order error:",
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
   ORDER STATUS
========================================================= */

async function updateOrderStatus(
    id,
    status
) {

    try {

        const supabase =
            getSupabase();

        const {
            error
        } =
            await supabase
                .from(
                    RS_DB.ordersTable
                )
                .update({
                    status
                })
                .eq(
                    "id",
                    id
                );

        if (error) {
            throw error;
        }

        const order =
            RS_APP.orders.find(
                item =>
                    String(item.id) ===
                    String(id)
            );

        if (order) {

            order.status =
                status;

        }

        applyOrderFilters();

        renderAll();

        showToast(
            "Order status updated.",
            "success"
        );

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
   ORDER TABLE
========================================================= */

function getOrderContainer() {

    return firstElement(
        "#orders-list",
        "#orders-table-body",
        "tbody[data-orders]",
        "[data-orders-list]",
        ".orders-list"
    );

}


/* =========================================================
   RENDER ORDERS
========================================================= */

function renderOrders() {

    applyOrderFilters();

    const container =
        getOrderContainer();

    if (!container) {
        return;
    }

    if (
        RS_APP.filteredOrders.length ===
        0
    ) {

        container.innerHTML = `

            <tr class="empty-row">
                <td colspan="7">
                    No orders found.
                </td>
            </tr>

        `;

        if (
            !container.matches("tbody")
        ) {

            container.innerHTML = `
                <div class="empty-state">
                    <strong>No orders found.</strong>
                    <p>Customer bookings will appear here automatically.</p>
                </div>
            `;

        }

        return;

    }

    const rows =
        RS_APP.filteredOrders
            .map(
                order =>
                    createOrderHTML(
                        order
                    )
            )
            .join("");

    container.innerHTML =
        rows;

    bindOrderActions(
        container
    );

}


/* =========================================================
   CREATE ORDER HTML
========================================================= */

function createOrderHTML(
    order
) {

    const id =
        escapeHTML(
            order.id
        );

    const customer =
        escapeHTML(
            order.customer_name ||
            order.name ||
            "Unknown"
        );

    const phone =
        escapeHTML(
            order.phone ||
            "—"
        );

    const event =
        escapeHTML(
            order.event_type ||
            "—"
        );

    const date =
        escapeHTML(
            formatDate(
                order.booking_date
            )
        );

    const time =
        escapeHTML(
            formatTime(
                order.booking_time
            )
        );

    const location =
        escapeHTML(
            order.location ||
            "—"
        );

    const status =
        String(
            order.status ||
            "pending"
        ).toLowerCase();

    const amount =
        formatCurrency(
            order.expected_amount ??
            order.amount ??
            0
        );

    return `

        <tr
            data-order-id="${id}"
        >

            <td>
                <strong>
                    ${customer}
                </strong>
                <small>
                    ${phone}
                </small>
            </td>

            <td>
                ${event}
            </td>

            <td>
                ${date}
                <small>
                    ${time}
                </small>
            </td>

            <td>
                ${location}
            </td>

            <td>

                <select
                    class="order-status-select"
                    data-order-status-id="${id}"
                >

                    <option
                        value="pending"
                        ${status === "pending" ? "selected" : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="confirmed"
                        ${status === "confirmed" ? "selected" : ""}
                    >
                        Confirmed
                    </option>

                    <option
                        value="completed"
                        ${status === "completed" ? "selected" : ""}
                    >
                        Completed
                    </option>

                    <option
                        value="cancelled"
                        ${status === "cancelled" ? "selected" : ""}
                    >
                        Cancelled
                    </option>

                </select>

            </td>

            <td>
                ${amount}
            </td>

            <td>

                <button
                    type="button"
                    data-edit-order="${id}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    data-delete-order="${id}"
                >
                    Delete
                </button>

            </td>

        </tr>

    `;

}


/* =========================================================
   BIND ORDER ACTIONS
========================================================= */

function bindOrderActions(
    container = document
) {

    $all(
        "[data-edit-order]",
        container
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editOrder(
                            button.dataset.editOrder
                        );

                    }
                );

            }
        );

    $all(
        "[data-delete-order]",
        container
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteOrder(
                            button.dataset.deleteOrder
                        );

                    }
                );

            }
        );

    $all(
        "[data-order-status-id]",
        container
    )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    () => {

                        updateOrderStatus(
                            select.dataset.orderStatusId,
                            select.value
                        );

                    }
                );

            }
        );

}


/* =========================================================
   DASHBOARD COUNTERS
========================================================= */

function renderDashboard() {

    const orders =
        RS_APP.orders;

    const total =
        orders.length;

    const pending =
        orders.filter(
            order =>
                String(
                    order.status || ""
                ).toLowerCase() ===
                "pending"
        ).length;

    const confirmed =
        orders.filter(
            order =>
                String(
                    order.status || ""
                ).toLowerCase() ===
                "confirmed"
        ).length;

    const now =
        new Date();

    const month =
        now.getMonth();

    const year =
        now.getFullYear();

    const monthlyValue =
        orders
            .filter(
                order => {

                    const date =
                        parseDate(
                            order.booking_date
                        );

                    return (
                        date &&
                        date.getMonth() ===
                        month &&
                        date.getFullYear() ===
                        year
                    );

                }
            )
            .reduce(
                (
                    total,
                    order
                ) =>
                    total +
                    Number(
                        order.expected_amount ??
                        order.amount ??
                        0
                    ),
                0
            );

    setDashboardNumber(
        [
            "#total-orders",
            "[data-stat='total-orders']",
            "[data-dashboard-total]"
        ],
        total
    );

    setDashboardNumber(
        [
            "#pending-orders",
            "[data-stat='pending-orders']",
            "[data-dashboard-pending]"
        ],
        pending
    );

    setDashboardNumber(
        [
            "#confirmed-orders",
            "[data-stat='confirmed-orders']",
            "[data-dashboard-confirmed]"
        ],
        confirmed
    );

    setDashboardNumber(
        [
            "#monthly-value",
            "[data-stat='monthly-value']",
            "[data-dashboard-monthly]"
        ],
        formatCurrency(
            monthlyValue
        )
    );

    renderUpcomingBookings();

    renderRecentOrders();

}


/* =========================================================
   DASHBOARD NUMBER
========================================================= */

function setDashboardNumber(
    selectors,
    value
) {

    for (
        const selector of selectors
    ) {

        const elements =
            $all(selector);

        if (
            elements.length > 0
        ) {

            elements.forEach(
                element =>
                    setText(
                        element,
                        value
                    )
            );

            return;

        }

    }

}


/* =========================================================
   UPCOMING BOOKINGS
========================================================= */

function renderUpcomingBookings() {

    const container =
        firstElement(
            "#upcoming-bookings",
            "[data-upcoming-bookings]",
            ".upcoming-bookings"
        );

    if (!container) {
        return;
    }

    const today =
        startOfToday();

    const upcoming =
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
                        String(
                            order.status || ""
                        ).toLowerCase() !==
                        "cancelled"
                    );

                }
            )
            .sort(
                (
                    a,
                    b
                ) => {

                    const dateA =
                        parseDate(
                            a.booking_date
                        );

                    const dateB =
                        parseDate(
                            b.booking_date
                        );

                    return (
                        dateA -
                        dateB
                    );

                }
            )
            .slice(
                0,
                5
            );

    if (
        upcoming.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No upcoming bookings</strong>
                <p>New confirmed bookings will appear here.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        upcoming
            .map(
                order => `

                    <div
                        class="upcoming-booking"
                        data-order-id="${escapeHTML(order.id)}"
                    >

                        <strong>
                            ${escapeHTML(
                                order.customer_name ||
                                "Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                formatDate(
                                    order.booking_date
                                )
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                order.event_type ||
                                "Booking"
                            )}
                        </span>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   RECENT ORDERS
========================================================= */

function renderRecentOrders() {

    const container =
        firstElement(
            "#recent-orders",
            "[data-recent-orders]",
            ".recent-orders"
        );

    if (!container) {
        return;
    }

    const recent =
        RS_APP.orders
            .slice(
                0,
                5
            );

    if (
        recent.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No orders yet</strong>
                <p>Customer bookings will appear here automatically.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        recent
            .map(
                order => `

                    <div class="recent-order">

                        <strong>
                            ${escapeHTML(
                                order.customer_name ||
                                "Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                order.event_type ||
                                "Booking"
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                formatDate(
                                    order.booking_date
                                )
                            )}
                        >

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   CALENDAR CONTROLS
========================================================= */

function setupCalendarControls() {

    $all(
        "#calendar-prev, [data-calendar-prev]"
    )
        .forEach(
            button => {

                button.addEventListener(
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
        );

    $all(
        "#calendar-next, [data-calendar-next]"
    )
        .forEach(
            button => {

                button.addEventListener(
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
        );

    $all(
        "#calendar-today, [data-calendar-today]"
    )
        .forEach(
            button => {

                button.addEventListener(
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
        );

}


/* =========================================================
   CALENDAR
========================================================= */

function renderCalendar() {

    const year =
        RS_APP.calendarDate.getFullYear();

    const month =
        RS_APP.calendarDate.getMonth();

    const title =
        new Date(
            year,
            month,
            1
        )
            .toLocaleDateString(
                "en-IN",
                {
                    month: "long",
                    year: "numeric"
                }
            );

    $all(
        "#calendar-month",
        document
    )
        .forEach(
            element =>
                setText(
                    element,
                    title
                )
        );

    const container =
        firstElement(
            "#calendar-grid",
            "#calendar-days",
            "[data-calendar-grid]",
            ".calendar-grid"
        );

    if (!container) {
        return;
    }

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

    let html = "";

    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        html += `
            <div class="calendar-empty"></div>
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

        const bookings =
            getBookingsForDate(
                dateString
            );

        const selected =
            RS_APP.selectedDate ===
            dateString;

        const today =
            isSameDate(
                date,
                new Date()
            );

        html += `

            <button
                type="button"
                class="
                    calendar-day
                    ${selected ? "selected" : ""}
                    ${today ? "today" : ""}
                    ${bookings.length ? "has-bookings" : ""}
                "
                data-calendar-date="${dateString}"
            >

                <span>
                    ${day}
                </span>

                ${
                    bookings.length
                        ? `<small>${bookings.length}</small>`
                        : ""
                }

            </button>

        `;

    }

    container.innerHTML =
        html;

    $all(
        "[data-calendar-date]",
        container
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        RS_APP.selectedDate =
                            button.dataset.calendarDate;

                        renderCalendar();

                        renderSelectedDay();

                    }
                );

            }
        );

    renderSelectedDay();

}


/* =========================================================
   BOOKINGS FOR DATE
========================================================= */

function getBookingsForDate(
    dateString
) {

    return RS_APP.orders.filter(
        order =>
            String(
                order.booking_date ||
                ""
            ) ===
            String(
                dateString
            )
    );

}


/* =========================================================
   SELECTED DAY
========================================================= */

function renderSelectedDay() {

    const container =
        firstElement(
            "#selected-day-bookings",
            "#day-bookings",
            "[data-selected-day]",
            ".selected-day-bookings"
        );

    if (!container) {
        return;
    }

    if (
        !RS_APP.selectedDate
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>Select a date</strong>
                <p>Choose a date to view bookings.</p>
            </div>
        `;

        return;

    }

    const bookings =
        getBookingsForDate(
            RS_APP.selectedDate
        );

    if (
        bookings.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No bookings</strong>
                <p>No bookings are scheduled for this date.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        bookings
            .map(
                order => `

                    <div
                        class="selected-booking"
                    >

                        <strong>
                            ${escapeHTML(
                                order.customer_name ||
                                "Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                formatTime(
                                    order.booking_time
                                )
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                order.event_type ||
                                "Booking"
                            )}
                        </span>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   CUSTOMERS
========================================================= */

function buildCustomersFromOrders() {

    const map =
        new Map();

    RS_APP.orders.forEach(
        order => {

            const phone =
                String(
                    order.phone ||
                    ""
                ).trim();

            const name =
                String(
                    order.customer_name ||
                    order.name ||
                    ""
                ).trim();

            const key =
                phone ||
                name.toLowerCase();

            if (!key) {
                return;
            }

            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    {
                        name,
                        phone,
                        location:
                            order.location ||
                            "",
                        orders: []
                    }
                );

            }

            map.get(key)
                .orders
                .push(order);

        }
    );

    RS_APP.customers =
        Array.from(
            map.values()
        );

}


/* =========================================================
   CUSTOMER SEARCH
========================================================= */

function setupCustomerSearch() {

    const input =
        firstElement(
            "#customer-search",
            "[data-customer-search]",
            "input[placeholder*='Search customers']"
        );

    if (!input) {
        return;
    }

    input.addEventListener(
        "input",
        () => {

            RS_APP.customerSearch =
                valueOf(input);

            renderCustomers();

        }
    );

}


/* =========================================================
   RENDER CUSTOMERS
========================================================= */

function renderCustomers() {

    buildCustomersFromOrders();

    const container =
        firstElement(
            "#customers-list",
            "#customer-list",
            "[data-customers-list]",
            ".customers-list"
        );

    if (!container) {
        return;
    }

    const search =
        RS_APP.customerSearch
            .toLowerCase()
            .trim();

    const customers =
        RS_APP.customers.filter(
            customer => {

                if (!search) {
                    return true;
                }

                return [

                    customer.name,

                    customer.phone,

                    customer.location

                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(search);

            }
        );

    if (
        customers.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No customers yet</strong>
                <p>Customers will be created automatically from orders.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        customers
            .map(
                customer => `

                    <div class="customer-card">

                        <strong>
                            ${escapeHTML(
                                customer.name ||
                                "Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                customer.phone ||
                                "—"
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                customer.location ||
                                "—"
                            )}
                        </span>

                        <small>
                            ${customer.orders.length}
                            booking(s)
                        </small>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   CONTRACT FORM
========================================================= */

function getContractForm() {

    return firstElement(
        "#contract-form",
        "#new-contract-form",
        "[data-contract-form]"
    );

}


/* =========================================================
   CONTRACT ELEMENTS
========================================================= */

function getContractElements() {

    const form =
        getContractForm();

    if (!form) {

        return {
            form: null
        };

    }

    return {

        form,

        customer:
            firstElement(
                "#contract-customer",
                "[name='customer']",
                "[name='customer_name']",
                form
            ),

        date:
            firstElement(
                "#contract-date",
                "[name='contract_date']",
                "input[type='date']",
                form
            ),

        amount:
            firstElement(
                "#contract-amount",
                "[name='agreement_amount']",
                "[name='amount']",
                form
            ),

        status:
            firstElement(
                "#contract-status",
                "[name='status']",
                "select",
                form
            ),

        notes:
            firstElement(
                "#contract-notes",
                "[name='notes']",
                "textarea",
                form
            )

    };

}


/* =========================================================
   SETUP CONTRACT
========================================================= */

function setupContractForm() {

    const elements =
        getContractElements();

    if (
        !elements.form
    ) {

        return;

    }

    elements.form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            try {

                const payload = {

                    customer_name:
                        valueOf(
                            elements.customer
                        ) || null,

                    contract_date:
                        valueOf(
                            elements.date
                        ) || null,

                    agreement_amount:
                        valueOf(
                            elements.amount
                        )
                            ? Number(
                                valueOf(
                                    elements.amount
                                )
                            )
                            : 0,

                    status:
                        valueOf(
                            elements.status
                        ) ||
                        "draft",

                    notes:
                        valueOf(
                            elements.notes
                        ) || null

                };

                const supabase =
                    getSupabase();

                let query;

                if (
                    RS_APP.currentContract?.id
                ) {

                    query =
                        supabase
                            .from(
                                RS_DB.contractsTable
                            )
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                RS_APP.currentContract.id
                            );

                } else {

                    query =
                        supabase
                            .from(
                                RS_DB.contractsTable
                            )
                            .insert(
                                payload
                            );

                }

                const {
                    error
                } =
                    await query;

                if (error) {
                    throw error;
                }

                showToast(
                    "Contract saved successfully.",
                    "success"
                );

                closeContractModal();

                await loadContracts();

                renderContracts();

            } catch (error) {

                console.error(
                    "Contract error:",
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
    );

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
                RS_DB.contractsTable
            )
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        /*
         * Contracts may not exist yet.
         * Do not break the entire dashboard.
         */

        console.warn(
            "Contracts could not be loaded:",
            error
        );

        RS_APP.contracts =
            [];

        return [];

    }

    RS_APP.contracts =
        data || [];

    return RS_APP.contracts;

}


/* =========================================================
   RENDER CONTRACTS
========================================================= */

function renderContracts() {

    const container =
        firstElement(
            "#contracts-list",
            "#contract-list",
            "[data-contracts-list]",
            ".contracts-list"
        );

    if (!container) {
        return;
    }

    if (
        RS_APP.contracts.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No contracts yet</strong>
                <p>Contracts can be created and linked to customer orders.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        RS_APP.contracts
            .map(
                contract => `

                    <div class="contract-card">

                        <strong>
                            ${escapeHTML(
                                contract.customer_name ||
                                contract.customer ||
                                "Customer"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                formatDate(
                                    contract.contract_date
                                )
                            )}
                        </span>

                        <span>
                            ${formatCurrency(
                                contract.agreement_amount ||
                                contract.amount ||
                                0
                            )}
                        </span>

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
   OPEN CONTRACT
========================================================= */

function openNewContract() {

    RS_APP.currentContract =
        null;

    const elements =
        getContractElements();

    if (
        elements.form
    ) {

        elements.form.reset();

        if (
            elements.status
        ) {

            elements.status.value =
                "draft";

        }

    }

    openModalByNames(
        "#contract-modal",
        "#new-contract-modal",
        ".contract-modal",
        "[data-modal='contract']"
    );

}


/* =========================================================
   CLOSE CONTRACT
========================================================= */

function closeContractModal() {

    closeModalByNames(
        "#contract-modal",
        "#new-contract-modal",
        ".contract-modal",
        "[data-modal='contract']"
    );

}


/* =========================================================
   CONTRACT BUTTON
========================================================= */

function setupContractButton() {

    $all(
        "#new-contract-button, #new-contract-btn, [data-action='new-contract']"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        openNewContract();

                    }
                );

            }
        );

}


/* =========================================================
   GALLERY
========================================================= */

async function loadGallery() {

    try {

        const supabase =
            getSupabase();

        const {
            data,
            error
        } =
            await supabase
                .from(
                    RS_DB.galleryTable
                )
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        RS_APP.gallery =
            data || [];

    } catch (error) {

        console.warn(
            "Gallery unavailable:",
            error
        );

        RS_APP.gallery =
            [];

    }

}


/* =========================================================
   RENDER GALLERY
========================================================= */

function renderGallery() {

    const container =
        firstElement(
            "#gallery-list",
            "#gallery-grid",
            "[data-gallery-list]",
            ".gallery-grid"
        );

    if (!container) {
        return;
    }

    if (
        RS_APP.gallery.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>Gallery is empty</strong>
                <p>Add images from your studio storage.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        RS_APP.gallery
            .map(
                photo => {

                    const url =
                        photo.url ||
                        photo.image_url ||
                        photo.public_url ||
                        "";

                    return `

                        <div class="gallery-card">

                            ${
                                url
                                    ? `
                                        <img
                                            src="${escapeHTML(url)}"
                                            alt="${escapeHTML(
                                                photo.title ||
                                                "RS Photography"
                                            )}"
                                            loading="lazy"
                                        >
                                      `
                                    : ""
                            }

                            <strong>
                                ${escapeHTML(
                                    photo.title ||
                                    "Photo"
                                )}
                            </strong>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   GALLERY BUTTON
========================================================= */

function setupGalleryButton() {

    $all(
        "#add-photo-button, #add-photo-btn, [data-action='add-photo']"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        showToast(
                            "Gallery upload requires a Supabase Storage bucket and upload form.",
                            "info"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadMessages() {

    try {

        const supabase =
            getSupabase();

        const {
            data,
            error
        } =
            await supabase
                .from(
                    RS_DB.messagesTable
                )
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        RS_APP.messages =
            data || [];

    } catch (error) {

        console.warn(
            "Messages unavailable:",
            error
        );

        RS_APP.messages =
            [];

    }

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages() {

    const container =
        firstElement(
            "#messages-list",
            "[data-messages-list]",
            ".messages-list"
        );

    if (!container) {
        return;
    }

    if (
        RS_APP.messages.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No messages</strong>
                <p>Customer communication and booking notes will appear here.</p>
            </div>
        `;

        return;

    }

    container.innerHTML =
        RS_APP.messages
            .map(
                message => `

                    <div class="message-card">

                        <strong>
                            ${escapeHTML(
                                message.name ||
                                message.customer_name ||
                                "Customer"
                            )}
                        </strong>

                        <p>
                            ${escapeHTML(
                                message.message ||
                                message.content ||
                                ""
                            )}
                        </p>

                        <small>
                            ${escapeHTML(
                                formatDate(
                                    message.created_at
                                )
                            )}
                        </small>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   STUDIO SETTINGS
========================================================= */

function getSettingsElements() {

    const form =
        firstElement(
            "#studio-settings-form",
            "#settings-form",
            "[data-settings-form]"
        );

    return {

        form,

        name:
            firstElement(
                "#studio-name",
                "[name='studio_name']",
                form
            ),

        phone:
            firstElement(
                "#studio-phone",
                "[name='phone']",
                form
            ),

        location:
            firstElement(
                "#studio-location",
                "[name='location']",
                form
            )

    };

}


/* =========================================================
   SETUP SETTINGS
========================================================= */

function setupStudioSettings() {

    const elements =
        getSettingsElements();

    if (
        !elements.form
    ) {

        return;

    }

    elements.form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            try {

                const payload = {

                    studio_name:
                        valueOf(
                            elements.name
                        ),

                    phone:
                        valueOf(
                            elements.phone
                        ),

                    location:
                        valueOf(
                            elements.location
                        )

                };

                const supabase =
                    getSupabase();

                const {
                    error
                } =
                    await supabase
                        .from(
                            RS_DB.settingsTable
                        )
                        .upsert(
                            payload
                        );

                if (error) {
                    throw error;
                }

                showToast(
                    "Studio settings saved.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Settings error:",
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
    );

}


/* =========================================================
   MODAL HELPERS
========================================================= */

function openModalByNames(
    ...selectors
) {

    const modal =
        firstElement(
            ...selectors
        );

    if (!modal) {

        console.warn(
            "Modal not found:",
            selectors
        );

        return;

    }

    modal.hidden =
        false;

    modal.classList.add(
        "open",
        "active",
        "show"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModalByNames(
    ...selectors
) {

    const modal =
        firstElement(
            ...selectors
        );

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "open",
        "active",
        "show"
    );

    modal.hidden =
        true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   MODAL SYSTEM
========================================================= */

function setupModalSystem() {

    $all(
        "[data-close-modal], .modal-close, .close-modal"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const modal =
                            button.closest(
                                ".modal, [role='dialog'], [data-modal]"
                            );

                        if (modal) {

                            modal.classList.remove(
                                "open",
                                "active",
                                "show"
                            );

                            modal.hidden =
                                true;

                            modal.setAttribute(
                                "aria-hidden",
                                "true"
                            );

                        }

                        document.body.classList.remove(
                            "modal-open"
                        );

                    }
                );

            }
        );

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }

            $all(
                ".modal.open, .modal.active, .modal.show, [role='dialog']:not([hidden])"
            )
                .forEach(
                    modal => {

                        modal.classList.remove(
                            "open",
                            "active",
                            "show"
                        );

                        modal.hidden =
                            true;

                    }
                );

            document.body.classList.remove(
                "modal-open"
            );

        }
    );

}


/* =========================================================
   GLOBAL BUTTONS
========================================================= */

function setupGlobalButtons() {

    $all(
        "[data-action='refresh'], #refresh-button, #refresh-btn"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        await refreshDashboard();

                    }
                );

            }
        );

    $all(
        "[data-action='close-order'], #close-order-button"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeOrderModal
                );

            }
        );

    $all(
        "[data-action='close-contract'], #close-contract-button"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeContractModal
                );

            }
        );

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

async function refreshDashboard() {

    try {

        showToast(
            "Refreshing...",
            "info"
        );

        await loadOrders();

        await loadOptionalData();

        renderAll();

        showToast(
            "Dashboard refreshed.",
            "success"
        );

    } catch (error) {

        console.error(
            "Refresh error:",
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
   OPTIONAL DATA
========================================================= */

async function loadOptionalData() {

    await Promise.allSettled([

        loadContracts(),

        loadGallery(),

        loadMessages()

    ]);

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

    renderDashboard();

    renderOrders();

    renderCalendar();

    renderCustomers();

    renderContracts();

    renderGallery();

    renderMessages();

    updateOwnerUI();

    updateCurrentDate();

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

    updateOwnerUI();

    updateCurrentDate();

    try {

        await loadOrders();

    } catch (error) {

        console.error(
            "Orders load failed:",
            error
        );

        showToast(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

    }

    await loadOptionalData();

    renderAll();

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

        const sensitive =
            [
                "email",
                "password"
            ];

        let changed =
            false;

        sensitive.forEach(
            key => {

                if (
                    url.searchParams.has(
                        key
                    )
                ) {

                    url.searchParams.delete(
                        key
                    );

                    changed =
                        true;

                }

            }
        );

        if (changed) {

            window.history.replaceState(
                {},
                document.title,
                url.pathname +
                (
                    url.search
                        ? url.search
                        : ""
                ) +
                (
                    url.hash
                        ? url.hash
                        : ""
                )
            );

        }

    } catch (error) {

        console.warn(
            "URL cleanup failed:",
            error
        );

    }

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

    cleanAuthenticationUrl();

    setupLogin();

    setupPasswordToggle();

    setupLogoutButtons();

    setupNavigation();

    setupOrderFilters();

    setupCustomerSearch();

    setupNewOrderButton();

    setupOrderForm();

    setupCalendarControls();

    setupContractButton();

    setupContractForm();

    setupStudioSettings();

    setupGalleryButton();

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

    renderCalendar();

    /*
     * Wait for supabase.js.
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

    /*
     * Stop here if Supabase
     * did not initialize.
     */

    if (
        !window.supabaseClient
    ) {

        console.error(
            "Supabase client unavailable."
        );

        showLoginScreen();

        showLoginMessage(
            "Database connection is unavailable. Check supabase.js.",
            "error"
        );

        return;

    }

    /*
     * Authentication listener.
     */

    try {

        setupAuthListener();

    } catch (error) {

        console.error(
            "Auth listener error:",
            error
        );

        showLoginScreen();

        showLoginMessage(
            friendlyDatabaseError(
                error
            ),
            "error"
        );

        return;

    }

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
            friendlyDatabaseError(
                error
            ),
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


/* =========================================================
   GLOBAL DEBUG OBJECT
   Useful from browser console.
========================================================= */

window.RS_APP =
    RS_APP;

window.RS_REFRESH =
    refreshDashboard;

window.RS_LOAD_ORDERS =
    loadOrders;

window.RS_OPEN_NEW_ORDER =
    openNewOrder;

window.RS_EDIT_ORDER =
    editOrder;

window.RS_DELETE_ORDER =
    deleteOrder;