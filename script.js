/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   FINAL CLEAN JAVASCRIPT
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const SUPABASE_URL =
    "https://dazguesfusfmvgfwuqnk.supabase.com";

const SUPABASE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_XLh3Lg_a3mgpJ4T";


/* =========================================================
   GLOBAL STATE
========================================================= */

let supabaseClient = null;

let currentUser = null;

let orders = [];

let currentDate = new Date();

let selectedOrder = null;


/* =========================================================
   HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    document.querySelectorAll(selector);


const get = id =>
    document.getElementById(id);


const safeText = value =>
    value === null ||
    value === undefined
        ? ""
        : String(value);


const escapeHTML = value => {

    return safeText(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

};


const formatDate = value => {

    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return safeText(value);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

};


const formatMoney = value => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return safeText(value);
    }

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(number);

};


const showMessage = (
    message,
    type = "info"
) => {

    const box =
        get("systemMessage");

    if (!box) {
        console.log(message);
        return;
    }

    box.textContent = message;

    box.className =
        `system-message ${type}`;

};


const hideMessage = () => {

    const box =
        get("systemMessage");

    if (!box) {
        return;
    }

    box.textContent = "";

    box.className =
        "system-message";

};


/* =========================================================
   LOADING
========================================================= */

const setLoading = (
    state,
    text = "Loading..."
) => {

    const loader =
        get("appLoader");

    if (!loader) {
        return;
    }

    if (state) {

        loader.classList.add("show");

        const textElement =
            loader.querySelector(
                ".loader-text"
            );

        if (textElement) {
            textElement.textContent =
                text;
        }

    } else {

        loader.classList.remove("show");

    }

};


/* =========================================================
   LOAD SUPABASE LIBRARY
========================================================= */

const loadSupabaseLibrary = () => {

    return new Promise(
        (resolve, reject) => {

            if (
                window.supabase &&
                typeof window.supabase.createClient ===
                "function"
            ) {

                resolve();

                return;

            }


            const existing =
                document.querySelector(
                    'script[data-supabase-library="true"]'
                );


            if (existing) {

                existing.addEventListener(
                    "load",
                    resolve,
                    { once: true }
                );

                existing.addEventListener(
                    "error",
                    () =>
                        reject(
                            new Error(
                                "Supabase library failed to load."
                            )
                        ),
                    { once: true }
                );

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";


            script.async = true;

            script.dataset.supabaseLibrary =
                "true";


            script.onload = () => {

                if (
                    window.supabase &&
                    typeof window.supabase.createClient ===
                    "function"
                ) {

                    resolve();

                } else {

                    reject(
                        new Error(
                            "Supabase library is unavailable."
                        )
                    );

                }

            };


            script.onerror = () => {

                reject(
                    new Error(
                        "Could not load Supabase."
                    )
                );

            };


            document.head.appendChild(
                script
            );

        }
    );

};


/* =========================================================
   CREATE SUPABASE CLIENT
========================================================= */

const initializeSupabase = async () => {

    await loadSupabaseLibrary();


    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        );


    return supabaseClient;

};


/* =========================================================
   SUPABASE CONNECTION TEST
========================================================= */

const testConnection = async () => {

    if (!supabaseClient) {
        throw new Error(
            "Supabase client is not initialized."
        );
    }


    const {
        error
    } =
        await supabaseClient
            .from("orders")
            .select("id")
            .limit(1);


    if (error) {

        console.error(
            "Supabase connection error:",
            error
        );

        /*
           Do not block the entire website.

           Authentication can still work even when
           the orders table has a policy/schema issue.
        */

        return false;

    }


    return true;

};


/* =========================================================
   AUTH UI
========================================================= */

const showLoginScreen = () => {

    const loginScreen =
        get("loginScreen");

    const dashboard =
        get("dashboard");

    if (loginScreen) {
        loginScreen.classList.remove(
            "hidden"
        );
    }

    if (dashboard) {
        dashboard.classList.add(
            "hidden"
        );
    }

};


const showDashboard = () => {

    const loginScreen =
        get("loginScreen");

    const dashboard =
        get("dashboard");

    if (loginScreen) {
        loginScreen.classList.add(
            "hidden"
        );
    }

    if (dashboard) {
        dashboard.classList.remove(
            "hidden"
        );
    }

};


/* =========================================================
   DISPLAY USER
========================================================= */

const updateUserDetails = () => {

    if (!currentUser) {
        return;
    }


    const email =
        safeText(
            currentUser.email
        );


    const elements =
        document.querySelectorAll(
            "[data-user-email]"
        );


    elements.forEach(
        element => {

            element.textContent =
                email;

        }
    );

};


/* =========================================================
   LOGIN
========================================================= */

const login = async (
    email,
    password
) => {

    if (!supabaseClient) {

        throw new Error(
            "Database is not ready."
        );

    }


    const cleanEmail =
        email.trim();


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


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email:
                    cleanEmail,
                password
            });


    if (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        throw error;

    }


    currentUser =
        data.user;


    return currentUser;

};


/* =========================================================
   LOGOUT
========================================================= */

const logout = async () => {

    if (!supabaseClient) {
        return;
    }


    setLoading(
        true,
        "Signing out..."
    );


    try {

        const {
            error
        } =
            await supabaseClient.auth
                .signOut();


        if (error) {
            throw error;
        }


        currentUser = null;

        orders = [];

        showLoginScreen();

        showMessage(
            "You have been signed out.",
            "success"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        showMessage(
            "Could not sign out.",
            "error"
        );

    } finally {

        setLoading(false);

    }

};


/* =========================================================
   CHECK EXISTING SESSION
========================================================= */

const checkSession = async () => {

    if (!supabaseClient) {
        return false;
    }


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "SESSION ERROR:",
            error
        );

        showLoginScreen();

        return false;

    }


    const session =
        data.session;


    if (
        session &&
        session.user
    ) {

        currentUser =
            session.user;


        showDashboard();

        updateUserDetails();

        return true;

    }


    currentUser = null;

    showLoginScreen();

    return false;

};


/* =========================================================
   AUTH STATE LISTENER
========================================================= */

const listenForAuthChanges = () => {

    if (!supabaseClient) {
        return;
    }


    supabaseClient.auth.onAuthStateChange(
        (
            event,
            session
        ) => {

            console.log(
                "AUTH:",
                event
            );


            if (
                session &&
                session.user
            ) {

                currentUser =
                    session.user;

                showDashboard();

                updateUserDetails();

            } else {

                currentUser = null;

                showLoginScreen();

            }

        }
    );

};


/* =========================================================
   LOGIN FORM
========================================================= */

const setupLoginForm = () => {

    const form =
        get("loginForm");


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            hideMessage();


            const emailInput =
                form.querySelector(
                    '[name="email"]'
                );


            const passwordInput =
                form.querySelector(
                    '[name="password"]'
                );


            const email =
                emailInput
                    ? emailInput.value
                    : "";


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const button =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                button
                    ? button.textContent
                    : "Login";


            try {

                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        "Signing in...";

                }


                setLoading(
                    true,
                    "Authenticating..."
                );


                await login(
                    email,
                    password
                );


                showMessage(
                    "Login successful.",
                    "success"
                );


                showDashboard();

                updateUserDetails();


                await loadOrders();

                updateDashboard();


            } catch (error) {

                console.error(
                    error
                );


                showLoginScreen();


                showMessage(
                    error.message ||
                    "Login failed. Check your email and password.",
                    "error"
                );


            } finally {

                setLoading(false);


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        originalText;

                }

            }

        }
    );

};


/* =========================================================
   LOGOUT BUTTON
========================================================= */

const setupLogout = () => {

    const buttons =
        document.querySelectorAll(
            "[data-logout]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                logout
            );

        }
    );

};


/* =========================================================
   LOAD ORDERS
========================================================= */

const loadOrders = async () => {

    if (!supabaseClient) {
        return;
    }


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
                );


        if (error) {

            console.error(
                "ORDERS ERROR:",
                error
            );


            /*
               Keep dashboard alive.
               A database policy error should not
               turn the whole page into a loading screen.
            */

            orders = [];

            renderOrders();

            showMessage(
                "Orders could not be loaded. Check the orders table permissions.",
                "error"
            );

            return;

        }


        orders =
            Array.isArray(data)
                ? data
                : [];


        renderOrders();

        updateDashboard();

        renderCalendar();


    } catch (error) {

        console.error(
            "Unexpected orders error:",
            error
        );


        orders = [];

        renderOrders();

    }

};


/* =========================================================
   RENDER ORDERS
========================================================= */

const renderOrders = () => {

    const container =
        get("ordersList");


    if (!container) {
        return;
    }


    if (orders.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">◎</div>
                <h3>No orders yet</h3>
                <p>New customer bookings will appear here automatically.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        orders.map(
            order => {

                const status =
                    safeText(
                        order.status ||
                        "pending"
                    ).toLowerCase();


                return `
                    <article
                        class="order-card"
                        data-order-id="${escapeHTML(order.id)}"
                    >

                        <div class="order-main">

                            <div class="order-avatar">
                                ${escapeHTML(
                                    safeText(
                                        order.customer_name
                                    )
                                    .charAt(0)
                                    .toUpperCase()
                                )}
                            </div>

                            <div class="order-content">

                                <h3>
                                    ${escapeHTML(
                                        order.customer_name ||
                                        "Unknown Customer"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        order.function_type ||
                                        "Photography Booking"
                                    )}
                                </p>

                                <div class="order-meta">

                                    <span>
                                        ${escapeHTML(
                                            formatDate(
                                                order.booking_date
                                            )
                                        )}
                                    </span>

                                    <span>
                                        ${escapeHTML(
                                            order.booking_time ||
                                            "Time not set"
                                        )}
                                    </span>

                                    <span>
                                        ${escapeHTML(
                                            order.location ||
                                            "Location not set"
                                        )}
                                    </span>

                                </div>

                            </div>

                        </div>


                        <div class="order-side">

                            <span
                                class="status status-${escapeHTML(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    formatMoney(
                                        order.expected_money
                                    )
                                )}
                            </strong>

                            <button
                                class="small-btn"
                                type="button"
                                data-view-order="${escapeHTML(
                                    order.id
                                )}"
                            >
                                View
                            </button>

                        </div>

                    </article>
                `;

            }
        )
        .join("");


    container
        .querySelectorAll(
            "[data-view-order]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .viewOrder;

                        openOrder(
                            id
                        );

                    }
                );

            }
        );

};


/* =========================================================
   OPEN ORDER
========================================================= */

const openOrder = id => {

    const order =
        orders.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!order) {
        return;
    }


    selectedOrder =
        order;


    const modal =
        get("orderModal");


    if (!modal) {

        console.log(
            "Selected order:",
            order
        );

        return;

    }


    const content =
        modal.querySelector(
            ".modal-content"
        );


    if (content) {

        content.innerHTML = `

            <div class="modal-header">

                <div>
                    <span class="eyebrow">
                        BOOKING DETAILS
                    </span>

                    <h2>
                        ${escapeHTML(
                            order.customer_name ||
                            "Customer"
                        )}
                    </h2>
                </div>

                <button
                    type="button"
                    class="modal-close"
                    data-close-modal
                >
                    ×
                </button>

            </div>


            <div class="detail-grid">

                <div>
                    <small>Function</small>
                    <strong>
                        ${escapeHTML(
                            order.function_type ||
                            "—"
                        )}
                    </strong>
                </div>

                <div>
                    <small>Date</small>
                    <strong>
                        ${escapeHTML(
                            formatDate(
                                order.booking_date
                            )
                        )}
                    </strong>
                </div>

                <div>
                    <small>Time</small>
                    <strong>
                        ${escapeHTML(
                            order.booking_time ||
                            "—"
                        )}
                    </strong>
                </div>

                <div>
                    <small>Location</small>
                    <strong>
                        ${escapeHTML(
                            order.location ||
                            "—"
                        )}
                    </strong>
                </div>

                <div>
                    <small>Phone</small>
                    <strong>
                        ${escapeHTML(
                            order.phone ||
                            "—"
                        )}
                    </strong>
                </div>

                <div>
                    <small>Expected Amount</small>
                    <strong>
                        ${escapeHTML(
                            formatMoney(
                                order.expected_money
                            )
                        )}
                    </strong>
                </div>

            </div>


            <div class="detail-notes">

                <small>Notes</small>

                <p>
                    ${escapeHTML(
                        order.notes ||
                        "No additional notes."
                    )}
                </p>

            </div>

        `;


        const close =
            content.querySelector(
                "[data-close-modal]"
            );


        if (close) {

            close.addEventListener(
                "click",
                closeOrderModal
            );

        }

    }


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );

};


/* =========================================================
   CLOSE ORDER MODAL
========================================================= */

const closeOrderModal = () => {

    const modal =
        get("orderModal");


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


    selectedOrder = null;

};


/* =========================================================
   MODAL EVENTS
========================================================= */

const setupModal = () => {

    const modal =
        get("orderModal");


    if (!modal) {
        return;
    }


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeOrderModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeOrderModal();

            }

        }
    );

};


/* =========================================================
   SEARCH ORDERS
========================================================= */

const setupSearch = () => {

    const search =
        get("orderSearch");


    if (!search) {
        return;
    }


    search.addEventListener(
        "input",
        () => {

            const query =
                search.value
                    .trim()
                    .toLowerCase();


            const cards =
                document.querySelectorAll(
                    ".order-card"
                );


            cards.forEach(
                card => {

                    const text =
                        card.textContent
                            .toLowerCase();


                    card.style.display =
                        !query ||
                        text.includes(query)
                            ? ""
                            : "none";

                }
            );

        }
    );

};


/* =========================================================
   STATUS FILTER
========================================================= */

const setupStatusFilter = () => {

    const filter =
        get("statusFilter");


    if (!filter) {
        return;
    }


    filter.addEventListener(
        "change",
        () => {

            const selected =
                filter.value;


            const cards =
                document.querySelectorAll(
                    ".order-card"
                );


            cards.forEach(
                card => {

                    if (
                        selected ===
                        "all"
                    ) {

                        card.style.display =
                            "";

                        return;

                    }


                    const status =
                        card.querySelector(
                            ".status"
                        );


                    const current =
                        status
                            ? status.textContent
                                .trim()
                                .toLowerCase()
                            : "";


                    card.style.display =
                        current ===
                        selected
                            ? ""
                            : "none";

                }
            );

        }
    );

};


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

const updateDashboard = () => {

    const total =
        orders.length;


    const pending =
        orders.filter(
            order =>
                safeText(
                    order.status
                ).toLowerCase() ===
                "pending"
        ).length;


    const confirmed =
        orders.filter(
            order =>
                safeText(
                    order.status
                ).toLowerCase() ===
                "confirmed"
        ).length;


    const completed =
        orders.filter(
            order =>
                safeText(
                    order.status
                ).toLowerCase() ===
                "completed"
        ).length;


    const values = {

        totalOrders:
            total,

        pendingOrders:
            pending,

        confirmedOrders:
            confirmed,

        completedOrders:
            completed

    };


    Object.entries(
        values
    ).forEach(
        (
            [
                key,
                value
            ]
        ) => {

            const element =
                document.querySelector(
                    `[data-stat="${key}"]`
                );


            if (element) {
                element.textContent =
                    value;
            }

        }
    );

};


/* =========================================================
   CALENDAR
========================================================= */

const renderCalendar = () => {

    const calendar =
        get("calendar");


    if (!calendar) {
        return;
    }


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


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


    const startDay =
        firstDay.getDay();


    const totalDays =
        lastDay.getDate();


    const monthName =
        currentDate.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    const title =
        get("calendarTitle");


    if (title) {
        title.textContent =
            monthName;
    }


    let html = "";


    [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat"
    ]
    .forEach(
        day => {

            html += `
                <div class="calendar-weekday">
                    ${day}
                </div>
            `;

        }
    );


    for (
        let i = 0;
        i < startDay;
        i++
    ) {

        html += `
            <div class="calendar-day empty"></div>
        `;

    }


    for (
        let day = 1;
        day <= totalDays;
        day++
    ) {

        const dateString =
            [
                year,
                String(
                    month + 1
                ).padStart(
                    2,
                    "0"
                ),
                String(day).padStart(
                    2,
                    "0"
                )
            ]
            .join("-");


        const dayOrders =
            orders.filter(
                order =>
                    safeText(
                        order.booking_date
                    )
                    .startsWith(
                        dateString
                    )
            );


        const isToday =
            new Date().toDateString() ===
            new Date(
                year,
                month,
                day
            ).toDateString();


        html += `

            <button
                type="button"
                class="
                    calendar-day
                    ${isToday ? "today" : ""}
                    ${dayOrders.length ? "has-order" : ""}
                "
                data-calendar-date="${dateString}"
            >

                <span>
                    ${day}
                </span>

                ${
                    dayOrders.length
                        ? `
                            <b>
                                ${dayOrders.length}
                            </b>
                        `
                        : ""
                }

            </button>

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
                            button.dataset
                                .calendarDate;


                        const matching =
                            orders.filter(
                                order =>
                                    safeText(
                                        order.booking_date
                                    )
                                    .startsWith(
                                        date
                                    )
                            );


                        if (
                            matching.length
                        ) {

                            openOrder(
                                matching[0].id
                            );

                        }

                    }
                );

            }
        );

};


/* =========================================================
   CALENDAR NAVIGATION
========================================================= */

const setupCalendarNavigation = () => {

    const previous =
        get("calendarPrev");


    const next =
        get("calendarNext");


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                currentDate =
                    new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                currentDate =
                    new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );

    }

};


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const setupMobileMenu = () => {

    const menuButton =
        get("mobileMenuBtn");


    const sidebar =
        get("sidebar");


    const overlay =
        get("sidebarOverlay");


    if (!menuButton) {
        return;
    }


    const close = () => {

        if (sidebar) {
            sidebar.classList.remove(
                "open"
            );
        }

        if (overlay) {
            overlay.classList.remove(
                "open"
            );
        }

    };


    menuButton.addEventListener(
        "click",
        () => {

            if (sidebar) {
                sidebar.classList.toggle(
                    "open"
                );
            }

            if (overlay) {
                overlay.classList.toggle(
                    "open"
                );
            }

        }
    );


    if (overlay) {

        overlay.addEventListener(
            "click",
            close
        );

    }


    document
        .querySelectorAll(
            ".sidebar a"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    close
                );

            }
        );

};


/* =========================================================
   SECTION NAVIGATION
========================================================= */

const setupNavigation = () => {

    const links =
        document.querySelectorAll(
            "[data-section]"
        );


    links.forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    const id =
                        link.dataset
                            .section;


                    if (!id) {
                        return;
                    }


                    const section =
                        get(id);


                    if (!section) {
                        return;
                    }


                    event.preventDefault();


                    document
                        .querySelectorAll(
                            "[data-section]"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    link.classList.add(
                        "active"
                    );


                    section.scrollIntoView({
                        behavior:
                            "smooth",
                        block:
                            "start"
                    });

                }
            );

        }
    );

};


/* =========================================================
   REALTIME ORDER UPDATES
========================================================= */

const setupRealtime = () => {

    if (!supabaseClient) {
        return;
    }


    supabaseClient
        .channel(
            "rs-photography-orders"
        )
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "orders"
            },
            payload => {

                console.log(
                    "ORDER UPDATE:",
                    payload
                );


                loadOrders();

            }
        )
        .subscribe();

};


/* =========================================================
   REFRESH BUTTON
========================================================= */

const setupRefresh = () => {

    const button =
        get("refreshOrders");


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            button.disabled =
                true;


            await loadOrders();


            setTimeout(
                () => {

                    button.disabled =
                        false;

                },
                500
            );

        }
    );

};


/* =========================================================
   DATE VALIDATION
========================================================= */

const setupDateInputs = () => {

    document
        .querySelectorAll(
            'input[type="date"]'
        )
        .forEach(
            input => {

                /*
                   Owner dashboard should normally
                   allow historical dates too, so we
                   intentionally do not force min=today.
                */

                input.addEventListener(
                    "change",
                    () => {

                        if (
                            input.value
                        ) {

                            input.classList.add(
                                "has-value"
                            );

                        }

                    }
                );

            }
        );

};


/* =========================================================
   PREVENT ACCIDENTAL FORM URL
========================================================= */

const preventPasswordInURL = () => {

    /*
       Older versions of the owner website could
       produce URLs like:

       ?email=...&password=...

       Remove those query parameters immediately.

       Passwords should never be stored in a URL.
    */

    const url =
        new URL(
            window.location.href
        );


    if (
        url.searchParams.has("password") ||
        url.searchParams.has("email")
    ) {

        url.searchParams.delete(
            "password"
        );

        url.searchParams.delete(
            "email"
        );


        window.history.replaceState(
            {},
            document.title,
            url.pathname +
            url.search +
            url.hash
        );

    }

};


/* =========================================================
   CURRENT YEAR
========================================================= */

const setYear = () => {

    const year =
        get("year");


    if (year) {

        year.textContent =
            new Date()
                .getFullYear();

    }

};


/* =========================================================
   GLOBAL ERROR HANDLING
========================================================= */

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


/* =========================================================
   APPLICATION START
========================================================= */

const startApplication = async () => {

    /*
       First remove the old insecure
       email/password URL.
    */

    preventPasswordInURL();


    setYear();


    /*
       These are UI-only and must never
       block the application.
    */

    setupLoginForm();

    setupLogout();

    setupModal();

    setupSearch();

    setupStatusFilter();

    setupCalendarNavigation();

    setupMobileMenu();

    setupNavigation();

    setupRefresh();

    setupDateInputs();


    /*
       Initial UI state.
    */

    showLoginScreen();

    renderCalendar();


    try {

        setLoading(
            true,
            "Connecting..."
        );


        /*
           Create Supabase client.
        */

        await initializeSupabase();


        console.log(
            "Supabase client initialized."
        );


        /*
           Check current login session.
           If already logged in, the user
           goes directly to dashboard.
        */

        const loggedIn =
            await checkSession();


        /*
           Listen for login/logout changes.
        */

        listenForAuthChanges();


        /*
           If already logged in,
           load dashboard data.
        */

        if (loggedIn) {

            updateUserDetails();

            await loadOrders();

            updateDashboard();

            setupRealtime();

        }


        /*
           Connection test is deliberately
           non-blocking.
        */

        testConnection()
            .then(
                connected => {

                    if (connected) {

                        console.log(
                            "Supabase connection working."
                        );

                    } else {

                        console.warn(
                            "Supabase connection check failed."
                        );

                    }

                }
            )
            .catch(
                error => {

                    console.warn(
                        "Connection check:",
                        error
                    );

                }
            );


    } catch (error) {

        /*
           CRITICAL:

           Never leave the user stuck on
           an infinite loading screen.
        */

        console.error(
            "APPLICATION START ERROR:",
            error
        );


        showLoginScreen();


        showMessage(
            "The website could not connect to Supabase. Check your internet connection.",
            "error"
        );


    } finally {

        /*
           ALWAYS stop loader.
        */

        setLoading(
            false
        );

    }

};


/* =========================================================
   DOM START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startApplication,
        {
            once: true
        }
    );

} else {

    startApplication();

}


/* =========================================================
   EMERGENCY LOADER FALLBACK
========================================================= */

/*
   Even if another unrelated JavaScript error
   happens, never trap the owner in a permanent
   loading screen.
*/

setTimeout(
    () => {

        const loader =
            get("appLoader");


        if (loader) {

            loader.classList.remove(
                "show"
            );

        }

    },
    5000
);