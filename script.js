/* ============================================================
   RS PHOTOGRAPHY
   OWNER WEBSITE
   FINAL MAIN JAVASCRIPT
   ------------------------------------------------------------
   Features:
   • Supabase connection
   • Owner authentication
   • Automatic login/session restore
   • Protected dashboard
   • Login / logout
   • Orders loading
   • Order search
   • Order status filtering
   • Order status updates
   • Order deletion
   • Calendar
   • Booking details
   • Contract creation
   • Dark premium interface support
   • Mobile menu
   • Sidebar
   • Modal system
   • Notifications
   • Loading states
   • Error protection
============================================================ */

"use strict";


/* ============================================================
   01. SUPABASE CONFIGURATION
============================================================ */

const SUPABASE_URL =
    "https://dazguesfusfmvgfwuqnk.supabase.com";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_XLh3Lg_a3mgpJ4T";


/* ============================================================
   02. GLOBAL STATE
============================================================ */

let supabaseClient = null;

let currentUser = null;

let orders = [];

let filteredOrders = [];

let contracts = [];

let selectedOrder = null;

let calendarDate = new Date();

let isLoadingOrders = false;

let isSubmitting = false;


/* ============================================================
   03. SAFE DOM HELPERS
============================================================ */

const $ = selector => {
    try {
        return document.querySelector(selector);
    } catch {
        return null;
    }
};


const $$ = selector => {
    try {
        return Array.from(
            document.querySelectorAll(selector)
        );
    } catch {
        return [];
    }
};


const byId = id =>
    document.getElementById(id);


const exists = element =>
    element !== null &&
    element !== undefined;


/* ============================================================
   04. SAFE TEXT
============================================================ */

const escapeHTML = value => {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

};


/* ============================================================
   05. NOTIFICATION SYSTEM
============================================================ */

function showNotification(
    message,
    type = "info"
) {

    let notification =
        byId("ownerNotification");


    if (!notification) {

        notification =
            document.createElement("div");

        notification.id =
            "ownerNotification";

        notification.className =
            "owner-notification";

        document.body.appendChild(
            notification
        );

    }


    notification.textContent =
        message;


    notification.dataset.type =
        type;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        notification._timer
    );


    notification._timer =
        setTimeout(() => {

            notification.classList.remove(
                "show"
            );

        }, 3500);

}


/* ============================================================
   06. PAGE LOADING
============================================================ */

function setPageLoading(
    loading
) {

    document.body.classList.toggle(
        "page-loading",
        Boolean(loading)
    );

}


function setButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {

    if (!button) {
        return;
    }


    if (loading) {

        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;

        }


        button.disabled = true;

        button.classList.add(
            "is-loading"
        );

        button.textContent =
            loadingText;

    } else {

        button.disabled = false;

        button.classList.remove(
            "is-loading"
        );


        if (
            button.dataset.originalText
        ) {

            button.textContent =
                button.dataset.originalText;

        }

    }

}


/* ============================================================
   07. INITIALIZE SUPABASE
============================================================ */

function initializeSupabase() {

    if (
        typeof window.supabase ===
        "undefined"
    ) {

        console.error(
            "Supabase JavaScript library is not loaded."
        );


        showNotification(
            "Supabase library could not be loaded.",
            "error"
        );


        return false;

    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );


        /*
         * Make it globally available.
         * Useful if another part of the website
         * needs the same client.
         */

        window.supabaseClient =
            supabaseClient;


        console.log(
            "RS Photography Supabase initialized."
        );


        return true;

    } catch (error) {

        console.error(
            "Supabase initialization failed:",
            error
        );


        showNotification(
            "Database connection could not be initialized.",
            "error"
        );


        return false;

    }

}


/* ============================================================
   08. AUTHENTICATION
============================================================ */

async function getCurrentSession() {

    if (!supabaseClient) {
        return null;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session error:",
                error
            );

            return null;

        }


        return data?.session || null;

    } catch (error) {

        console.error(
            "Could not get session:",
            error
        );

        return null;

    }

}


/* ============================================================
   09. LOGIN
============================================================ */

async function loginOwner(
    email,
    password
) {

    if (!supabaseClient) {

        showNotification(
            "Database is not connected.",
            "error"
        );

        return false;

    }


    if (
        !email ||
        !password
    ) {

        showNotification(
            "Enter your email and password.",
            "error"
        );

        return false;

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });


        if (error) {

            console.error(
                "Login failed:",
                error
            );


            showNotification(
                error.message ||
                "Login failed.",
                "error"
            );


            return false;

        }


        currentUser =
            data.user;


        showNotification(
            "Login successful.",
            "success"
        );


        showDashboard();


        await loadDashboard();


        return true;

    } catch (error) {

        console.error(
            "Unexpected login error:",
            error
        );


        showNotification(
            "Login failed. Please try again.",
            "error"
        );


        return false;

    }

}


/* ============================================================
   10. LOGOUT
============================================================ */

async function logoutOwner() {

    if (!supabaseClient) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );


            showNotification(
                "Logout failed.",
                "error"
            );


            return;

        }


        currentUser = null;

        orders = [];

        filteredOrders = [];

        contracts = [];

        selectedOrder = null;


        showLogin();


        showNotification(
            "Logged out successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Unexpected logout error:",
            error
        );

    }

}


/* ============================================================
   11. AUTH STATE LISTENER
============================================================ */

function listenForAuthChanges() {

    if (!supabaseClient) {
        return;
    }


    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "Auth event:",
                event
            );


            if (session?.user) {

                currentUser =
                    session.user;

                showDashboard();

            } else {

                currentUser =
                    null;

                showLogin();

            }

        }
    );

}


/* ============================================================
   12. LOGIN / DASHBOARD VISIBILITY
============================================================ */

function showLogin() {

    const loginPage =
        byId("loginPage") ||
        $(".login-page");


    const dashboard =
        byId("dashboard") ||
        $(".dashboard");


    if (loginPage) {

        loginPage.classList.remove(
            "hidden"
        );

        loginPage.style.display =
            "";

    }


    if (dashboard) {

        dashboard.classList.add(
            "hidden"
        );

    }


    document.body.classList.add(
        "logged-out"
    );


    document.body.classList.remove(
        "logged-in"
    );

}


function showDashboard() {

    const loginPage =
        byId("loginPage") ||
        $(".login-page");


    const dashboard =
        byId("dashboard") ||
        $(".dashboard");


    if (loginPage) {

        loginPage.classList.add(
            "hidden"
        );

        loginPage.style.display =
            "none";

    }


    if (dashboard) {

        dashboard.classList.remove(
            "hidden"
        );

        dashboard.style.display =
            "";

    }


    document.body.classList.remove(
        "logged-out"
    );


    document.body.classList.add(
        "logged-in"
    );


    updateOwnerInformation();

}


/* ============================================================
   13. OWNER INFORMATION
============================================================ */

function updateOwnerInformation() {

    if (!currentUser) {
        return;
    }


    const email =
        currentUser.email ||
        "";


    const emailElements =
        $$("[data-owner-email]");


    emailElements.forEach(
        element => {

            element.textContent =
                email;

        }
    );


    const userElements =
        $$("[data-owner-name]");


    userElements.forEach(
        element => {

            element.textContent =
                email.split("@")[0] ||
                "Owner";

        }
    );

}


/* ============================================================
   14. LOGIN FORM
============================================================ */

function initializeLoginForm() {

    const form =
        byId("loginForm") ||
        $(".login-form");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            event.stopPropagation();


            const emailInput =
                form.querySelector(
                    '[name="email"]'
                );


            const passwordInput =
                form.querySelector(
                    '[name="password"]'
                );


            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const email =
                emailInput?.value
                    ?.trim() || "";


            const password =
                passwordInput?.value ||
                "";


            setButtonLoading(
                submitButton,
                true,
                "Signing in..."
            );


            const success =
                await loginOwner(
                    email,
                    password
                );


            setButtonLoading(
                submitButton,
                false
            );


            if (success) {

                form.reset();

            }

        }
    );

}


/* ============================================================
   15. LOGOUT BUTTONS
============================================================ */

function initializeLogoutButtons() {

    const buttons =
        $$(
            "#logoutBtn, .logout-btn, [data-action='logout']"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    logoutOwner();

                }
            );

        }
    );

}


/* ============================================================
   16. LOAD ORDERS
============================================================ */

async function loadOrders() {

    if (!supabaseClient) {
        return;
    }


    if (isLoadingOrders) {
        return;
    }


    isLoadingOrders = true;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("orders")
                .select("*")
                .order(
                    "booking_date",
                    {
                        ascending: true
                    }
                )
                .order(
                    "booking_time",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Orders loading error:",
                error
            );


            showNotification(
                "Orders could not be loaded.",
                "error"
            );


            return;

        }


        orders =
            Array.isArray(data)
                ? data
                : [];


        filteredOrders =
            [...orders];


        renderOrders();

        updateDashboardStats();

        renderCalendar();

    } catch (error) {

        console.error(
            "Unexpected order error:",
            error
        );


        showNotification(
            "Unable to load orders.",
            "error"
        );

    } finally {

        isLoadingOrders = false;

    }

}


/* ============================================================
   17. ORDER STATUS
============================================================ */

function normalizeStatus(
    status
) {

    return String(
        status || "pending"
    )
        .trim()
        .toLowerCase();

}


function statusLabel(
    status
) {

    const value =
        normalizeStatus(status);


    const labels = {

        pending: "Pending",

        confirmed: "Confirmed",

        completed: "Completed",

        cancelled: "Cancelled",

        rejected: "Rejected"

    };


    return (
        labels[value] ||
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}


/* ============================================================
   18. FORMAT DATE
============================================================ */

function formatDate(
    date
) {

    if (!date) {
        return "Not selected";
    }


    const parsed =
        new Date(
            `${date}T00:00:00`
        );


    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return date;

    }


    return parsed.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* ============================================================
   19. FORMAT TIME
============================================================ */

function formatTime(
    time
) {

    if (!time) {
        return "Not selected";
    }


    const parts =
        String(time).split(":");


    if (parts.length < 2) {
        return time;
    }


    let hour =
        Number(parts[0]);


    const minute =
        parts[1];


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return `${hour}:${minute} ${period}`;

}


/* ============================================================
   20. FORMAT MONEY
============================================================ */

function formatMoney(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Not specified";

    }


    const amount =
        Number(value);


    if (
        !Number.isFinite(amount)
    ) {

        return "Not specified";

    }


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(amount);

}


/* ============================================================
   21. RENDER ORDERS
============================================================ */

function renderOrders() {

    const container =
        byId("ordersList") ||
        $(".orders-list") ||
        $("[data-orders]");


    if (!container) {
        return;
    }


    if (
        filteredOrders.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">○</div>
                <h3>No orders found</h3>
                <p>New customer bookings will appear here.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        filteredOrders
            .map(
                order =>
                    createOrderHTML(order)
            )
            .join("");


    attachOrderEvents();

}


/* ============================================================
   22. ORDER CARD HTML
============================================================ */

function createOrderHTML(
    order
) {

    const id =
        escapeHTML(
            order.id || ""
        );


    const name =
        escapeHTML(
            order.customer_name ||
            "Unnamed Customer"
        );


    const phone =
        escapeHTML(
            order.phone ||
            "No phone"
        );


    const location =
        escapeHTML(
            order.location ||
            "No location"
        );


    const functionType =
        escapeHTML(
            order.function_type ||
            "Photography"
        );


    const status =
        normalizeStatus(
            order.status
        );


    const date =
        formatDate(
            order.booking_date
        );


    const time =
        formatTime(
            order.booking_time
        );


    const money =
        formatMoney(
            order.expected_money
        );


    return `
        <article
            class="order-card"
            data-order-id="${id}"
        >

            <div class="order-card-top">

                <div>

                    <span class="order-label">
                        RS PHOTOGRAPHY
                    </span>

                    <h3>
                        ${name}
                    </h3>

                </div>

                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${escapeHTML(
                        statusLabel(status)
                    )}
                </span>

            </div>


            <div class="order-details">

                <div class="order-detail">
                    <small>Date</small>
                    <strong>${escapeHTML(date)}</strong>
                </div>

                <div class="order-detail">
                    <small>Time</small>
                    <strong>${escapeHTML(time)}</strong>
                </div>

                <div class="order-detail">
                    <small>Function</small>
                    <strong>${functionType}</strong>
                </div>

                <div class="order-detail">
                    <small>Location</small>
                    <strong>${location}</strong>
                </div>

                <div class="order-detail">
                    <small>Expected Amount</small>
                    <strong>${escapeHTML(money)}</strong>
                </div>

                <div class="order-detail">
                    <small>Phone</small>
                    <strong>${phone}</strong>
                </div>

            </div>


            ${
                order.notes
                    ? `
                        <div class="order-notes">
                            <small>Notes</small>
                            <p>
                                ${escapeHTML(
                                    order.notes
                                )}
                            </p>
                        </div>
                    `
                    : ""
            }


            <div class="order-actions">

                <button
                    type="button"
                    class="order-action"
                    data-order-view="${id}"
                >
                    View
                </button>

                <button
                    type="button"
                    class="order-action"
                    data-order-confirm="${id}"
                >
                    Confirm
                </button>

                <button
                    type="button"
                    class="order-action danger"
                    data-order-cancel="${id}"
                >
                    Cancel
                </button>

            </div>

        </article>
    `;

}


/* ============================================================
   23. ORDER EVENTS
============================================================ */

function attachOrderEvents() {

    $$("[data-order-view]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const order =
                        findOrder(
                            button.dataset.orderView
                        );


                    if (order) {

                        openOrderModal(
                            order
                        );

                    }

                }
            );

        });


    $$("[data-order-confirm]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    updateOrderStatus(
                        button.dataset.orderConfirm,
                        "confirmed"
                    );

                }
            );

        });


    $$("[data-order-cancel]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    updateOrderStatus(
                        button.dataset.orderCancel,
                        "cancelled"
                    );

                }
            );

        });

}


/* ============================================================
   24. FIND ORDER
============================================================ */

function findOrder(
    id
) {

    return orders.find(
        order =>
            String(order.id) ===
            String(id)
    );

}


/* ============================================================
   25. UPDATE ORDER STATUS
============================================================ */

async function updateOrderStatus(
    orderId,
    newStatus
) {

    if (!supabaseClient) {
        return;
    }


    const order =
        findOrder(orderId);


    if (!order) {

        showNotification(
            "Order not found.",
            "error"
        );

        return;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("orders")
                .update({
                    status: newStatus
                })
                .eq(
                    "id",
                    orderId
                );


        if (error) {

            console.error(
                "Status update error:",
                error
            );


            showNotification(
                "Could not update order.",
                "error"
            );


            return;

        }


        order.status =
            newStatus;


        filteredOrders =
            [...orders];


        applyOrderFilters();

        updateDashboardStats();

        renderCalendar();


        showNotification(
            `Order marked ${statusLabel(newStatus)}.`,
            "success"
        );

    } catch (error) {

        console.error(
            error
        );


        showNotification(
            "Order update failed.",
            "error"
        );

    }

}


/* ============================================================
   26. SEARCH ORDERS
============================================================ */

function initializeOrderSearch() {

    const search =
        byId("orderSearch") ||
        $("[data-order-search]");


    const statusFilter =
        byId("orderStatusFilter") ||
        $("[data-order-status-filter]");


    if (search) {

        search.addEventListener(
            "input",
            applyOrderFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyOrderFilters
        );

    }

}


/* ============================================================
   27. APPLY ORDER FILTERS
============================================================ */

function applyOrderFilters() {

    const search =
        byId("orderSearch") ||
        $("[data-order-search]");


    const statusFilter =
        byId("orderStatusFilter") ||
        $("[data-order-status-filter]");


    const searchValue =
        (
            search?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const statusValue =
        (
            statusFilter?.value ||
            "all"
        )
            .trim()
            .toLowerCase();


    filteredOrders =
        orders.filter(
            order => {

                const searchable = [
                    order.customer_name,
                    order.phone,
                    order.location,
                    order.function_type,
                    order.booking_date,
                    order.notes
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !searchValue ||
                    searchable.includes(
                        searchValue
                    );


                const matchesStatus =
                    statusValue === "all" ||
                    normalizeStatus(
                        order.status
                    ) === statusValue;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderOrders();

}


/* ============================================================
   28. DASHBOARD STATISTICS
============================================================ */

function updateDashboardStats() {

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


    const completed =
        orders.filter(
            order =>
                normalizeStatus(
                    order.status
                ) === "completed"
        ).length;


    setText(
        [
            "#totalOrders",
            "[data-stat='total']"
        ],
        total
    );


    setText(
        [
            "#pendingOrders",
            "[data-stat='pending']"
        ],
        pending
    );


    setText(
        [
            "#confirmedOrders",
            "[data-stat='confirmed']"
        ],
        confirmed
    );


    setText(
        [
            "#completedOrders",
            "[data-stat='completed']"
        ],
        completed
    );

}


/* ============================================================
   29. SAFE TEXT SETTER
============================================================ */

function setText(
    selectors,
    value
) {

    const list =
        Array.isArray(selectors)
            ? selectors
            : [selectors];


    list.forEach(selector => {

        $$(selector).forEach(
            element => {

                element.textContent =
                    value;

            }
        );

    });

}


/* ============================================================
   30. ORDER MODAL
============================================================ */

function openOrderModal(
    order
) {

    selectedOrder =
        order;


    const modal =
        byId("orderModal") ||
        $(".order-modal");


    if (!modal) {

        /*
         * If the HTML does not contain a modal,
         * show the order through a simple notification.
         */

        showNotification(
            `${order.customer_name || "Customer"} • ${
                formatDate(order.booking_date)
            } • ${
                formatTime(order.booking_time)
            }`,
            "info"
        );


        return;

    }


    const fields = {

        name:
            order.customer_name ||
            "Not available",

        phone:
            order.phone ||
            "Not available",

        location:
            order.location ||
            "Not available",

        date:
            formatDate(
                order.booking_date
            ),

        time:
            formatTime(
                order.booking_time
            ),

        function:
            order.function_type ||
            "Not available",

        budget:
            formatMoney(
                order.expected_money
            ),

        notes:
            order.notes ||
            "No notes"

    };


    Object.entries(fields)
        .forEach(
            ([key, value]) => {

                const element =
                    modal.querySelector(
                        `[data-order-field="${key}"]`
                    );


                if (element) {

                    element.textContent =
                        value;

                }

            }
        );


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* ============================================================
   31. CLOSE MODALS
============================================================ */

function closeAllModals() {

    $$(".modal.open, .order-modal.open")
        .forEach(
            modal => {

                modal.classList.remove(
                    "open"
                );


                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }
        );

}


/* ============================================================
   32. MODAL EVENTS
============================================================ */

function initializeModals() {

    $$(
        "[data-modal-close], .modal-close, .order-modal-close"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeAllModals
                );

            }
        );


    $$(".modal, .order-modal")
        .forEach(
            modal => {

                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            closeAllModals();

                        }

                    }
                );

            }
        );

}


/* ============================================================
   33. CALENDAR
============================================================ */

function renderCalendar() {

    const calendar =
        byId("calendar") ||
        $(".calendar");


    if (!calendar) {
        return;
    }


    const year =
        calendarDate.getFullYear();


    const month =
        calendarDate.getMonth();


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


    const monthName =
        calendarDate.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    const title =
        calendar.querySelector(
            "[data-calendar-title]"
        ) ||
        byId("calendarTitle");


    if (title) {

        title.textContent =
            monthName;

    }


    const grid =
        calendar.querySelector(
            "[data-calendar-grid]"
        ) ||
        byId("calendarGrid");


    if (!grid) {
        return;
    }


    grid.innerHTML = "";


    const weekdays = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ];


    weekdays.forEach(
        day => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "calendar-weekday";


            element.textContent =
                day;


            grid.appendChild(
                element
            );

        }
    );


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "calendar-day empty";


        grid.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const element =
            document.createElement(
                "button"
            );


        element.type =
            "button";


        element.className =
            "calendar-day";


        element.textContent =
            day;


        const dateString =
            `${year}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


        const dayOrders =
            orders.filter(
                order =>
                    order.booking_date ===
                    dateString
            );


        if (
            dayOrders.length
        ) {

            element.classList.add(
                "has-orders"
            );


            element.dataset.orders =
                dayOrders.length;

        }


        const today =
            new Date();


        if (
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day
        ) {

            element.classList.add(
                "today"
            );

        }


        element.addEventListener(
            "click",
            () => {

                showCalendarDay(
                    dateString,
                    dayOrders
                );

            }
        );


        grid.appendChild(
            element
        );

    }

}


/* ============================================================
   34. CALENDAR NAVIGATION
============================================================ */

function initializeCalendarControls() {

    const previous =
        byId("calendarPrev") ||
        $("[data-calendar-prev]");


    const next =
        byId("calendarNext") ||
        $("[data-calendar-next]");


    const today =
        byId("calendarToday") ||
        $("[data-calendar-today]");


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() - 1
                );


                renderCalendar();

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() + 1
                );


                renderCalendar();

            }
        );

    }


    if (today) {

        today.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date();

                renderCalendar();

            }
        );

    }

}


/* ============================================================
   35. CALENDAR DAY DETAILS
============================================================ */

function showCalendarDay(
    date,
    dayOrders
) {

    if (
        !dayOrders ||
        dayOrders.length === 0
    ) {

        showNotification(
            `${formatDate(date)} has no bookings.`,
            "info"
        );


        return;

    }


    const first =
        dayOrders[0];


    openOrderModal(
        first
    );


    if (
        dayOrders.length > 1
    ) {

        showNotification(
            `${dayOrders.length} bookings on ${formatDate(date)}.`,
            "info"
        );

    }

}


/* ============================================================
   36. CONTRACTS
============================================================ */

async function loadContracts() {

    if (!supabaseClient) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
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
             * The contracts table may not exist yet.
             * Do NOT crash the dashboard.
             */

            console.warn(
                "Contracts table unavailable:",
                error.message
            );


            contracts = [];

            return;

        }


        contracts =
            Array.isArray(data)
                ? data
                : [];


        renderContracts();

    } catch (error) {

        console.warn(
            "Contract loading failed:",
            error
        );

    }

}


/* ============================================================
   37. RENDER CONTRACTS
============================================================ */

function renderContracts() {

    const container =
        byId("contractsList") ||
        $(".contracts-list");


    if (!container) {
        return;
    }


    if (
        contracts.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No contracts yet</h3>
                <p>Contracts created for bookings will appear here.</p>
            </div>
        `;


        return;

    }


    container.innerHTML =
        contracts
            .map(
                contract => {

                    return `
                        <article class="contract-card">

                            <div>

                                <small>
                                    CONTRACT
                                </small>

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

                            </div>

                            <span>
                                ${escapeHTML(
                                    contract.status ||
                                    "draft"
                                )}
                            </span>

                        </article>
                    `;

                }
            )
            .join("");

}


/* ============================================================
   38. CREATE CONTRACT
============================================================ */

async function createContract(
    order
) {

    if (!supabaseClient) {

        showNotification(
            "Database connection unavailable.",
            "error"
        );


        return false;

    }


    if (!order) {

        showNotification(
            "No booking selected.",
            "error"
        );


        return false;

    }


    /*
     * This object intentionally uses the
     * common fields expected by the contracts
     * table.
     */

    const contract = {

        order_id:
            order.id || null,

        customer_name:
            order.customer_name || "",

        phone:
            order.phone || "",

        location:
            order.location || "",

        booking_date:
            order.booking_date || null,

        booking_time:
            order.booking_time || null,

        function_type:
            order.function_type || "",

        expected_money:
            order.expected_money ?? null,

        notes:
            order.notes || null,

        status:
            "draft"

    };


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("contracts")
                .insert(
                    contract
                )
                .select()
                .single();


        if (error) {

            console.error(
                "Contract creation error:",
                error
            );


            showNotification(
                "Contract could not be created.",
                "error"
            );


            return false;

        }


        contracts.unshift(
            data
        );


        renderContracts();


        showNotification(
            "Contract created successfully.",
            "success"
        );


        return true;

    } catch (error) {

        console.error(
            error
        );


        showNotification(
            "Contract creation failed.",
            "error"
        );


        return false;

    }

}


/* ============================================================
   39. CONTRACT BUTTONS
============================================================ */

function initializeContractButtons() {

    $$(
        "[data-create-contract]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const order =
                            findOrder(
                                button.dataset.createContract
                            );


                        if (order) {

                            await createContract(
                                order
                            );

                        }

                    }
                );

            }
        );

}


/* ============================================================
   40. MOBILE SIDEBAR
============================================================ */

function initializeMobileMenu() {

    const menuButton =
        byId("menuBtn") ||
        byId("sidebarToggle") ||
        $(".menu-btn");


    const sidebar =
        byId("sidebar") ||
        $(".sidebar");


    const overlay =
        byId("sidebarOverlay") ||
        $(".sidebar-overlay");


    if (
        !menuButton ||
        !sidebar
    ) {

        return;

    }


    const close =
        () => {

            sidebar.classList.remove(
                "open"
            );


            overlay?.classList.remove(
                "open"
            );


            document.body.classList.remove(
                "menu-open"
            );

        };


    const open =
        () => {

            sidebar.classList.add(
                "open"
            );


            overlay?.classList.add(
                "open"
            );


            document.body.classList.add(
                "menu-open"
            );

        };


    menuButton.addEventListener(
        "click",
        () => {

            if (
                sidebar.classList.contains(
                    "open"
                )
            ) {

                close();

            } else {

                open();

            }

        }
    );


    overlay?.addEventListener(
        "click",
        close
    );


    sidebar
        .querySelectorAll("a")
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    close
                );

            }
        );

}


/* ============================================================
   41. SECTION NAVIGATION
============================================================ */

function initializeNavigation() {

    $$(
        "[data-section]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const target =
                            button.dataset.section;


                        $$(
                            ".dashboard-section, [data-dashboard-section]"
                        )
                            .forEach(
                                section => {

                                    section.classList.remove(
                                        "active"
                                    );

                                }
                            );


                        const targetElement =
                            byId(target) ||
                            $(
                                `[data-dashboard-section="${target}"]`
                            );


                        if (targetElement) {

                            targetElement.classList.add(
                                "active"
                            );

                        }

                    }
                );

            }
        );

}


/* ============================================================
   42. THEME
============================================================ */

function initializeTheme() {

    const themeButton =
        byId("themeBtn") ||
        $(".theme-btn");


    const saved =
        localStorage.getItem(
            "rsOwnerTheme"
        );


    if (
        saved === "light"
    ) {

        document.body.classList.add(
            "light"
        );

        document.body.classList.remove(
            "dark"
        );

    } else {

        document.body.classList.add(
            "dark"
        );

        document.body.classList.remove(
            "light"
        );

    }


    updateThemeIcon();


    if (themeButton) {

        themeButton.addEventListener(
            "click",
            () => {

                const isDark =
                    document.body.classList.toggle(
                        "dark"
                    );


                document.body.classList.toggle(
                    "light",
                    !isDark
                );


                localStorage.setItem(
                    "rsOwnerTheme",
                    isDark
                        ? "dark"
                        : "light"
                );


                updateThemeIcon();

            }
        );

    }

}


/* ============================================================
   43. THEME ICON
============================================================ */

function updateThemeIcon() {

    const button =
        byId("themeBtn") ||
        $(".theme-btn");


    if (!button) {
        return;
    }


    button.textContent =
        document.body.classList.contains(
            "dark"
        )
            ? "☀"
            : "☾";

}


/* ============================================================
   44. REFRESH BUTTON
============================================================ */

function initializeRefreshButton() {

    $$(
        "#refreshOrders, [data-refresh-orders]"
    )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        setButtonLoading(
                            button,
                            true,
                            "Refreshing..."
                        );


                        await loadOrders();


                        await loadContracts();


                        setButtonLoading(
                            button,
                            false
                        );

                    }
                );

            }
        );

}


/* ============================================================
   45. ESCAPE KEY
============================================================ */

function initializeKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeAllModals();

                $$(".sidebar.open")
                    .forEach(
                        sidebar => {

                            sidebar.classList.remove(
                                "open"
                            );

                        }
                    );


                $(".sidebar-overlay.open")
                    ?.classList.remove(
                        "open"
                    );

            }

        }
    );

}


/* ============================================================
   46. CURRENT YEAR
============================================================ */

function setCurrentYear() {

    const year =
        new Date()
            .getFullYear();


    $$("[data-year], #year")
        .forEach(
            element => {

                element.textContent =
                    year;

            }
        );

}


/* ============================================================
   47. DASHBOARD LOAD
============================================================ */

async function loadDashboard() {

    if (!currentUser) {
        return;
    }


    setPageLoading(
        true
    );


    try {

        await loadOrders();

        await loadContracts();

        renderCalendar();

    } finally {

        setPageLoading(
            false
        );

    }

}


/* ============================================================
   48. AUTH CHECK
============================================================ */

async function checkAuthentication() {

    const session =
        await getCurrentSession();


    if (
        session?.user
    ) {

        currentUser =
            session.user;


        showDashboard();


        await loadDashboard();


        return true;

    }


    showLogin();


    return false;

}


/* ============================================================
   49. PREVENT FORM DOUBLE SUBMIT
============================================================ */

function protectForms() {

    $$("form")
        .forEach(
            form => {

                form.addEventListener(
                    "submit",
                    () => {

                        if (
                            isSubmitting
                        ) {

                            return;

                        }

                    }
                );

            }
        );

}


/* ============================================================
   50. GLOBAL ERROR PROTECTION
============================================================ */

window.addEventListener(
    "error",
    event => {

        console.error(
            "Website error:",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "Unhandled promise error:",
            event.reason
        );

    }
);


/* ============================================================
   51. INITIALIZE EVERYTHING
============================================================ */

async function initializeOwnerWebsite() {

    console.log(
        "RS Photography Owner Website starting..."
    );


    setPageLoading(
        true
    );


    /*
     * Always initialize Supabase first.
     */

    const connected =
        initializeSupabase();


    if (!connected) {

        setPageLoading(
            false
        );


        return;

    }


    /*
     * Initialize UI systems.
     */

    initializeLoginForm();

    initializeLogoutButtons();

    initializeOrderSearch();

    initializeCalendarControls();

    initializeContractButtons();

    initializeMobileMenu();

    initializeNavigation();

    initializeTheme();

    initializeRefreshButton();

    initializeModals();

    initializeKeyboard();

    protectForms();

    setCurrentYear();


    /*
     * Listen for login/logout events.
     */

    listenForAuthChanges();


    /*
     * Check saved Supabase session.
     *
     * If the owner has already logged in,
     * Supabase restores the session automatically.
     */

    await checkAuthentication();


    setPageLoading(
        false
    );


    console.log(
        "RS Photography Owner Website ready."
    );

}


/* ============================================================
   52. START
============================================================ */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeOwnerWebsite,
        {
            once: true
        }
    );

} else {

    initializeOwnerWebsite();

}