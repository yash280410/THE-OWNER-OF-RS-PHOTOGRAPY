/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   CLEAN SINGLE-FILE APPLICATION
   =========================================================

   IMPORTANT
   ---------------------------------------------------------
   1. Replace the OLD script.js completely.
   2. Do NOT paste this below the old JavaScript.
   3. Do NOT keep two application initializers.
   4. Do NOT put passwords in the URL.
   5. Supabase must be loaded before this file.

   Expected script order in index.html:

   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
   <script src="script.js"></script>

   OR, if your HTML already creates window.supabaseClient,
   this script will use it.
   ========================================================= */


/* =========================================================
   1. GLOBAL APPLICATION OBJECT
   ========================================================= */

const RS = {

    initialized: false,

    supabase: null,

    session: null,

    user: null,

    orders: [],

    filteredOrders: [],

    selectedOrder: null,

    currentSection: "dashboard",

    calendarDate: new Date(),

    selectedDate: null,

    listenersAttached: false

};


/* =========================================================
   2. BASIC DOM HELPERS
   ========================================================= */

function $(selector) {

    try {

        return document.querySelector(selector);

    } catch (error) {

        console.warn(
            "Invalid selector:",
            selector,
            error
        );

        return null;

    }

}


function $$(selector) {

    try {

        return Array.from(
            document.querySelectorAll(selector)
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


function byId(id) {

    return document.getElementById(id);

}


/* =========================================================
   3. SAFE EVENT LISTENER
   ========================================================= */

function on(element, event, handler) {

    if (!element) {
        return;
    }

    element.addEventListener(
        event,
        handler
    );

}


/* =========================================================
   4. SAFE TEXT
   ========================================================= */

function safeText(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value);

}


/* =========================================================
   5. HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    return safeText(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   6. DATE HELPERS
   ========================================================= */

function parseDate(value) {

    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }

    return date;

}


function dateToInputValue(date) {

    if (!date) {
        return "";
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;

}


function startOfToday() {

    const today =
        new Date();

    return new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

}


function isSameDate(first, second) {

    if (!first || !second) {
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


function formatTime(value) {

    if (!value) {
        return "—";
    }

    const parts =
        String(value)
            .split(":");

    if (parts.length < 2) {
        return value;
    }

    const hour =
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

    const displayHour =
        hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;

}


/* =========================================================
   7. STATUS HELPERS
   ========================================================= */

function normalizeStatus(status) {

    const value =
        safeText(status)
            .trim()
            .toLowerCase();

    if (!value) {
        return "pending";
    }

    return value;

}


function statusLabel(status) {

    const value =
        normalizeStatus(status);

    return value
        .charAt(0)
        .toUpperCase()
        + value.slice(1);

}


/* =========================================================
   8. NOTIFICATION SYSTEM
   ========================================================= */

function showToast(
    message,
    type = "info"
) {

    let container =
        byId("toastContainer");

    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "toastContainer";

        container.style.position =
            "fixed";

        container.style.right =
            "20px";

        container.style.bottom =
            "20px";

        container.style.zIndex =
            "99999";

        container.style.display =
            "flex";

        container.style.flexDirection =
            "column";

        container.style.gap =
            "10px";

        document.body.appendChild(
            container
        );

    }

    const toast =
        document.createElement("div");

    toast.textContent =
        safeText(message);

    toast.style.padding =
        "12px 16px";

    toast.style.borderRadius =
        "12px";

    toast.style.background =
        type === "error"
            ? "#b42318"
            : type === "success"
                ? "#18794e"
                : "#333";

    toast.style.color =
        "#fff";

    toast.style.fontSize =
        "14px";

    toast.style.boxShadow =
        "0 10px 30px rgba(0,0,0,.2)";

    container.appendChild(
        toast
    );

    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =========================================================
   9. LOGIN MESSAGE
   ========================================================= */

function loginMessage(
    message,
    type = "error"
) {

    const element =
        byId("loginMessage")
        ||
        byId("loginError")
        ||
        byId("authMessage");

    if (!element) {

        console[type === "error"
            ? "error"
            : "log"
        ](
            message
        );

        return;

    }

    element.textContent =
        message;

    element.style.display =
        "block";

    element.dataset.type =
        type;

}


/* =========================================================
   10. LOADING STATE
   ========================================================= */

function setLoading(
    loading,
    button = null
) {

    if (!button) {
        return;
    }

    if (loading) {

        button.disabled =
            true;

        button.dataset.originalText =
            button.textContent;

        button.textContent =
            "Please wait...";

    } else {

        button.disabled =
            false;

        if (
            button.dataset.originalText
        ) {

            button.textContent =
                button.dataset.originalText;

        }

    }

}


/* =========================================================
   11. SUPABASE INITIALIZATION
   ========================================================= */

function getSupabaseClient() {

    /*
     * First priority:
     * existing client created elsewhere.
     */

    if (
        window.supabaseClient
    ) {

        return window.supabaseClient;

    }


    /*
     * Second priority:
     * existing global supabase object.
     */

    if (
        window.supabase &&
        typeof window.supabase.createClient ===
        "function"
    ) {

        /*
         * These values should normally be supplied
         * by your project configuration.

         * NEVER use a service_role key in browser code.
         */

        const url =
            window.RS_SUPABASE_URL;

        const anonKey =
            window.RS_SUPABASE_ANON_KEY;

        if (
            url &&
            anonKey
        ) {

            return window.supabase.createClient(
                url,
                anonKey
            );

        }

    }


    return null;

}


/* =========================================================
   12. AUTHENTICATION
   ========================================================= */

async function getSession() {

    if (!RS.supabase) {
        return null;
    }

    const {
        data,
        error
    } =
        await RS.supabase.auth.getSession();

    if (error) {
        throw error;
    }

    return data?.session || null;

}


async function login(
    email,
    password
) {

    if (!RS.supabase) {

        throw new Error(
            "Supabase is not connected."
        );

    }

    if (
        !email ||
        !password
    ) {

        throw new Error(
            "Enter your email and password."
        );

    }

    const {
        data,
        error
    } =
        await RS.supabase.auth.signInWithPassword(
            {
                email,
                password
            }
        );

    if (error) {
        throw error;
    }

    return data;

}


async function logout() {

    if (!RS.supabase) {
        return;
    }

    const {
        error
    } =
        await RS.supabase.auth.signOut();

    if (error) {
        throw error;
    }

    RS.session =
        null;

    RS.user =
        null;

    showLoginScreen();

}


/* =========================================================
   13. SHOW / HIDE LOGIN
   ========================================================= */

function showLoginScreen() {

    const login =
        byId("loginScreen")
        ||
        byId("loginPage")
        ||
        $(".login-screen");

    const dashboard =
        byId("dashboard")
        ||
        byId("dashboardScreen")
        ||
        $(".dashboard");

    if (login) {

        login.style.display =
            "";

    }

    if (dashboard) {

        dashboard.style.display =
            "none";

    }

}


function showDashboard() {

    const login =
        byId("loginScreen")
        ||
        byId("loginPage")
        ||
        $(".login-screen");

    const dashboard =
        byId("dashboard")
        ||
        byId("dashboardScreen")
        ||
        $(".dashboard");

    if (login) {

        login.style.display =
            "none";

    }

    if (dashboard) {

        dashboard.style.display =
            "";

    }

}


/* =========================================================
   14. LOGIN FORM
   ========================================================= */

function setupLogin() {

    const form =
        byId("loginForm");

    if (!form) {

        console.warn(
            "loginForm not found."
        );

        return;

    }

    on(
        form,
        "submit",
        async event => {

            event.preventDefault();

            const email =
                byId("email")?.value
                ||
                byId("loginEmail")?.value
                ||
                "";

            const password =
                byId("password")?.value
                ||
                byId("loginPassword")?.value
                ||
                "";

            const button =
                form.querySelector(
                    'button[type="submit"]'
                );

            loginMessage(
                "",
                "info"
            );

            setLoading(
                true,
                button
            );

            try {

                const data =
                    await login(
                        email.trim(),
                        password
                    );

                RS.session =
                    data.session;

                RS.user =
                    data.user;

                showDashboard();

                await loadOrders();

                updateDashboard();

                showToast(
                    "Login successful.",
                    "success"
                );

            } catch (error) {

                console.error(
                    "Login failed:",
                    error
                );

                loginMessage(
                    friendlyDatabaseError(
                        error
                    ),
                    "error"
                );

            } finally {

                setLoading(
                    false,
                    button
                );

            }

        }
    );

}


/* =========================================================
   15. PASSWORD VISIBILITY
   ========================================================= */

function setupPasswordToggle() {

    const buttons =
        $$(
            "[data-password-toggle]"
        );

    buttons.forEach(
        button => {

            on(
                button,
                "click",
                () => {

                    const targetId =
                        button.dataset
                            .passwordToggle;

                    const input =
                        byId(targetId);

                    if (!input) {
                        return;
                    }

                    if (
                        input.type ===
                        "password"
                    ) {

                        input.type =
                            "text";

                        button.textContent =
                            "Hide";

                    } else {

                        input.type =
                            "password";

                        button.textContent =
                            "Show";

                    }

                }
            );

        }
    );

}


/* =========================================================
   16. LOGOUT BUTTONS
   ========================================================= */

function setupLogout() {

    const buttons =
        $$(
            "[data-action='logout'], #logoutBtn, .logout-btn"
        );

    buttons.forEach(
        button => {

            on(
                button,
                "click",
                async () => {

                    try {

                        await logout();

                        showToast(
                            "Logged out.",
                            "success"
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        showToast(
                            "Logout failed.",
                            "error"
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   17. AUTH STATE LISTENER
   ========================================================= */

function setupAuthListener() {

    if (!RS.supabase) {
        return;
    }

    RS.supabase.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            RS.session =
                session;

            RS.user =
                session?.user || null;

            if (
                event ===
                "SIGNED_OUT"
            ) {

                showLoginScreen();

                return;

            }

            if (
                session &&
                (
                    event ===
                    "SIGNED_IN" ||

                    event ===
                    "INITIAL_SESSION" ||

                    event ===
                    "TOKEN_REFRESHED"
                )
            ) {

                showDashboard();

            }

        }
    );

}


/* =========================================================
   18. ORDERS DATABASE
   ========================================================= */

async function loadOrders() {

    if (!RS.supabase) {

        throw new Error(
            "Supabase is not connected."
        );

    }

    const {
        data,
        error
    } =
        await RS.supabase
            .from("orders")
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

    RS.orders =
        Array.isArray(data)
            ? data
            : [];

    RS.filteredOrders =
        [...RS.orders];

    renderOrders();

    updateDashboard();

    return RS.orders;

}


/* =========================================================
   19. RENDER ORDERS
   ========================================================= */

function renderOrders() {

    const container =
        byId("ordersList")
        ||
        byId("ordersTableBody")
        ||
        byId("bookingList");

    if (!container) {

        console.warn(
            "Orders container not found."
        );

        return;

    }


    if (
        RS.filteredOrders.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <h3>No bookings found</h3>
                <p>There are no orders matching the current filter.</p>
            </div>
        `;

        return;

    }


    /*
     * TABLE BODY
     */

    if (
        container.tagName ===
        "TBODY"
    ) {

        container.innerHTML =
            RS.filteredOrders
                .map(
                    order => `

                    <tr data-order-id="${escapeHTML(order.id)}">

                        <td>
                            ${escapeHTML(
                                order.customer_name
                                || "Unknown"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.phone
                                || "—"
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.function_type
                                || "—"
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                order.booking_date
                            )}
                        </td>

                        <td>
                            ${formatTime(
                                order.booking_time
                            )}
                        </td>

                        <td>
                            <span class="status status-${escapeHTML(
                                normalizeStatus(order.status)
                            )}">
                                ${escapeHTML(
                                    statusLabel(order.status)
                                )}
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="view-order-btn"
                                data-order-id="${escapeHTML(order.id)}"
                            >
                                View
                            </button>
                        </td>

                    </tr>

                `
                )
                .join("");

    } else {

        /*
         * CARD / LIST MODE
         */

        container.innerHTML =
            RS.filteredOrders
                .map(
                    order => `

                    <article
                        class="order-card"
                        data-order-id="${escapeHTML(order.id)}"
                    >

                        <div class="order-card-header">

                            <h3>
                                ${escapeHTML(
                                    order.customer_name
                                    || "Unknown customer"
                                )}
                            </h3>

                            <span class="status status-${escapeHTML(
                                normalizeStatus(order.status)
                            )}">
                                ${escapeHTML(
                                    statusLabel(order.status)
                                )}
                            </span>

                        </div>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(
                                order.phone || "—"
                            )}
                        </p>

                        <p>
                            <strong>Event:</strong>
                            ${escapeHTML(
                                order.function_type || "—"
                            )}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${formatDate(
                                order.booking_date
                            )}
                        </p>

                        <p>
                            <strong>Time:</strong>
                            ${formatTime(
                                order.booking_time
                            )}
                        </p>

                        <button
                            type="button"
                            class="view-order-btn"
                            data-order-id="${escapeHTML(order.id)}"
                        >
                            View booking
                        </button>

                    </article>

                `
                )
                .join("");

    }


    /*
     * Attach view buttons.
     */

    $$(".view-order-btn")
        .forEach(
            button => {

                on(
                    button,
                    "click",
                    () => {

                        const id =
                            button.dataset.orderId;

                        openOrder(
                            id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   20. ORDER FILTERS
   ========================================================= */

function setupOrderFilters() {

    const search =
        byId("orderSearch")
        ||
        byId("searchOrders");

    const status =
        byId("statusFilter")
        ||
        byId("orderStatusFilter");

    const date =
        byId("dateFilter")
        ||
        byId("orderDateFilter");


    const apply =
        () => {

            const searchValue =
                safeText(
                    search?.value
                )
                    .trim()
                    .toLowerCase();

            const statusValue =
                safeText(
                    status?.value
                )
                    .trim()
                    .toLowerCase();

            const dateValue =
                safeText(
                    date?.value
                )
                    .trim();


            RS.filteredOrders =
                RS.orders.filter(
                    order => {

                        const searchable = [

                            order.customer_name,

                            order.phone,

                            order.location,

                            order.function_type,

                            order.notes

                        ]
                            .map(
                                safeText
                            )
                            .join(" ")
                            .toLowerCase();


                        const matchesSearch =
                            !searchValue ||
                            searchable.includes(
                                searchValue
                            );


                        const matchesStatus =
                            !statusValue ||
                            statusValue === "all" ||
                            normalizeStatus(
                                order.status
                            ) === statusValue;


                        const matchesDate =
                            !dateValue ||
                            safeText(
                                order.booking_date
                            ) === dateValue;


                        return (
                            matchesSearch &&
                            matchesStatus &&
                            matchesDate
                        );

                    }
                );


            renderOrders();

        };


    on(
        search,
        "input",
        apply
    );

    on(
        status,
        "change",
        apply
    );

    on(
        date,
        "change",
        apply
    );

}


/* =========================================================
   21. OPEN ORDER
   ========================================================= */

function openOrder(id) {

    const order =
        RS.orders.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!order) {

        showToast(
            "Booking not found.",
            "error"
        );

        return;

    }

    RS.selectedOrder =
        order;


    const modal =
        byId("orderModal")
        ||
        byId("bookingModal");


    if (!modal) {

        console.log(
            "Selected order:",
            order
        );

        return;

    }


    const fields = {

        orderCustomerName:
            order.customer_name,

        orderPhone:
            order.phone,

        orderLocation:
            order.location,

        orderDate:
            formatDate(
                order.booking_date
            ),

        orderTime:
            formatTime(
                order.booking_time
            ),

        orderFunction:
            order.function_type,

        orderMoney:
            order.expected_money,

        orderNotes:
            order.notes,

        orderStatus:
            statusLabel(
                order.status
            )

    };


    Object.entries(fields)
        .forEach(
            (
                [id, value]
            ) => {

                const element =
                    byId(id);

                if (element) {

                    element.textContent =
                        safeText(
                            value || "—"
                        );

                }

            }
        );


    modal.classList.add(
        "active"
    );

    modal.style.display =
        "flex";

}


/* =========================================================
   22. CLOSE MODALS
   ========================================================= */

function setupModalControls() {

    $$(
        "[data-close-modal], .modal-close, .close-modal"
    )
        .forEach(
            button => {

                on(
                    button,
                    "click",
                    () => {

                        const modal =
                            button.closest(
                                ".modal"
                            );

                        if (modal) {

                            modal.classList.remove(
                                "active"
                            );

                            modal.style.display =
                                "none";

                        }

                    }
                );

            }
        );


    $$(".modal")
        .forEach(
            modal => {

                on(
                    modal,
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            modal.classList.remove(
                                "active"
                            );

                            modal.style.display =
                                "none";

                        }

                    }
                );

            }
        );

}


/* =========================================================
   23. DASHBOARD STATISTICS
   ========================================================= */

function updateDashboard() {

    const orders =
        RS.orders;


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


    setNumber(
        [
            "totalOrders",
            "totalBookings",
            "bookingCount"
        ],
        total
    );


    setNumber(
        [
            "pendingOrders",
            "pendingBookings"
        ],
        pending
    );


    setNumber(
        [
            "confirmedOrders",
            "confirmedBookings"
        ],
        confirmed
    );


    setNumber(
        [
            "completedOrders",
            "completedBookings"
        ],
        completed
    );


    renderRecentOrders();

}


function setNumber(
    ids,
    value
) {

    ids.forEach(
        id => {

            const element =
                byId(id);

            if (element) {

                element.textContent =
                    String(value);

            }

        }
    );

}


/* =========================================================
   24. RECENT ORDERS
   ========================================================= */

function renderRecentOrders() {

    const container =
        byId("recentOrders");

    if (!container) {
        return;
    }

    const recent =
        RS.orders.slice(
            0,
            5
        );


    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                No recent bookings.
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
                            order.customer_name
                            || "Unknown"
                        )}
                    </strong>

                    <span>
                        ${formatDate(
                            order.booking_date
                        )}
                    </span>

                    <span class="status status-${escapeHTML(
                        normalizeStatus(order.status)
                    )}">
                        ${escapeHTML(
                            statusLabel(order.status)
                        )}
                    </span>

                </div>

            `
            )
            .join("");

}


/* =========================================================
   25. NAVIGATION
   ========================================================= */

function setupNavigation() {

    const buttons =
        $$(
            "[data-section]"
        );

    buttons.forEach(
        button => {

            on(
                button,
                "click",
                event => {

                    event.preventDefault();

                    const section =
                        button.dataset.section;

                    if (!section) {
                        return;
                    }

                    switchSection(
                        section
                    );

                }
            );

        }
    );

}


function switchSection(
    section
) {

    RS.currentSection =
        section;


    $$(
        "[data-section]"
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


    $$(
        "[data-page]"
    )
        .forEach(
            page => {

                page.classList.toggle(
                    "active",
                    page.dataset.page ===
                    section
                );

            }
        );


    const pages =
        $$(
            ".dashboard-section"
        );


    if (pages.length) {

        pages.forEach(
            page => {

                const matches =
                    page.dataset.section ===
                    section;

                page.style.display =
                    matches
                        ? ""
                        : "none";

            }
        );

    }


    /*
     * Close mobile sidebar after navigation.
     */

    const sidebar =
        byId("sidebar");

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }

}


/* =========================================================
   26. MOBILE SIDEBAR
   ========================================================= */

function setupSidebar() {

    const toggle =
        byId("menuToggle")
        ||
        byId("sidebarToggle")
        ||
        byId("mobileMenuButton");

    const sidebar =
        byId("sidebar");

    on(
        toggle,
        "click",
        () => {

            if (sidebar) {

                sidebar.classList.toggle(
                    "open"
                );

            }

        }
    );

}


/* =========================================================
   27. NEW ORDER BUTTON
   ========================================================= */

function setupNewOrder() {

    const buttons =
        $$(
            "#newOrderBtn, [data-action='new-order']"
        );

    buttons.forEach(
        button => {

            on(
                button,
                "click",
                () => {

                    openNewOrderForm();

                }
            );

        }
    );

}


function openNewOrderForm() {

    const modal =
        byId("newOrderModal")
        ||
        byId("orderFormModal");

    if (!modal) {

        showToast(
            "Order form is not available in the HTML.",
            "error"
        );

        return;

    }


    const form =
        modal.querySelector(
            "form"
        );

    if (form) {
        form.reset();
    }


    modal.classList.add(
        "active"
    );

    modal.style.display =
        "flex";

}


/* =========================================================
   28. CREATE ORDER
   ========================================================= */

function setupOrderForm() {

    const form =
        byId("orderForm");

    if (!form) {
        return;
    }


    on(
        form,
        "submit",
        async event => {

            event.preventDefault();


            if (!RS.supabase) {

                showToast(
                    "Supabase is not connected.",
                    "error"
                );

                return;

            }


            const formData =
                new FormData(
                    form
                );


            const order = {

                customer_name:
                    safeFormValue(
                        formData,
                        "customer_name"
                    ),

                phone:
                    safeFormValue(
                        formData,
                        "phone"
                    ),

                location:
                    safeFormValue(
                        formData,
                        "location"
                    ),

                booking_date:
                    safeFormValue(
                        formData,
                        "booking_date"
                    ),

                booking_time:
                    safeFormValue(
                        formData,
                        "booking_time"
                    ),

                function_type:
                    safeFormValue(
                        formData,
                        "function_type"
                    ),

                expected_money:
                    safeFormValue(
                        formData,
                        "expected_money"
                    ),

                notes:
                    safeFormValue(
                        formData,
                        "notes"
                    ),

                status:
                    "pending"

            };


            if (
                !order.customer_name
            ) {

                showToast(
                    "Customer name is required.",
                    "error"
                );

                return;

            }


            try {

                const {
                    error
                } =
                    await RS.supabase
                        .from("orders")
                        .insert(
                            order
                        );


                if (error) {
                    throw error;
                }


                showToast(
                    "Booking created successfully.",
                    "success"
                );


                form.reset();


                const modal =
                    form.closest(
                        ".modal"
                    );

                if (modal) {

                    modal.classList.remove(
                        "active"
                    );

                    modal.style.display =
                        "none";

                }


                await loadOrders();

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

            }

        }
    );

}


/* =========================================================
   29. FORM VALUE
   ========================================================= */

function safeFormValue(
    formData,
    name
) {

    const value =
        formData.get(name);

    return safeText(
        value
    ).trim();

}


/* =========================================================
   30. REFRESH
   ========================================================= */

function setupRefresh() {

    const buttons =
        $$(
            "#refreshBtn, [data-action='refresh']"
        );

    buttons.forEach(
        button => {

            on(
                button,
                "click",
                async () => {

                    if (!RS.supabase) {

                        showToast(
                            "Supabase is not connected.",
                            "error"
                        );

                        return;

                    }

                    try {

                        setLoading(
                            true,
                            button
                        );

                        await loadOrders();

                        showToast(
                            "Dashboard refreshed.",
                            "success"
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        showToast(
                            friendlyDatabaseError(
                                error
                            ),
                            "error"
                        );

                    } finally {

                        setLoading(
                            false,
                            button
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   31. CURRENT DATE
   ========================================================= */

function updateCurrentDate() {

    const elements =
        $$(
            "[data-current-date], #currentDate"
        );

    const text =
        new Date()
            .toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );


    elements.forEach(
        element => {

            element.textContent =
                text;

        }
    );

}


/* =========================================================
   32. CALENDAR
   ========================================================= */

function renderCalendar() {

    const container =
        byId("calendar");

    if (!container) {
        return;
    }


    const year =
        RS.calendarDate
            .getFullYear();

    const month =
        RS.calendarDate
            .getMonth();


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


    let html = `
        <div class="calendar-header">

            <button
                type="button"
                data-calendar-prev
            >
                ‹
            </button>

            <strong>
                ${firstDay.toLocaleDateString(
                    "en-IN",
                    {
                        month: "long",
                        year: "numeric"
                    }
                )}
            </strong>

            <button
                type="button"
                data-calendar-next
            >
                ›
            </button>

        </div>

        <div class="calendar-grid">

            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
    `;


    for (
        let i = 0;
        i < startingDay;
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

        const current =
            new Date(
                year,
                month,
                day
            );


        const dateValue =
            dateToInputValue(
                current
            );


        const hasBooking =
            RS.orders.some(
                order =>
                    order.booking_date ===
                    dateValue
            );


        const today =
            isSameDate(
                current,
                new Date()
            );


        html += `

            <button
                type="button"
                class="
                    calendar-day
                    ${today ? "today" : ""}
                    ${hasBooking ? "has-booking" : ""}
                "
                data-calendar-date="${dateValue}"
            >
                ${day}
            </button>

        `;

    }


    html += `
        </div>
    `;


    container.innerHTML =
        html;


    on(
        byId("calendar")
            ?.querySelector(
                "[data-calendar-prev]"
            ),
        "click",
        () => {

            RS.calendarDate =
                new Date(
                    year,
                    month - 1,
                    1
                );

            renderCalendar();

        }
    );


    on(
        byId("calendar")
            ?.querySelector(
                "[data-calendar-next]"
            ),
        "click",
        () => {

            RS.calendarDate =
                new Date(
                    year,
                    month + 1,
                    1
                );

            renderCalendar();

        }
    );


    $$("#calendar [data-calendar-date]")
        .forEach(
            button => {

                on(
                    button,
                    "click",
                    () => {

                        const date =
                            button.dataset
                                .calendarDate;

                        RS.selectedDate =
                            date;

                        showOrdersForDate(
                            date
                        );

                    }
                );

            }
        );

}


function setupCalendar() {

    const previous =
        byId("calendarPrev");

    const next =
        byId("calendarNext");


    on(
        previous,
        "click",
        () => {

            RS.calendarDate =
                new Date(
                    RS.calendarDate.getFullYear(),
                    RS.calendarDate.getMonth() - 1,
                    1
                );

            renderCalendar();

        }
    );


    on(
        next,
        "click",
        () => {

            RS.calendarDate =
                new Date(
                    RS.calendarDate.getFullYear(),
                    RS.calendarDate.getMonth() + 1,
                    1
                );

            renderCalendar();

        }
    );

}


function showOrdersForDate(
    date
) {

    RS.filteredOrders =
        RS.orders.filter(
            order =>
                order.booking_date ===
                date
        );


    renderOrders();

}


/* =========================================================
   33. DATABASE ERROR MESSAGE
   ========================================================= */

function friendlyDatabaseError(
    error
) {

    const message =
        safeText(
            error?.message
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

        return (
            "The Supabase 'orders' table does not exist."
        );

    }


    if (
        lower.includes(
            "row-level security"
        ) ||
        lower.includes(
            "rls"
        )
    ) {

        return (
            "Supabase Row Level Security blocked this operation."
        );

    }


    if (
        lower.includes(
            "permission denied"
        )
    ) {

        return (
            "Supabase denied permission for this operation."
        );

    }


    if (
        lower.includes(
            "invalid login credentials"
        )
    ) {

        return (
            "Incorrect email or password."
        );

    }


    if (
        lower.includes(
            "duplicate"
        )
    ) {

        return (
            "This record already exists."
        );

    }


    return (
        message ||
        "Database operation failed."
    );

}


/* =========================================================
   34. GLOBAL ERROR PROTECTION
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "RS Photography error:",
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
   35. REMOVE PASSWORD FROM URL
   ========================================================= */

function cleanLoginURL() {

    try {

        const url =
            new URL(
                window.location.href
            );


        /*
         * Never keep authentication credentials
         * inside the browser URL.
         */

        const sensitiveParameters = [

            "password",

            "pass",

            "pwd"

        ];


        let changed =
            false;


        sensitiveParameters.forEach(
            parameter => {

                if (
                    url.searchParams.has(
                        parameter
                    )
                ) {

                    url.searchParams.delete(
                        parameter
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
                    url.searchParams.toString()
                        ? "?" +
                          url.searchParams.toString()
                        : ""
                ) +
                url.hash
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
   36. INITIAL APPLICATION
   ========================================================= */

async function initializeRS() {

    /*
     * Prevent double initialization.
     */

    if (RS.initialized) {
        return;
    }

    RS.initialized =
        true;


    console.log(
        "RS Photography Owner Dashboard starting..."
    );


    /*
     * Remove password parameters if somebody
     * accidentally opened an old login URL.
     */

    cleanLoginURL();


    /*
     * Basic UI setup.
     */

    setupLogin();

    setupPasswordToggle();

    setupLogout();

    setupNavigation();

    setupSidebar();

    setupOrderFilters();

    setupNewOrder();

    setupOrderForm();

    setupModalControls();

    setupRefresh();

    setupCalendar();

    updateCurrentDate();


    /*
     * Calendar starts on current month.
     */

    const today =
        new Date();

    RS.calendarDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    RS.selectedDate =
        dateToInputValue(
            today
        );


    renderCalendar();


    /*
     * Find Supabase.
     */

    RS.supabase =
        getSupabaseClient();


    if (!RS.supabase) {

        console.error(
            "Supabase client was not found."
        );


        /*
         * IMPORTANT:
         * Do NOT make the entire page blank.
         */

        showLoginScreen();


        loginMessage(
            "Supabase is not connected. Check the Supabase script/configuration.",
            "error"
        );


        return;

    }


    /*
     * Auth listener.
     */

    setupAuthListener();


    /*
     * Existing session.
     */

    try {

        const session =
            await getSession();


        if (session) {

            RS.session =
                session;

            RS.user =
                session.user;


            showDashboard();


            await loadOrders();


            updateDashboard();

        } else {

            showLoginScreen();

        }

    } catch (error) {

        console.error(
            "Session check failed:",
            error
        );


        showLoginScreen();


        loginMessage(
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
   37. START APPLICATION
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeRS,
        {
            once: true
        }
    );

} else {

    initializeRS();

}


/* =========================================================
   END OF SCRIPT
   ========================================================= */