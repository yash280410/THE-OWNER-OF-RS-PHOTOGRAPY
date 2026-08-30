/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   MAIN JAVASCRIPT
   SUPABASE + AUTH + ORDERS + CALENDAR
========================================================= */

"use strict";


/* =========================================================
   01. SUPABASE CONFIGURATION
========================================================= */

const SUPABASE_URL =
    "https://dazguesfusfmvgfwuqnk.supabase.com";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_XhL3g_a3mgpJ4T";


/* =========================================================
   02. GLOBAL STATE
========================================================= */

let supabaseClient = null;

let orders = [];

let currentOrder = null;

let currentCalendarDate = new Date();

let currentView = "dashboard";

let authChecking = true;


/* =========================================================
   03. DOM HELPERS
========================================================= */

const $ = selector =>
    document.querySelector(selector);


const $$ = selector =>
    Array.from(document.querySelectorAll(selector));


/* =========================================================
   04. COMMON ELEMENTS
========================================================= */

const loader =
    $("#pageLoader") ||
    $(".page-loader");

const loginScreen =
    $("#loginScreen") ||
    $(".login-screen");

const app =
    $("#app") ||
    $(".app");

const loginForm =
    $("#loginForm");

const loginError =
    $("#loginError");

const logoutBtn =
    $("#logoutBtn");

const sidebar =
    $("#sidebar") ||
    $(".sidebar");

const sidebarOverlay =
    $("#sidebarOverlay") ||
    $(".sidebar-overlay");

const menuToggle =
    $("#menuToggle") ||
    $(".menu-toggle");

const toastContainer =
    $("#toastContainer") ||
    $(".toast-container");


/* =========================================================
   05. PAGE LOADER
========================================================= */

function hideLoader() {

    if (!loader) {
        return;
    }

    loader.classList.add("hidden");

}


/* =========================================================
   06. TOAST SYSTEM
========================================================= */

function showToast(message, type = "success") {

    if (!toastContainer) {
        console.log(`[${type}] ${message}`);
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    toastContainer.appendChild(
        toast
    );

    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform =
            "translateY(8px)";

        setTimeout(() => {

            toast.remove();

        }, 250);

    }, 3000);

}


/* =========================================================
   07. SUPABASE INITIALIZATION
========================================================= */

function initializeSupabase() {

    if (
        typeof window.supabase ===
        "undefined"
    ) {

        console.error(
            "Supabase JavaScript library not loaded."
        );

        showLoginError(
            "Supabase library could not be loaded."
        );

        return false;

    }


    try {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

        console.log(
            "Supabase client initialized."
        );

        return true;

    } catch (error) {

        console.error(
            "Supabase initialization error:",
            error
        );

        showLoginError(
            "Database connection could not be initialized."
        );

        return false;

    }

}


/* =========================================================
   08. LOGIN ERROR
========================================================= */

function showLoginError(message) {

    if (!loginError) {
        return;
    }

    loginError.textContent =
        message;

}


/* =========================================================
   09. SHOW LOGIN
========================================================= */

function showLoginScreen() {

    if (loginScreen) {

        loginScreen.classList.remove(
            "hidden"
        );

    }

    if (app) {

        app.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   10. SHOW APPLICATION
========================================================= */

function showApplication() {

    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

    }

    if (app) {

        app.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   11. AUTHENTICATION
========================================================= */

async function checkAuthentication() {

    if (!supabaseClient) {
        return false;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            console.error(
                "Session check failed:",
                error
            );

            return false;

        }


        if (
            data &&
            data.session
        ) {

            console.log(
                "Existing session found."
            );

            showApplication();

            return true;

        }


        showLoginScreen();

        return false;

    } catch (error) {

        console.error(
            "Authentication check error:",
            error
        );

        showLoginScreen();

        return false;

    }

}


/* =========================================================
   12. LOGIN
========================================================= */

async function loginUser(email, password) {

    if (!supabaseClient) {

        showLoginError(
            "Database connection unavailable."
        );

        return false;

    }


    showLoginError("");


    const submitButton =
        loginForm
            ? loginForm.querySelector(
                'button[type="submit"]'
            )
            : null;


    const originalText =
        submitButton
            ? submitButton.textContent
            : "";


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Signing in...";

    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email:
                    email.trim(),

                password:
                    password
            });


        if (error) {

            console.error(
                "Login failed:",
                error
            );

            showLoginError(
                "Login failed. Check your email and password."
            );

            return false;

        }


        if (
            !data ||
            !data.session
        ) {

            showLoginError(
                "Login completed but no session was created."
            );

            return false;

        }


        console.log(
            "LOGIN SUCCESSFUL"
        );


        showApplication();

        showToast(
            "Welcome back."
        );


        await loadOrders();

        return true;

    } catch (error) {

        console.error(
            "Login exception:",
            error
        );

        showLoginError(
            "Unable to sign in right now."
        );

        return false;

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                originalText;

        }

    }

}


/* =========================================================
   13. LOGIN FORM
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const formData =
                new FormData(
                    loginForm
                );


            const email =
                String(
                    formData.get(
                        "email"
                    ) || ""
                ).trim();


            const password =
                String(
                    formData.get(
                        "password"
                    ) || ""
                );


            if (
                !email ||
                !password
            ) {

                showLoginError(
                    "Enter your email and password."
                );

                return;

            }


            await loginUser(
                email,
                password
            );

        }
    );

}


/* =========================================================
   14. LOGOUT
========================================================= */

async function logoutUser() {

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
                "Logout failed:",
                error
            );

            showToast(
                "Logout failed.",
                "error"
            );

            return;

        }


        orders = [];

        currentOrder = null;


        showLoginScreen();


        showToast(
            "Logged out successfully."
        );

    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

    }

}


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        logoutUser
    );

}


/* =========================================================
   15. AUTH STATE LISTENER
========================================================= */

function setupAuthListener() {

    if (!supabaseClient) {
        return;
    }


    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            console.log(
                "AUTH EVENT:",
                event
            );


            if (
                event ===
                "SIGNED_IN"
            ) {

                showApplication();

            }


            if (
                event ===
                "SIGNED_OUT"
            ) {

                showLoginScreen();

            }

        }
    );

}


/* =========================================================
   16. ORDER TABLE
========================================================= */

const ordersTableBody =
    $("#ordersTableBody");

const orderCount =
    $("#orderCount");

const emptyOrders =
    $("#emptyOrders");


/* =========================================================
   17. LOAD ORDERS
========================================================= */

async function loadOrders() {

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
                )
                .order(
                    "booking_time",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "ORDER LOAD ERROR:",
                error
            );

            showToast(
                "Could not load orders.",
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

        console.log(
            `${orders.length} orders loaded.`
        );

    } catch (error) {

        console.error(
            "Unexpected order loading error:",
            error
        );

        showToast(
            "Unable to load orders.",
            "error"
        );

    }

}


/* =========================================================
   18. ESCAPE HTML
========================================================= */

function escapeHTML(value) {

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
   19. FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            dateValue
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


/* =========================================================
   20. FORMAT TIME
========================================================= */

function formatTime(timeValue) {

    if (!timeValue) {
        return "—";
    }


    const parts =
        String(
            timeValue
        ).split(":");


    if (
        parts.length < 2
    ) {

        return escapeHTML(
            timeValue
        );

    }


    let hour =
        Number(
            parts[0]
        );

    const minute =
        parts[1];


    if (
        !Number.isFinite(hour)
    ) {

        return escapeHTML(
            timeValue
        );

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
   21. STATUS CLASS
========================================================= */

function statusClass(status) {

    const normalized =
        String(
            status || "pending"
        )
            .toLowerCase();


    if (
        [
            "confirmed",
            "completed",
            "cancelled"
        ].includes(
            normalized
        )
    ) {

        return normalized;

    }


    return "pending";

}


/* =========================================================
   22. RENDER ORDERS
========================================================= */

function renderOrders(
    sourceOrders = orders
) {

    if (!ordersTableBody) {
        return;
    }


    ordersTableBody.innerHTML =
        "";


    if (
        !sourceOrders ||
        sourceOrders.length === 0
    ) {

        if (emptyOrders) {

            emptyOrders.style.display =
                "block";

        }

        return;

    }


    if (emptyOrders) {

        emptyOrders.style.display =
            "none";

    }


    sourceOrders.forEach(
        order => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    <span class="customer-name">
                        ${escapeHTML(
                            order.customer_name
                        )}
                    </span>
                </td>

                <td>
                    ${escapeHTML(
                        order.function_type
                    )}
                </td>

                <td>
                    <span class="order-date">
                        ${formatDate(
                            order.booking_date
                        )}
                    </span>
                </td>

                <td>
                    ${formatTime(
                        order.booking_time
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        order.location
                    )}
                </td>

                <td>
                    <span class="status ${statusClass(
                        order.status
                    )}">
                        ${escapeHTML(
                            order.status ||
                            "pending"
                        )}
                    </span>
                </td>

                <td>

                    <div class="action-group">

                        <button
                            class="icon-btn"
                            type="button"
                            title="View"
                            data-action="view"
                            data-id="${order.id}"
                        >
                            ◉
                        </button>

                        <button
                            class="icon-btn"
                            type="button"
                            title="Edit"
                            data-action="edit"
                            data-id="${order.id}"
                        >
                            ✎
                        </button>

                    </div>

                </td>

            `;


            ordersTableBody.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   23. ORDER TABLE ACTIONS
========================================================= */

if (ordersTableBody) {

    ordersTableBody.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-action]"
                );


            if (!button) {
                return;
            }


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            const order =
                orders.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );


            if (!order) {
                return;
            }


            if (
                action ===
                "view"
            ) {

                openOrderDetails(
                    order
                );

            }


            if (
                action ===
                "edit"
            ) {

                openOrderForm(
                    order
                );

            }

        }
    );

}


/* =========================================================
   24. DASHBOARD STATISTICS
========================================================= */

function updateDashboard() {

    const total =
        orders.length;


    const pending =
        orders.filter(
            order =>
                String(
                    order.status
                ).toLowerCase() ===
                "pending"
        ).length;


    const confirmed =
        orders.filter(
            order =>
                String(
                    order.status
                ).toLowerCase() ===
                "confirmed"
        ).length;


    const completed =
        orders.filter(
            order =>
                String(
                    order.status
                ).toLowerCase() ===
                "completed"
        ).length;


    setText(
        "#totalOrders",
        total
    );


    setText(
        "#pendingOrders",
        pending
    );


    setText(
        "#confirmedOrders",
        confirmed
    );


    setText(
        "#completedOrders",
        completed
    );


    if (orderCount) {

        orderCount.textContent =
            `${total} order${total === 1 ? "" : "s"}`;

    }

}


/* =========================================================
   25. SET TEXT HELPER
========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   26. SEARCH ORDERS
========================================================= */

const orderSearch =
    $("#orderSearch");


if (orderSearch) {

    orderSearch.addEventListener(
        "input",
        () => {

            const query =
                orderSearch.value
                    .trim()
                    .toLowerCase();


            if (!query) {

                renderOrders(
                    orders
                );

                return;

            }


            const filtered =
                orders.filter(
                    order => {

                        const searchable = [

                            order.customer_name,

                            order.phone,

                            order.location,

                            order.function_type,

                            order.status,

                            order.booking_date,

                            order.booking_time

                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                        return searchable.includes(
                            query
                        );

                    }
                );


            renderOrders(
                filtered
            );

        }
    );

}


/* =========================================================
   27. ORDER STATUS UPDATE
========================================================= */

async function updateOrderStatus(
    id,
    status
) {

    if (!supabaseClient) {
        return;
    }


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
                    id
                );


        if (error) {

            console.error(
                "STATUS UPDATE ERROR:",
                error
            );

            showToast(
                "Could not update status.",
                "error"
            );

            return;

        }


        const localOrder =
            orders.find(
                order =>
                    String(order.id) ===
                    String(id)
            );


        if (localOrder) {

            localOrder.status =
                status;

        }


        renderOrders();

        updateDashboard();

        renderCalendar();


        showToast(
            "Order status updated."
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Status update failed.",
            "error"
        );

    }

}


/* =========================================================
   28. MODAL HELPERS
========================================================= */

function openModal(modal) {

    if (!modal) {
        return;
    }


    modal.classList.add(
        "open"
    );


    document.body.classList.add(
        "no-scroll"
    );

}


function closeModal(modal) {

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   29. CLOSE ALL MODALS
========================================================= */

function closeAllModals() {

    $$(".modal.open")
        .forEach(
            modal =>
                closeModal(
                    modal
                )
        );

}


/* =========================================================
   30. ORDER DETAILS MODAL
========================================================= */

const orderDetailsModal =
    $("#orderDetailsModal");

const orderDetailsBody =
    $("#orderDetailsBody");


function openOrderDetails(
    order
) {

    if (
        !orderDetailsModal ||
        !orderDetailsBody
    ) {

        return;

    }


    currentOrder =
        order;


    orderDetailsBody.innerHTML = `

        <div class="details-grid">

            <div class="detail-item">
                <span class="detail-label">
                    Customer
                </span>

                <span class="detail-value">
                    ${escapeHTML(
                        order.customer_name
                    )}
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Phone
                </span>

                <span class="detail-value">
                    ${escapeHTML(
                        order.phone
                    )}
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Event
                </span>

                <span class="detail-value">
                    ${escapeHTML(
                        order.function_type
                    )}
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Location
                </span>

                <span class="detail-value">
                    ${escapeHTML(
                        order.location
                    )}
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Date
                </span>

                <span class="detail-value">
                    ${formatDate(
                        order.booking_date
                    )}
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Time
                </span>

                <span class="detail-value">
                    ${formatTime(
                        order.booking_time
                    )}
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Expected Amount
                </span>

                <span class="detail-value">
                    ${
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
                            : "Not provided"
                    }
                </span>
            </div>


            <div class="detail-item">
                <span class="detail-label">
                    Status
                </span>

                <span class="detail-value">
                    ${escapeHTML(
                        order.status ||
                        "pending"
                    )}
                </span>
            </div>


            <div
                class="detail-item"
                style="grid-column:1/-1;"
            >

                <span class="detail-label">
                    Notes
                </span>

                <span class="detail-value">
                    ${
                        order.notes
                            ? escapeHTML(
                                order.notes
                              )
                            : "No notes"
                    }
                </span>

            </div>

        </div>

        <div
            style="
                display:flex;
                flex-wrap:wrap;
                gap:8px;
                margin-top:20px;
            "
        >

            <button
                class="btn btn-success"
                type="button"
                data-status="confirmed"
            >
                Confirm
            </button>

            <button
                class="btn btn-dark"
                type="button"
                data-status="completed"
            >
                Complete
            </button>

            <button
                class="btn btn-danger"
                type="button"
                data-status="cancelled"
            >
                Cancel
            </button>

        </div>

    `;


    orderDetailsBody
        .querySelectorAll(
            "[data-status]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await updateOrderStatus(
                            order.id,
                            button.dataset.status
                        );


                        closeModal(
                            orderDetailsModal
                        );

                    }
                );

            }
        );


    openModal(
        orderDetailsModal
    );

}


/* =========================================================
   31. CLOSE DETAILS
========================================================= */

const closeDetails =
    $("#closeOrderDetails");


if (closeDetails) {

    closeDetails.addEventListener(
        "click",
        () =>
            closeModal(
                orderDetailsModal
            )
    );

}


/* =========================================================
   32. ORDER FORM
========================================================= */

const orderFormModal =
    $("#orderFormModal");

const orderForm =
    $("#orderForm");

const orderFormTitle =
    $("#orderFormTitle");


function openOrderForm(
    order = null
) {

    if (
        !orderFormModal ||
        !orderForm
    ) {

        return;

    }


    currentOrder =
        order;


    if (orderFormTitle) {

        orderFormTitle.textContent =
            order
                ? "Edit Order"
                : "New Order";

    }


    orderForm.reset();


    const setField = (
        name,
        value
    ) => {

        const field =
            orderForm.elements[name];


        if (field) {

            field.value =
                value ??
                "";

        }

    };


    if (order) {

        setField(
            "name",
            order.customer_name
        );

        setField(
            "phone",
            order.phone
        );

        setField(
            "location",
            order.location
        );

        setField(
            "date",
            order.booking_date
        );

        setField(
            "time",
            order.booking_time
        );

        setField(
            "function",
            order.function_type
        );

        setField(
            "budget",
            order.expected_money
        );

        setField(
            "message",
            order.notes
        );

        setField(
            "status",
            order.status
        );

    }


    openModal(
        orderFormModal
    );

}


/* =========================================================
   33. NEW ORDER BUTTONS
========================================================= */

$$("[data-new-order]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () =>
                    openOrderForm()
            );

        }
    );


/* =========================================================
   34. CLOSE ORDER FORM
========================================================= */

const closeOrderForm =
    $("#closeOrderForm");


const cancelOrderForm =
    $("#cancelOrderForm");


if (closeOrderForm) {

    closeOrderForm.addEventListener(
        "click",
        () =>
            closeModal(
                orderFormModal
            )
    );

}


if (cancelOrderForm) {

    cancelOrderForm.addEventListener(
        "click",
        () =>
            closeModal(
                orderFormModal
            )
    );

}


/* =========================================================
   35. SAVE ORDER
========================================================= */

if (orderForm) {

    orderForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!supabaseClient) {

                showToast(
                    "Database unavailable.",
                    "error"
                );

                return;

            }


            const formData =
                new FormData(
                    orderForm
                );


            const customerName =
                String(
                    formData.get(
                        "name"
                    ) || ""
                ).trim();


            const phone =
                String(
                    formData.get(
                        "phone"
                    ) || ""
                ).trim();


            const location =
                String(
                    formData.get(
                        "location"
                    ) || ""
                ).trim();


            const bookingDate =
                String(
                    formData.get(
                        "date"
                    ) || ""
                ).trim();


            const bookingTime =
                String(
                    formData.get(
                        "time"
                    ) || ""
                ).trim();


            const functionType =
                String(
                    formData.get(
                        "function"
                    ) || ""
                ).trim();


            const budgetRaw =
                String(
                    formData.get(
                        "budget"
                    ) || ""
                ).trim();


            const notes =
                String(
                    formData.get(
                        "message"
                    ) || ""
                ).trim();


            const status =
                String(
                    formData.get(
                        "status"
                    ) ||
                    "pending"
                ).trim();


            if (
                !customerName ||
                !phone ||
                !location ||
                !bookingDate ||
                !bookingTime ||
                !functionType
            ) {

                showToast(
                    "Fill in all required fields.",
                    "error"
                );

                return;

            }


            let expectedMoney =
                null;


            if (
                budgetRaw !== ""
            ) {

                expectedMoney =
                    Number(
                        budgetRaw
                    );


                if (
                    !Number.isFinite(
                        expectedMoney
                    ) ||
                    expectedMoney < 0
                ) {

                    showToast(
                        "Enter a valid amount.",
                        "error"
                    );

                    return;

                }

            }


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
                    expectedMoney,

                notes:
                    notes ||
                    null,

                status:
                    status ||
                    "pending"

            };


            const submitButton =
                orderForm.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Saving...";

            }


            try {

                let error = null;


                if (
                    currentOrder &&
                    currentOrder.id
                ) {

                    const result =
                        await supabaseClient
                            .from("orders")
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                currentOrder.id
                            );


                    error =
                        result.error;

                } else {

                    const result =
                        await supabaseClient
                            .from("orders")
                            .insert(
                                payload
                            );


                    error =
                        result.error;

                }


                if (error) {

                    console.error(
                        "SAVE ORDER ERROR:",
                        error
                    );

                    showToast(
                        "Order could not be saved.",
                        "error"
                    );

                    return;

                }


                showToast(
                    currentOrder
                        ? "Order updated."
                        : "Order created."
                );


                closeModal(
                    orderFormModal
                );


                currentOrder =
                    null;


                await loadOrders();

            } catch (error) {

                console.error(
                    error
                );

                showToast(
                    "Unexpected database error.",
                    "error"
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalText;

                }

            }

        }
    );

}


/* =========================================================
   36. CALENDAR ELEMENTS
========================================================= */

const calendarMonth =
    $("#calendarMonth");

const calendarGrid =
    $("#calendarGrid");

const calendarPrev =
    $("#calendarPrev");

const calendarNext =
    $("#calendarNext");

const calendarToday =
    $("#calendarToday");


/* =========================================================
   37. MONTH NAMES
========================================================= */

const monthNames = [

    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"

];


/* =========================================================
   38. RENDER CALENDAR
========================================================= */

function renderCalendar() {

    if (!calendarGrid) {
        return;
    }


    const year =
        currentCalendarDate.getFullYear();


    const month =
        currentCalendarDate.getMonth();


    if (calendarMonth) {

        calendarMonth.textContent =
            `${monthNames[month]} ${year}`;

    }


    calendarGrid.innerHTML =
        "";


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


            calendarGrid.appendChild(
                element
            );

        }
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


    const daysInPreviousMonth =
        new Date(
            year,
            month,
            0
        ).getDate();


    for (
        let i = firstDay - 1;
        i >= 0;
        i--
    ) {

        createCalendarDay(
            daysInPreviousMonth - i,
            true,
            year,
            month - 1
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        createCalendarDay(
            day,
            false,
            year,
            month
        );

    }


    const totalCells =
        calendarGrid
            .children
            .length;


    const remainder =
        totalCells % 7;


    if (remainder !== 0) {

        const nextDays =
            7 - remainder;


        for (
            let day = 1;
            day <= nextDays;
            day++
        ) {

            createCalendarDay(
                day,
                true,
                year,
                month + 1
            );

        }

    }

}


/* =========================================================
   39. CREATE CALENDAR DAY
========================================================= */

function createCalendarDay(
    day,
    otherMonth,
    year,
    month
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "calendar-day";


    if (otherMonth) {

        element.classList.add(
            "other-month"
        );

    }


    const actualDate =
        new Date(
            year,
            month,
            day
        );


    const isoDate =
        toISODate(
            actualDate
        );


    const today =
        new Date();


    if (
        isoDate ===
        toISODate(today)
    ) {

        element.classList.add(
            "today"
        );

    }


    const number =
        document.createElement(
            "span"
        );


    number.className =
        "day-number";


    number.textContent =
        day;


    element.appendChild(
        number
    );


    const dayOrders =
        orders.filter(
            order =>
                order.booking_date ===
                isoDate
        );


    dayOrders.forEach(
        order => {

            const event =
                document.createElement(
                    "div"
                );


            event.className =
                `calendar-event ${statusClass(
                    order.status
                )}`;


            event.textContent =
                `${formatTime(
                    order.booking_time
                )} • ${
                    order.customer_name ||
                    "Booking"
                }`;


            event.title =
                `${order.customer_name} - ${order.function_type}`;


            event.addEventListener(
                "click",
                eventClick => {

                    eventClick.stopPropagation();

                    openOrderDetails(
                        order
                    );

                }
            );


            element.appendChild(
                event
            );

        }
    );


    calendarGrid.appendChild(
        element
    );

}


/* =========================================================
   40. ISO DATE
========================================================= */

function toISODate(
    date
) {

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


/* =========================================================
   41. CALENDAR CONTROLS
========================================================= */

if (calendarPrev) {

    calendarPrev.addEventListener(
        "click",
        () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() - 1
            );

            renderCalendar();

        }
    );

}


if (calendarNext) {

    calendarNext.addEventListener(
        "click",
        () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() + 1
            );

            renderCalendar();

        }
    );

}


if (calendarToday) {

    calendarToday.addEventListener(
        "click",
        () => {

            currentCalendarDate =
                new Date();

            renderCalendar();

        }
    );

}


/* =========================================================
   42. SIDEBAR
========================================================= */

function openSidebar() {

    if (sidebar) {

        sidebar.classList.add(
            "open"
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.add(
            "show"
        );

    }

}


function closeSidebar() {

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            "show"
        );

    }

}


if (menuToggle) {

    menuToggle.addEventListener(
        "click",
        () => {

            if (
                sidebar &&
                sidebar.classList.contains(
                    "open"
                )
            ) {

                closeSidebar();

            } else {

                openSidebar();

            }

        }
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );

}


/* =========================================================
   43. NAVIGATION
========================================================= */

$$("[data-view]")
    .forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const viewName =
                        link.dataset.view;


                    if (!viewName) {
                        return;
                    }


                    switchView(
                        viewName
                    );


                    closeSidebar();

                }
            );

        }
    );


function switchView(
    viewName
) {

    currentView =
        viewName;


    $$(".view")
        .forEach(
            view => {

                view.classList.remove(
                    "active"
                );

            }
        );


    const target =
        document.getElementById(
            viewName
        );


    if (target) {

        target.classList.add(
            "active"
        );

    }


    $$("[data-view]")
        .forEach(
            link => {

                link.classList.toggle(
                    "active",
                    link.dataset.view ===
                    viewName
                );

            }
        );


    const title =
        $("[data-page-title]");


    if (title) {

        const titles = {

            dashboard:
                "Dashboard",

            orders:
                "Orders",

            calendar:
                "Calendar",

            contracts:
                "Contracts",

            gallery:
                "Gallery",

            settings:
                "Settings"

        };


        title.textContent =
            titles[viewName] ||
            "Dashboard";

    }

}


/* =========================================================
   44. CLOSE MODAL WITH X
========================================================= */

$$("[data-close-modal]")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const modal =
                        button.closest(
                            ".modal"
                        );


                    closeModal(
                        modal
                    );

                }
            );

        }
    );


/* =========================================================
   45. CLICK OUTSIDE MODAL
========================================================= */

$$(".modal")
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal(
                            modal
                        );

                    }

                }
            );

        }
    );


/* =========================================================
   46. ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        closeAllModals();

        closeSidebar();

    }
);


/* =========================================================
   47. REALTIME ORDER UPDATES
========================================================= */

function setupRealtime() {

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
                    "ORDER DATABASE UPDATE:",
                    payload
                );


                loadOrders();

            }
        )
        .subscribe(
            status => {

                console.log(
                    "Realtime status:",
                    status
                );

            }
        );

}


/* =========================================================
   48. AUTOMATIC REFRESH
========================================================= */

setInterval(
    () => {

        if (
            supabaseClient &&
            !document.hidden
        ) {

            loadOrders();

        }

    },
    60000
);


/* =========================================================
   49. WINDOW VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden &&
            supabaseClient
        ) {

            loadOrders();

        }

    }
);


/* =========================================================
   50. MINIMUM DATE FOR ORDER FORM
========================================================= */

function setMinimumBookingDate() {

    const dateInput =
        orderForm
            ? orderForm.elements["date"]
            : null;


    if (!dateInput) {
        return;
    }


    const today =
        new Date();


    dateInput.min =
        toISODate(
            today
        );

}


/* =========================================================
   51. INITIALIZATION
========================================================= */

async function initializeApp() {

    console.log(
        "RS Photography Owner Dashboard starting..."
    );


    const initialized =
        initializeSupabase();


    if (!initialized) {

        hideLoader();

        showLoginScreen();

        return;

    }


    setupAuthListener();


    const authenticated =
        await checkAuthentication();


    if (authenticated) {

        await loadOrders();

        setupRealtime();

        setMinimumBookingDate();

    }


    authChecking =
        false;


    hideLoader();


    console.log(
        "RS Photography Owner Dashboard ready."
    );

}


/* =========================================================
   52. START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApp,
        {
            once: true
        }
    );

} else {

    initializeApp();

}


/* =========================================================
   END
========================================================= */