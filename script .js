/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   CLEAN PROFESSIONAL JAVASCRIPT
========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SUPABASE CONFIG
    ===================================================== */

    const SUPABASE_URL =
        "https://dazguesfusfmvgfwuqnk.supabase.com";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_oZnvdj_k5vp8_gK_XLh3Lg_a3mgpJ4T";

    let supabaseClient = null;

    if (
        typeof window.supabase !== "undefined" &&
        window.supabase.createClient
    ) {

        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

    } else {

        console.error(
            "Supabase JavaScript library is not loaded."
        );

    }


    /* =====================================================
       DOM ELEMENTS
    ===================================================== */

    const loader =
        document.getElementById("loader");

    const loginScreen =
        document.getElementById("loginScreen");

    const dashboard =
        document.getElementById("dashboard");

    const loginForm =
        document.getElementById("loginForm");

    const logoutBtn =
        document.getElementById("logoutBtn");

    const menuBtn =
        document.getElementById("menuBtn");

    const sidebar =
        document.getElementById("sidebar");

    const overlay =
        document.getElementById("sidebarOverlay");

    const orderForm =
        document.getElementById("orderForm");

    const orderList =
        document.getElementById("orderList");

    const calendarGrid =
        document.getElementById("calendarGrid");

    const calendarTitle =
        document.getElementById("calendarTitle");

    const previousMonthBtn =
        document.getElementById("previousMonth");

    const nextMonthBtn =
        document.getElementById("nextMonth");

    const todayBtn =
        document.getElementById("todayBtn");

    const searchInput =
        document.getElementById("orderSearch");

    const statusFilter =
        document.getElementById("statusFilter");

    const eventFilter =
        document.getElementById("eventFilter");

    const totalOrders =
        document.getElementById("totalOrders");

    const pendingOrders =
        document.getElementById("pendingOrders");

    const confirmedOrders =
        document.getElementById("confirmedOrders");

    const completedOrders =
        document.getElementById("completedOrders");

    const modal =
        document.getElementById("orderModal");

    const modalClose =
        document.getElementById("modalClose");

    const modalBody =
        document.getElementById("modalBody");

    const toast =
        document.getElementById("toast");

    const currentDateElement =
        document.getElementById("currentDate");


    /* =====================================================
       STATE
    ===================================================== */

    let orders = [];

    let filteredOrders = [];

    let selectedOrder = null;

    let currentCalendarDate =
        new Date();

    let toastTimer = null;


    /* =====================================================
       HELPERS
    ===================================================== */

    const escapeHTML = value => {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    };


    const formatDate = dateString => {

        if (!dateString) {
            return "Not specified";
        }

        const date =
            new Date(
                `${dateString}T00:00:00`
            );

        if (Number.isNaN(date.getTime())) {
            return dateString;
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


    const formatMoney = amount => {

        if (
            amount === null ||
            amount === undefined ||
            amount === ""
        ) {

            return "Not specified";

        }

        const number =
            Number(amount);

        if (!Number.isFinite(number)) {
            return String(amount);
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


    const normalizeStatus = status => {

        return String(
            status || "pending"
        )
            .trim()
            .toLowerCase();

    };


    const showToast = (
        message,
        type = "success"
    ) => {

        if (!toast) {
            return;
        }

        toast.textContent =
            message;

        toast.className =
            `toast ${type} show`;

        clearTimeout(toastTimer);

        toastTimer =
            setTimeout(() => {

                toast.classList.remove(
                    "show"
                );

            }, 3500);

    };


    /* =====================================================
       LOADER
    ===================================================== */

    const hideLoader = () => {

        if (!loader) {
            return;
        }

        loader.classList.add("hide");

        setTimeout(() => {

            loader.remove();

        }, 500);

    };


    /* =====================================================
       CURRENT DATE
    ===================================================== */

    if (currentDateElement) {

        currentDateElement.textContent =
            new Date().toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            );

    }


    /* =====================================================
       AUTH
    ===================================================== */

    const showLogin = () => {

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

        hideLoader();

    };


    const showDashboard = () => {

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

        hideLoader();

    };


    const checkAuthentication =
        async () => {

            if (!supabaseClient) {

                showLogin();

                showToast(
                    "Supabase connection is unavailable.",
                    "error"
                );

                return;

            }


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

                await loadOrders();

            } else {

                showLogin();

            }

        };


    /* =====================================================
       AUTH STATE LISTENER
    ===================================================== */

    if (supabaseClient) {

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

                        await loadOrders();

                    } else {

                        showLogin();

                    }

                }
            );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                if (!supabaseClient) {

                    showToast(
                        "Supabase is not connected.",
                        "error"
                    );

                    return;

                }


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


                const button =
                    loginForm.querySelector(
                        'button[type="submit"]'
                    );


                if (!email || !password) {

                    showToast(
                        "Enter your email and password.",
                        "error"
                    );

                    return;

                }


                if (button) {

                    button.disabled =
                        true;

                    button.textContent =
                        "Signing in...";

                }


                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({
                            email,
                            password
                        });


                if (error) {

                    console.error(
                        "Login error:",
                        error
                    );

                    showToast(
                        "Login failed. Check your credentials.",
                        "error"
                    );

                    if (button) {

                        button.disabled =
                            false;

                        button.textContent =
                            "Sign In";

                    }

                    return;

                }


                showToast(
                    "Welcome back.",
                    "success"
                );


                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "Sign In";

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

                if (!supabaseClient) {
                    return;
                }


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

                    showToast(
                        "Could not log out.",
                        "error"
                    );

                    return;

                }


                orders = [];

                filteredOrders = [];

                showLogin();

            }
        );

    }


    /* =====================================================
       LOAD ORDERS
    ===================================================== */

    const loadOrders =
        async () => {

            if (!supabaseClient) {
                return;
            }


            if (orderList) {

                orderList.innerHTML =
                    `
                    <div class="empty-state">
                        Loading orders...
                    </div>
                    `;

            }


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
                    "Load orders error:",
                    error
                );


                showToast(
                    "Orders could not be loaded.",
                    "error"
                );


                if (orderList) {

                    orderList.innerHTML =
                        `
                        <div class="empty-state">
                            Unable to load orders.
                        </div>
                        `;

                }

                return;

            }


            orders =
                Array.isArray(data)
                    ? data
                    : [];


            filteredOrders =
                [...orders];


            updateStatistics();

            renderOrders();

            renderCalendar();

            populateEventFilter();

        };


    /* =====================================================
       REALTIME ORDERS
    ===================================================== */

    if (supabaseClient) {

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
                        "Order change:",
                        payload.eventType
                    );


                    loadOrders();

                }
            )
            .subscribe();

    }


    /* =====================================================
       STATISTICS
    ===================================================== */

    const updateStatistics =
        () => {

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


            if (totalOrders) {
                totalOrders.textContent =
                    total;
            }


            if (pendingOrders) {
                pendingOrders.textContent =
                    pending;
            }


            if (confirmedOrders) {
                confirmedOrders.textContent =
                    confirmed;
            }


            if (completedOrders) {
                completedOrders.textContent =
                    completed;
            }

        };


    /* =====================================================
       RENDER ORDERS
    ===================================================== */

    const renderOrders = () => {

        if (!orderList) {
            return;
        }


        if (
            filteredOrders.length === 0
        ) {

            orderList.innerHTML =
                `
                <div class="empty-state">
                    <strong>No orders found</strong>
                    <span>
                        New customer bookings will appear here.
                    </span>
                </div>
                `;

            return;

        }


        orderList.innerHTML =
            filteredOrders
                .map(
                    order => {

                        const status =
                            normalizeStatus(
                                order.status
                            );


                        return `
                        <article
                            class="order-card"
                            data-order-id="${escapeHTML(order.id)}"
                        >

                            <div class="order-main">

                                <div class="order-avatar">
                                    ${escapeHTML(
                                        String(
                                            order.customer_name ||
                                            "C"
                                        )
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </div>

                                <div class="order-content">

                                    <div class="order-title-row">

                                        <h3>
                                            ${escapeHTML(
                                                order.customer_name ||
                                                "Unnamed Customer"
                                            )}
                                        </h3>

                                        <span
                                            class="status status-${escapeHTML(status)}"
                                        >
                                            ${escapeHTML(
                                                status
                                            )}
                                        </span>

                                    </div>

                                    <p class="order-event">
                                        ${escapeHTML(
                                            order.function_type ||
                                            "Photography Booking"
                                        )}
                                    </p>

                                    <div class="order-meta">

                                        <span>
                                            📅
                                            ${escapeHTML(
                                                formatDate(
                                                    order.booking_date
                                                )
                                            )}
                                        </span>

                                        <span>
                                            🕐
                                            ${escapeHTML(
                                                order.booking_time ||
                                                "Not specified"
                                            )}
                                        </span>

                                        <span>
                                            📍
                                            ${escapeHTML(
                                                order.location ||
                                                "Not specified"
                                            )}
                                        </span>

                                    </div>

                                </div>

                            </div>

                            <div class="order-side">

                                <strong>
                                    ${escapeHTML(
                                        formatMoney(
                                            order.expected_money
                                        )
                                    )}
                                </strong>

                                <button
                                    class="view-order-btn"
                                    type="button"
                                    data-id="${escapeHTML(order.id)}"
                                >
                                    View
                                </button>

                            </div>

                        </article>
                        `;

                    }
                )
                .join("");

    };


    /* =====================================================
       ORDER SEARCH
    ===================================================== */

    const applyFilters = () => {

        const search =
            String(
                searchInput?.value || ""
            )
                .trim()
                .toLowerCase();


        const status =
            String(
                statusFilter?.value || "all"
            )
                .toLowerCase();


        const eventType =
            String(
                eventFilter?.value || "all"
            )
                .toLowerCase();


        filteredOrders =
            orders.filter(
                order => {

                    const searchable =
                        [
                            order.customer_name,
                            order.phone,
                            order.location,
                            order.function_type,
                            order.booking_date,
                            order.booking_time,
                            order.notes
                        ]
                            .join(" ")
                            .toLowerCase();


                    const matchesSearch =
                        !search ||
                        searchable.includes(
                            search
                        );


                    const matchesStatus =
                        status === "all" ||
                        normalizeStatus(
                            order.status
                        ) === status;


                    const matchesEvent =
                        eventType === "all" ||
                        String(
                            order.function_type ||
                            ""
                        )
                            .toLowerCase() ===
                        eventType;


                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesEvent
                    );

                }
            );


        renderOrders();

    };


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            applyFilters
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    if (eventFilter) {

        eventFilter.addEventListener(
            "change",
            applyFilters
        );

    }


    /* =====================================================
       EVENT FILTER OPTIONS
    ===================================================== */

    const populateEventFilter =
        () => {

            if (!eventFilter) {
                return;
            }


            const current =
                eventFilter.value;


            const types =
                [
                    ...new Set(
                        orders
                            .map(
                                order =>
                                    order.function_type
                            )
                            .filter(Boolean)
                    )
                ]
                    .sort();


            eventFilter.innerHTML =
                `
                <option value="all">
                    All Events
                </option>
                `;


            types.forEach(
                type => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        type;

                    option.textContent =
                        type;

                    eventFilter.appendChild(
                        option
                    );

                }
            );


            if (
                types.includes(current)
            ) {

                eventFilter.value =
                    current;

            }

        };


    /* =====================================================
       ORDER DETAILS
    ===================================================== */

    const openOrder =
        orderId => {

            const order =
                orders.find(
                    item =>
                        String(
                            item.id
                        ) ===
                        String(orderId)
                );


            if (!order) {

                showToast(
                    "Order not found.",
                    "error"
                );

                return;

            }


            selectedOrder =
                order;


            if (!modal || !modalBody) {
                return;
            }


            modalBody.innerHTML =
                `
                <div class="order-detail">

                    <div class="detail-header">

                        <div>
                            <span class="detail-label">
                                CUSTOMER
                            </span>

                            <h2>
                                ${escapeHTML(
                                    order.customer_name ||
                                    "Unnamed Customer"
                                )}
                            </h2>
                        </div>

                        <span
                            class="status status-${escapeHTML(
                                normalizeStatus(
                                    order.status
                                )
                            )}"
                        >
                            ${escapeHTML(
                                normalizeStatus(
                                    order.status
                                )
                            )}
                        </span>

                    </div>


                    <div class="detail-grid">

                        <div class="detail-item">
                            <span>Function</span>
                            <strong>
                                ${escapeHTML(
                                    order.function_type ||
                                    "Not specified"
                                )}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Date</span>
                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        order.booking_date
                                    )
                                )}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Time</span>
                            <strong>
                                ${escapeHTML(
                                    order.booking_time ||
                                    "Not specified"
                                )}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Expected Amount</span>
                            <strong>
                                ${escapeHTML(
                                    formatMoney(
                                        order.expected_money
                                    )
                                )}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Phone</span>
                            <strong>
                                ${escapeHTML(
                                    order.phone ||
                                    "Not specified"
                                )}
                            </strong>
                        </div>

                        <div class="detail-item">
                            <span>Location</span>
                            <strong>
                                ${escapeHTML(
                                    order.location ||
                                    "Not specified"
                                )}
                            </strong>
                        </div>

                    </div>


                    <div class="detail-notes">

                        <span>
                            Customer Notes
                        </span>

                        <p>
                            ${escapeHTML(
                                order.notes ||
                                "No additional notes."
                            )}
                        </p>

                    </div>


                    <div class="detail-actions">

                        <label>
                            Update Status
                        </label>

                        <select
                            id="detailStatus"
                        >

                            <option
                                value="pending"
                                ${normalizeStatus(order.status) === "pending" ? "selected" : ""}
                            >
                                Pending
                            </option>

                            <option
                                value="confirmed"
                                ${normalizeStatus(order.status) === "confirmed" ? "selected" : ""}
                            >
                                Confirmed
                            </option>

                            <option
                                value="completed"
                                ${normalizeStatus(order.status) === "completed" ? "selected" : ""}
                            >
                                Completed
                            </option>

                            <option
                                value="cancelled"
                                ${normalizeStatus(order.status) === "cancelled" ? "selected" : ""}
                            >
                                Cancelled
                            </option>

                        </select>

                        <button
                            class="btn-primary"
                            id="saveStatusBtn"
                            type="button"
                        >
                            Save Status
                        </button>

                    </div>

                </div>
                `;


            modal.classList.add(
                "open"
            );


            document.body.classList.add(
                "no-scroll"
            );


            const saveStatusBtn =
                document.getElementById(
                    "saveStatusBtn"
                );


            if (saveStatusBtn) {

                saveStatusBtn.addEventListener(
                    "click",
                    updateSelectedOrderStatus
                );

            }

        };


    /* =====================================================
       ORDER LIST CLICK
    ===================================================== */

    if (orderList) {

        orderList.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".view-order-btn"
                    );


                const card =
                    event.target.closest(
                        ".order-card"
                    );


                if (button) {

                    openOrder(
                        button.dataset.id
                    );

                    return;

                }


                if (card) {

                    openOrder(
                        card.dataset.orderId
                    );

                }

            }
        );

    }


    /* =====================================================
       UPDATE ORDER STATUS
    ===================================================== */

    const updateSelectedOrderStatus =
        async () => {

            if (
                !selectedOrder ||
                !supabaseClient
            ) {
                return;
            }


            const statusSelect =
                document.getElementById(
                    "detailStatus"
                );


            if (!statusSelect) {
                return;
            }


            const newStatus =
                statusSelect.value;


            const {
                error
            } =
                await supabaseClient
                    .from("orders")
                    .update({
                        status:
                            newStatus
                    })
                    .eq(
                        "id",
                        selectedOrder.id
                    );


            if (error) {

                console.error(
                    "Status update error:",
                    error
                );


                showToast(
                    "Status could not be updated.",
                    "error"
                );

                return;

            }


            showToast(
                "Order status updated.",
                "success"
            );


            closeModal();

            await loadOrders();

        };


    /* =====================================================
       MODAL
    ===================================================== */

    const closeModal = () => {

        if (!modal) {
            return;
        }

        modal.classList.remove(
            "open"
        );

        document.body.classList.remove(
            "no-scroll"
        );

        selectedOrder =
            null;

    };


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeModal();

                }

            }
        );

    }


    /* =====================================================
       MANUAL ORDER
    ===================================================== */

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                if (!supabaseClient) {

                    showToast(
                        "Supabase is not connected.",
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
                        ) ||
                        formData.get(
                            "customer_name"
                        ) ||
                        ""
                    ).trim();


                const phone =
                    String(
                        formData.get(
                            "phone"
                        ) ||
                        ""
                    ).trim();


                const location =
                    String(
                        formData.get(
                            "location"
                        ) ||
                        ""
                    ).trim();


                const bookingDate =
                    String(
                        formData.get(
                            "date"
                        ) ||
                        formData.get(
                            "booking_date"
                        ) ||
                        ""
                    ).trim();


                const bookingTime =
                    String(
                        formData.get(
                            "time"
                        ) ||
                        formData.get(
                            "booking_time"
                        ) ||
                        ""
                    ).trim();


                const functionType =
                    String(
                        formData.get(
                            "function"
                        ) ||
                        formData.get(
                            "function_type"
                        ) ||
                        ""
                    ).trim();


                const expectedMoneyRaw =
                    String(
                        formData.get(
                            "budget"
                        ) ||
                        formData.get(
                            "expected_money"
                        ) ||
                        ""
                    ).trim();


                const notes =
                    String(
                        formData.get(
                            "message"
                        ) ||
                        formData.get(
                            "notes"
                        ) ||
                        ""
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
                        "Please complete all required fields.",
                        "error"
                    );

                    return;

                }


                let expectedMoney =
                    null;


                if (
                    expectedMoneyRaw
                ) {

                    expectedMoney =
                        Number(
                            expectedMoneyRaw
                        );


                    if (
                        !Number.isFinite(
                            expectedMoney
                        ) ||
                        expectedMoney < 0
                    ) {

                        showToast(
                            "Enter a valid expected amount.",
                            "error"
                        );

                        return;

                    }

                }


                const submitButton =
                    orderForm.querySelector(
                        'button[type="submit"]'
                    );


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Saving...";

                }


                const order = {

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
                        notes || null,

                    status:
                        "confirmed"

                };


                const {
                    error
                } =
                    await supabaseClient
                        .from("orders")
                        .insert(
                            order
                        );


                if (error) {

                    console.error(
                        "Manual order error:",
                        error
                    );


                    showToast(
                        "Order could not be saved.",
                        "error"
                    );


                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Save Order";

                    }

                    return;

                }


                showToast(
                    "Order saved successfully.",
                    "success"
                );


                orderForm.reset();


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Save Order";

                }


                await loadOrders();

            }
        );

    }


    /* =====================================================
       CALENDAR
    ===================================================== */

    const renderCalendar =
        () => {

            if (
                !calendarGrid ||
                !calendarTitle
            ) {
                return;
            }


            const year =
                currentCalendarDate
                    .getFullYear();


            const month =
                currentCalendarDate
                    .getMonth();


            calendarTitle.textContent =
                currentCalendarDate.toLocaleDateString(
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
                )
                    .getDay();


            const daysInMonth =
                new Date(
                    year,
                    month + 1,
                    0
                )
                    .getDate();


            const previousDays =
                new Date(
                    year,
                    month,
                    0
                )
                    .getDate();


            const cells = [];


            for (
                let i = firstDay - 1;
                i >= 0;
                i--
            ) {

                cells.push({
                    day:
                        previousDays - i,
                    outside:
                        true
                });

            }


            for (
                let day = 1;
                day <= daysInMonth;
                day++
            ) {

                cells.push({
                    day,
                    outside:
                        false
                });

            }


            while (
                cells.length % 7 !== 0
            ) {

                cells.push({
                    day:
                        cells.length -
                        daysInMonth -
                        firstDay +
                        1,
                    outside:
                        true
                });

            }


            calendarGrid.innerHTML =
                cells
                    .map(
                        cell => {

                            if (
                                cell.outside
                            ) {

                                return `
                                <div class="calendar-day outside">
                                    ${cell.day}
                                </div>
                                `;

                            }


                            const dateString =
                                `${year}-${String(month + 1).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;


                            const dayOrders =
                                orders.filter(
                                    order =>
                                        order.booking_date ===
                                        dateString
                                );


                            const today =
                                new Date();


                            const isToday =
                                today.getFullYear() === year &&
                                today.getMonth() === month &&
                                today.getDate() === cell.day;


                            return `
                            <div
                                class="
                                    calendar-day
                                    ${isToday ? "today" : ""}
                                    ${dayOrders.length ? "has-orders" : ""}
                                "
                                data-date="${dateString}"
                            >

                                <span class="calendar-number">
                                    ${cell.day}
                                </span>

                                <div class="calendar-events">

                                    ${dayOrders
                                        .slice(0, 3)
                                        .map(
                                            order =>
                                                `
                                                <button
                                                    type="button"
                                                    class="calendar-event"
                                                    data-id="${escapeHTML(order.id)}"
                                                >
                                                    ${escapeHTML(
                                                        order.customer_name ||
                                                        "Booking"
                                                    )}
                                                </button>
                                                `
                                        )
                                        .join("")}

                                    ${
                                        dayOrders.length > 3
                                            ? `
                                            <span class="more-events">
                                                +${dayOrders.length - 3} more
                                            </span>
                                            `
                                            : ""
                                    }

                                </div>

                            </div>
                            `;

                        }
                    )
                    .join("");

        };


    /* =====================================================
       CALENDAR EVENTS
    ===================================================== */

    if (calendarGrid) {

        calendarGrid.addEventListener(
            "click",
            event => {

                const eventButton =
                    event.target.closest(
                        ".calendar-event"
                    );


                if (eventButton) {

                    openOrder(
                        eventButton.dataset.id
                    );

                }

            }
        );

    }


    if (previousMonthBtn) {

        previousMonthBtn.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date(
                        currentCalendarDate
                            .getFullYear(),
                        currentCalendarDate
                            .getMonth() - 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (nextMonthBtn) {

        nextMonthBtn.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date(
                        currentCalendarDate
                            .getFullYear(),
                        currentCalendarDate
                            .getMonth() + 1,
                        1
                    );

                renderCalendar();

            }
        );

    }


    if (todayBtn) {

        todayBtn.addEventListener(
            "click",
            () => {

                currentCalendarDate =
                    new Date();

                renderCalendar();

            }
        );

    }


    /* =====================================================
       MOBILE SIDEBAR
    ===================================================== */

    const closeSidebar = () => {

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


    if (menuBtn) {

        menuBtn.addEventListener(
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

    }


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeSidebar
        );

    }


    document
        .querySelectorAll(
            "[data-section]"
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    () => {

                        closeSidebar();

                    }
                );

            }
        );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeModal();

                closeSidebar();

            }

        }
    );


    /* =====================================================
       AUTO REFRESH
       Backup in case realtime is unavailable
    ===================================================== */

    setInterval(
        async () => {

            if (
                dashboard &&
                !dashboard.classList.contains(
                    "hidden"
                )
            ) {

                await loadOrders();

            }

        },
        60000
    );


    /* =====================================================
       START APPLICATION
    ===================================================== */

    checkAuthentication();


    console.log(
        "RS Photography Owner Dashboard initialized."
    );

});