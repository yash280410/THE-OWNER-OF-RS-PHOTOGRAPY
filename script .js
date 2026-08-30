

/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   PREMIUM / CLASSIC
   SUPABASE CONNECTION
========================================================= */

"use strict";

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://dazguesfusfmvgfwuqnk.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_XLh3Lg_a3mgpJ4T";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const loginScreen =
        document.getElementById("loginScreen");

    const dashboard =
        document.getElementById("dashboard");

    const loginForm =
        document.getElementById("loginForm");

    const emailInput =
        document.getElementById("loginEmail");

    const passwordInput =
        document.getElementById("loginPassword");

    const loginMessage =
        document.getElementById("loginMessage");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const ordersContainer =
        document.getElementById("ordersContainer");

    const orderCount =
        document.getElementById("orderCount");

    const pendingCount =
        document.getElementById("pendingCount");

    const confirmedCount =
        document.getElementById("confirmedCount");


    /* =====================================================
       SCREEN CONTROL
    ===================================================== */

    function showLogin() {

        if (loginScreen) {
            loginScreen.classList.remove("hidden");
        }

        if (dashboard) {
            dashboard.classList.add("hidden");
        }

    }


    function showDashboard() {

        if (loginScreen) {
            loginScreen.classList.add("hidden");
        }

        if (dashboard) {
            dashboard.classList.remove("hidden");
        }

    }


    /* =====================================================
       LOGIN MESSAGE
    ===================================================== */

    function showLoginMessage(
        message,
        type = "error"
    ) {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent =
            message;

        loginMessage.className =
            "login-message";

        loginMessage.classList.add(
            type
        );

    }


    /* =====================================================
       CHECK CURRENT SESSION
    ===================================================== */

    async function checkSession() {

        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .auth
                    .getSession();


            if (error) {

                console.error(
                    "Session error:",
                    error
                );

                showLogin();

                return;

            }


            if (
                data &&
                data.session
            ) {

                showDashboard();

                await loadDashboard();

            } else {

                showLogin();

            }

        } catch (error) {

            console.error(
                "Session check failed:",
                error
            );

            showLogin();

        }

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const email =
                    emailInput
                        ? emailInput.value.trim()
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                if (
                    !email ||
                    !password
                ) {

                    showLoginMessage(
                        "Enter your email and password."
                    );

                    return;

                }


                const submitButton =
                    loginForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Signing in...";

                }


                showLoginMessage(
                    "Checking account...",
                    "info"
                );


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .auth
                            .signInWithPassword({

                                email:
                                    email,

                                password:
                                    password

                            });


                    if (error) {

                        console.error(
                            "Login error:",
                            error
                        );

                        showLoginMessage(
                            "Invalid login details."
                        );

                        return;

                    }


                    if (
                        !data ||
                        !data.session
                    ) {

                        showLoginMessage(
                            "Login failed. No active session."
                        );

                        return;

                    }


                    showLoginMessage(
                        "Login successful.",
                        "success"
                    );


                    showDashboard();

                    await loadDashboard();


                } catch (error) {

                    console.error(
                        "Login exception:",
                        error
                    );

                    showLoginMessage(
                        "Something went wrong while signing in."
                    );

                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Login";

                    }

                }

            }
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                try {

                    const {
                        error
                    } =
                        await supabaseClient
                            .auth
                            .signOut();


                    if (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                        return;

                    }


                    showLogin();


                } catch (error) {

                    console.error(
                        "Logout failed:",
                        error
                    );

                }

            }
        );

    }


    /* =====================================================
       AUTH STATE LISTENER
    ===================================================== */

    supabaseClient
        .auth
        .onAuthStateChange(
            async (
                event,
                session
            ) => {

                console.log(
                    "Auth event:",
                    event
                );


                if (session) {

                    showDashboard();

                    /*
                       Avoid unnecessary reload
                       during normal token refresh.
                    */

                    if (
                        event ===
                        "SIGNED_IN"
                    ) {

                        await loadDashboard();

                    }

                } else {

                    showLogin();

                }

            }
        );


    /* =====================================================
       LOAD DASHBOARD
    ===================================================== */

    async function loadDashboard() {

        console.log(
            "Loading owner dashboard..."
        );


        await loadOrders();

        updateDashboardDate();

    }


    /* =====================================================
       LOAD ORDERS
    ===================================================== */

    async function loadOrders() {

        if (!ordersContainer) {
            return;
        }


        ordersContainer.innerHTML =
            `
            <div class="dashboard-loading">
                <div class="loading-circle"></div>
                <p>Loading orders...</p>
            </div>
            `;


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
                    "Orders error:",
                    error
                );

                ordersContainer.innerHTML =
                    `
                    <div class="empty-state">
                        <h3>Unable to load orders</h3>
                        <p>
                            Check your Supabase table
                            and RLS policies.
                        </p>
                    </div>
                    `;

                return;

            }


            const orders =
                data || [];


            updateStatistics(
                orders
            );


            renderOrders(
                orders
            );


        } catch (error) {

            console.error(
                "Order loading failed:",
                error
            );

            ordersContainer.innerHTML =
                `
                <div class="empty-state">
                    <h3>Something went wrong</h3>
                </div>
                `;

        }

    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    function updateStatistics(
        orders
    ) {

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


        if (orderCount) {

            orderCount.textContent =
                total;

        }


        if (pendingCount) {

            pendingCount.textContent =
                pending;

        }


        if (confirmedCount) {

            confirmedCount.textContent =
                confirmed;

        }

    }


    /* =====================================================
       RENDER ORDERS
    ===================================================== */

    function renderOrders(
        orders
    ) {

        if (!ordersContainer) {
            return;
        }


        if (orders.length === 0) {

            ordersContainer.innerHTML =
                `
                <div class="empty-state">
                    <h3>No orders yet</h3>
                    <p>
                        New customer bookings
                        will appear here.
                    </p>
                </div>
                `;

            return;

        }


        ordersContainer.innerHTML =
            orders
                .map(
                    order =>
                        createOrderHTML(
                            order
                        )
                )
                .join("");


        attachOrderActions();

    }


    /* =====================================================
       ORDER CARD
    ===================================================== */

    function createOrderHTML(
        order
    ) {

        const name =
            escapeHTML(
                order.customer_name ||
                "Unknown Customer"
            );


        const phone =
            escapeHTML(
                order.phone ||
                "-"
            );


        const location =
            escapeHTML(
                order.location ||
                "-"
            );


        const functionType =
            escapeHTML(
                order.function_type ||
                "-"
            );


        const date =
            formatDate(
                order.booking_date
            );


        const time =
            escapeHTML(
                order.booking_time ||
                "-"
            );


        const money =
            order.expected_money !==
            null &&
            order.expected_money !==
            undefined
                ? "₹" +
                  Number(
                      order.expected_money
                  ).toLocaleString(
                      "en-IN"
                  )
                : "Not specified";


        const notes =
            escapeHTML(
                order.notes ||
                "No additional notes."
            );


        const status =
            String(
                order.status ||
                "pending"
            ).toLowerCase();


        return `
            <article
                class="order-card"
                data-order-id="${order.id || ""}"
            >

                <div class="order-top">

                    <div>
                        <span class="order-label">
                            CUSTOMER
                        </span>

                        <h3>
                            ${name}
                        </h3>
                    </div>

                    <span
                        class="order-status ${status}"
                    >
                        ${status}
                    </span>

                </div>


                <div class="order-details">

                    <div>
                        <small>FUNCTION</small>
                        <strong>
                            ${functionType}
                        </strong>
                    </div>

                    <div>
                        <small>DATE</small>
                        <strong>
                            ${date}
                        </strong>
                    </div>

                    <div>
                        <small>TIME</small>
                        <strong>
                            ${time}
                        </strong>
                    </div>

                    <div>
                        <small>EXPECTED BUDGET</small>
                        <strong>
                            ${money}
                        </strong>
                    </div>

                    <div>
                        <small>PHONE</small>
                        <strong>
                            ${phone}
                        </strong>
                    </div>

                    <div>
                        <small>LOCATION</small>
                        <strong>
                            ${location}
                        </strong>
                    </div>

                </div>


                <div class="order-notes">

                    <small>NOTES</small>

                    <p>
                        ${notes}
                    </p>

                </div>


                <div class="order-actions">

                    <button
                        class="order-action confirm"
                        data-action="confirmed"
                        data-id="${order.id || ""}"
                    >
                        Confirm
                    </button>

                    <button
                        class="order-action complete"
                        data-action="completed"
                        data-id="${order.id || ""}"
                    >
                        Complete
                    </button>

                    <button
                        class="order-action cancel"
                        data-action="cancelled"
                        data-id="${order.id || ""}"
                    >
                        Cancel
                    </button>

                </div>

            </article>
        `;

    }


    /* =====================================================
       ORDER ACTIONS
    ===================================================== */

    function attachOrderActions() {

        const buttons =
            document.querySelectorAll(
                ".order-action"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const orderId =
                            button.dataset.id;


                        const newStatus =
                            button.dataset.action;


                        if (!orderId) {

                            console.error(
                                "Missing order ID."
                            );

                            return;

                        }


                        await updateOrderStatus(
                            orderId,
                            newStatus
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       UPDATE ORDER STATUS
    ===================================================== */

    async function updateOrderStatus(
        orderId,
        status
    ) {

        try {

            const {
                error
            } =
                await supabaseClient
                    .from("orders")
                    .update({

                        status:
                            status

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

                alert(
                    "Could not update order."
                );

                return;

            }


            await loadOrders();


        } catch (error) {

            console.error(
                "Status update failed:",
                error
            );

        }

    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(
        dateString
    ) {

        if (!dateString) {
            return "-";
        }


        const date =
            new Date(
                dateString +
                "T00:00:00"
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return escapeHTML(
                dateString
            );

        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric"
            }
        );

    }


    /* =====================================================
       DASHBOARD DATE
    ===================================================== */

    function updateDashboardDate() {

        const element =
            document.getElementById(
                "dashboardDate"
            );


        if (!element) {
            return;
        }


        element.textContent =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday:
                        "long",

                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric"
                }
            );

    }


    /* =====================================================
       ESCAPE HTML
       IMPORTANT FOR CUSTOMER DATA
    ===================================================== */

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


    /* =====================================================
       START
    ===================================================== */

    checkSession();


    console.log(
        "RS Photography Owner Dashboard loaded."
    );

});