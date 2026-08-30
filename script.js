/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   FINAL CLEAN JAVASCRIPT
   Supabase + Auth + Orders + Calendar
========================================================= */

"use strict";

/* =========================================================
   SUPABASE CONFIG
========================================================= */

const SUPABASE_URL =
    "https://dazguesfusfmvgfwuqnk.supabase.com";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_XLh3Lg_a3mgpJ4T";

let supabaseClient = null;


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =====================================================
       ELEMENTS
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

    const themeBtn =
        document.getElementById("themeBtn");

    const loginMessage =
        document.getElementById("loginMessage");

    const dashboardMessage =
        document.getElementById(
            "dashboardMessage"
        );


    /* =====================================================
       HELPERS
    ===================================================== */

    const $ = selector =>
        document.querySelector(selector);


    const $$ = selector =>
        Array.from(
            document.querySelectorAll(selector)
        );


    const showLoader = () => {

        if (loader) {

            loader.classList.remove(
                "hide"
            );

        }

    };


    const hideLoader = () => {

        if (!loader) {
            return;
        }

        loader.classList.add(
            "hide"
        );

    };


    const showLoginMessage = (
        message,
        type = "error"
    ) => {

        if (!loginMessage) {
            return;
        }

        loginMessage.textContent =
            message;

        loginMessage.className =
            "login-message";

        if (type) {

            loginMessage.classList.add(
                type
            );

        }

    };


    const showDashboardMessage = (
        message,
        type = "success"
    ) => {

        if (!dashboardMessage) {
            return;
        }

        dashboardMessage.textContent =
            message;

        dashboardMessage.className =
            "dashboard-message";

        if (type) {

            dashboardMessage.classList.add(
                type
            );

        }

        setTimeout(() => {

            dashboardMessage.textContent =
                "";

            dashboardMessage.className =
                "dashboard-message";

        }, 4000);

    };


    /* =====================================================
       INITIALIZE SUPABASE
    ===================================================== */

    try {

        if (
            typeof window.supabase ===
            "undefined"
        ) {

            throw new Error(
                "Supabase library not loaded."
            );

        }


        supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );


        console.log(
            "Supabase client initialized."
        );

    } catch (error) {

        console.error(
            "Supabase initialization error:",
            error
        );

        showLoginMessage(
            "Supabase could not be initialized.",
            "error"
        );

        hideLoader();

        return;

    }


    /* =====================================================
       THEME
    ===================================================== */

    const savedTheme =
        localStorage.getItem(
            "rs-owner-theme"
        );


    if (
        savedTheme === "light"
    ) {

        document.body.classList.add(
            "light"
        );

    } else {

        document.body.classList.add(
            "dark"
        );

    }


    const updateThemeIcon = () => {

        if (!themeBtn) {
            return;
        }

        const isLight =
            document.body.classList.contains(
                "light"
            );

        themeBtn.textContent =
            isLight
                ? "☾"
                : "☀";

    };


    updateThemeIcon();


    if (themeBtn) {

        themeBtn.addEventListener(
            "click",
            () => {

                const isLight =
                    document.body.classList.toggle(
                        "light"
                    );


                document.body.classList.toggle(
                    "dark",
                    !isLight
                );


                localStorage.setItem(
                    "rs-owner-theme",
                    isLight
                        ? "light"
                        : "dark"
                );


                updateThemeIcon();

            }
        );

    }


    /* =====================================================
       AUTH UI
    ===================================================== */

    const showLoginScreen = () => {

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


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    const getCurrentUser = async () => {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getUser();


            if (error) {

                console.error(
                    "Get user error:",
                    error
                );

                return null;

            }


            return data?.user || null;

        } catch (error) {

            console.error(
                "Unexpected user error:",
                error
            );

            return null;

        }

    };


    /* =====================================================
       LOAD EXISTING SESSION
    ===================================================== */

    const checkSession = async () => {

        try {

            const {
                data,
                error
            } =
                await supabaseClient.auth
                    .getSession();


            if (error) {

                console.error(
                    "Session error:",
                    error
                );

                showLoginScreen();

                return;

            }


            if (
                data &&
                data.session
            ) {

                showDashboard();

                await loadDashboard();

            } else {

                showLoginScreen();

            }

        } catch (error) {

            console.error(
                "Session check failed:",
                error
            );

            showLoginScreen();

        }

    };


    /* =====================================================
       AUTH STATE LISTENER
    ===================================================== */

    supabaseClient.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Auth event:",
                event
            );


            if (
                event ===
                "SIGNED_IN"
            ) {

                showDashboard();

                /*
                   Do not put heavy database
                   work inside the auth callback
                   directly.
                */

                setTimeout(
                    loadDashboard,
                    0
                );

            }


            if (
                event ===
                "SIGNED_OUT"
            ) {

                showLoginScreen();

            }

        }
    );


    /* =====================================================
       LOGIN
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                if (
                    !supabaseClient
                ) {

                    showLoginMessage(
                        "Database connection unavailable.",
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


                if (
                    !email ||
                    !password
                ) {

                    showLoginMessage(
                        "Enter your email and password.",
                        "error"
                    );

                    return;

                }


                const submitButton =
                    loginForm.querySelector(
                        'button[type="submit"]'
                    );


                const originalText =
                    submitButton
                        ? submitButton.textContent
                        : "Login";


                if (submitButton) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Signing in...";

                }


                showLoginMessage(
                    "Checking your account...",
                    "loading"
                );


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient.auth
                            .signInWithPassword({
                                email,
                                password
                            });


                    if (error) {

                        console.error(
                            "Login error:",
                            error
                        );


                        showLoginMessage(
                            "Login failed. Check your email and password.",
                            "error"
                        );

                        return;

                    }


                    if (
                        !data ||
                        !data.session
                    ) {

                        showLoginMessage(
                            "Login completed, but no session was created.",
                            "error"
                        );

                        return;

                    }


                    console.log(
                        "LOGIN SUCCESSFUL"
                    );


                    showLoginMessage(
                        "Login successful.",
                        "success"
                    );


                    showDashboard();


                    await loadDashboard();


                } catch (error) {

                    console.error(
                        "Unexpected login error:",
                        error
                    );


                    showLoginMessage(
                        "Something went wrong while logging in.",
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


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                try {

                    logoutBtn.disabled =
                        true;

                    logoutBtn.textContent =
                        "Logging out...";


                    const {
                        error
                    } =
                        await supabaseClient.auth
                            .signOut();


                    if (error) {

                        console.error(
                            "Logout error:",
                            error
                        );

                        showDashboardMessage(
                            "Logout failed.",
                            "error"
                        );

                        return;

                    }


                    showLoginScreen();


                    if (loginForm) {

                        loginForm.reset();

                    }


                } catch (error) {

                    console.error(
                        "Unexpected logout error:",
                        error
                    );

                } finally {

                    logoutBtn.disabled =
                        false;

                    logoutBtn.textContent =
                        "Logout";

                }

            }
        );

    }


    /* =====================================================
       SIDEBAR
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

        if (menuBtn) {

            menuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    };


    const openSidebar = () => {

        if (sidebar) {

            sidebar.classList.add(
                "open"
            );

        }

        if (overlay) {

            overlay.classList.add(
                "open"
            );

        }

        if (menuBtn) {

            menuBtn.setAttribute(
                "aria-expanded",
                "true"
            );

        }

    };


    if (menuBtn) {

        menuBtn.addEventListener(
            "click",
            () => {

                const isOpen =
                    sidebar?.classList.contains(
                        "open"
                    );

                if (isOpen) {

                    closeSidebar();

                } else {

                    openSidebar();

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


    $$(".sidebar-link").forEach(
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
       SECTION NAVIGATION
    ===================================================== */

    $$(".sidebar-link").forEach(
        link => {

            link.addEventListener(
                "click",
                event => {

                    const target =
                        link.dataset.target;


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    $$(
                        ".dashboard-section"
                    ).forEach(section => {

                        section.classList.remove(
                            "active"
                        );

                    });


                    const section =
                        document.getElementById(
                            target
                        );


                    if (section) {

                        section.classList.add(
                            "active"
                        );

                    }


                    $$(".sidebar-link")
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    link.classList.add(
                        "active"
                    );

                }
            );

        }
    );


    /* =====================================================
       ORDERS
    ===================================================== */

    let allOrders = [];


    const ordersTable =
        $("#ordersTableBody");


    const orderSearch =
        $("#orderSearch");


    const orderStatusFilter =
        $("#orderStatusFilter");


    const formatDate = dateString => {

        if (!dateString) {
            return "—";
        }


        const date =
            new Date(
                `${dateString}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

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


    const escapeHTML = value => {

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

    };


    const renderOrders = (
        orders = allOrders
    ) => {

        if (!ordersTable) {
            return;
        }


        if (
            !orders ||
            orders.length === 0
        ) {

            ordersTable.innerHTML = `
                <tr>
                    <td
                        colspan="7"
                        class="empty-state"
                    >
                        No orders found.
                    </td>
                </tr>
            `;

            return;

        }


        ordersTable.innerHTML =
            orders.map(order => {

                const status =
                    String(
                        order.status ||
                        "pending"
                    ).toLowerCase();


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    order.customer_name
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                order.phone
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.function_type
                            )}
                        </td>

                        <td>
                            ${formatDate(
                                order.booking_date
                            )}
                        </td>

                        <td>
                            ${escapeHTML(
                                order.booking_time
                            )}
                        </td>

                        <td>
                            <span
                                class="status status-${escapeHTML(
                                    status
                                )}"
                            >
                                ${escapeHTML(
                                    status
                                )}
                            </span>
                        </td>

                        <td>

                            <button
                                type="button"
                                class="table-action"
                                data-order-id="${escapeHTML(
                                    order.id
                                )}"
                            >
                                View
                            </button>

                        </td>

                    </tr>
                `;

            }).join("");


        $$(".table-action").forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.orderId;


                        const order =
                            allOrders.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(id)
                            );


                        if (order) {

                            showOrderDetails(
                                order
                            );

                        }

                    }
                );

            }
        );

    };


    const loadOrders = async () => {

        if (!ordersTable) {
            return;
        }


        ordersTable.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="loading-state"
                >
                    Loading orders...
                </td>
            </tr>
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


                ordersTable.innerHTML = `
                    <tr>
                        <td
                            colspan="7"
                            class="error-state"
                        >
                            Could not load orders.
                        </td>
                    </tr>
                `;

                return;

            }


            allOrders =
                Array.isArray(data)
                    ? data
                    : [];


            renderOrders(
                allOrders
            );


            updateDashboardStats();

            renderCalendar();

        } catch (error) {

            console.error(
                "Unexpected orders error:",
                error
            );

        }

    };


    /* =====================================================
       ORDER SEARCH
    ===================================================== */

    const filterOrders = () => {

        const search =
            String(
                orderSearch?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const status =
            String(
                orderStatusFilter?.value ||
                "all"
            ).toLowerCase();


        const filtered =
            allOrders.filter(
                order => {

                    const searchable =
                        [
                            order.customer_name,
                            order.phone,
                            order.location,
                            order.function_type,
                            order.booking_date,
                            order.booking_time,
                            order.status
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
                        String(
                            order.status ||
                            "pending"
                        ).toLowerCase() ===
                        status;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );


        renderOrders(
            filtered
        );

    };


    if (orderSearch) {

        orderSearch.addEventListener(
            "input",
            filterOrders
        );

    }


    if (orderStatusFilter) {

        orderStatusFilter.addEventListener(
            "change",
            filterOrders
        );

    }


    /* =====================================================
       ORDER DETAILS
    ===================================================== */

    const orderModal =
        $("#orderModal");


    const orderModalContent =
        $("#orderModalContent");


    const closeOrderModal = () => {

        if (orderModal) {

            orderModal.classList.remove(
                "open"
            );

        }

    };


    const showOrderDetails = order => {

        if (
            !orderModal ||
            !orderModalContent
        ) {
            return;
        }


        orderModalContent.innerHTML = `

            <div class="order-details">

                <div class="detail-row">
                    <span>Customer</span>
                    <strong>
                        ${escapeHTML(
                            order.customer_name
                        )}
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Phone</span>
                    <strong>
                        ${escapeHTML(
                            order.phone
                        )}
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Location</span>
                    <strong>
                        ${escapeHTML(
                            order.location
                        )}
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Function</span>
                    <strong>
                        ${escapeHTML(
                            order.function_type
                        )}
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Date</span>
                    <strong>
                        ${formatDate(
                            order.booking_date
                        )}
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Time</span>
                    <strong>
                        ${escapeHTML(
                            order.booking_time
                        )}
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Expected Amount</span>
                    <strong>
                        ${
                            order.expected_money
                                ? "₹" +
                                  escapeHTML(
                                      order.expected_money
                                  )
                                : "Not provided"
                        }
                    </strong>
                </div>

                <div class="detail-row">
                    <span>Status</span>
                    <strong>
                        ${escapeHTML(
                            order.status ||
                            "pending"
                        )}
                    </strong>
                </div>

                <div class="detail-notes">

                    <span>Notes</span>

                    <p>
                        ${
                            escapeHTML(
                                order.notes ||
                                "No notes provided."
                            )
                        }
                    </p>

                </div>

            </div>

        `;


        orderModal.classList.add(
            "open"
        );

    };


    $$(".order-modal-close").forEach(
        button => {

            button.addEventListener(
                "click",
                closeOrderModal
            );

        }
    );


    if (orderModal) {

        orderModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    orderModal
                ) {

                    closeOrderModal();

                }

            }
        );

    }


    /* =====================================================
       DASHBOARD STATS
    ===================================================== */

    const updateDashboardStats = () => {

        const total =
            allOrders.length;


        const pending =
            allOrders.filter(
                order =>
                    String(
                        order.status ||
                        "pending"
                    ).toLowerCase() ===
                    "pending"
            ).length;


        const confirmed =
            allOrders.filter(
                order =>
                    String(
                        order.status ||
                        ""
                    ).toLowerCase() ===
                    "confirmed"
            ).length;


        const completed =
            allOrders.filter(
                order =>
                    String(
                        order.status ||
                        ""
                    ).toLowerCase() ===
                    "completed"
            ).length;


        const statTotal =
            $("#statTotal");


        const statPending =
            $("#statPending");


        const statConfirmed =
            $("#statConfirmed");


        const statCompleted =
            $("#statCompleted");


        if (statTotal) {

            statTotal.textContent =
                total;

        }


        if (statPending) {

            statPending.textContent =
                pending;

        }


        if (statConfirmed) {

            statConfirmed.textContent =
                confirmed;

        }


        if (statCompleted) {

            statCompleted.textContent =
                completed;

        }

    };


    /* =====================================================
       PROFESSIONAL CALENDAR
    ===================================================== */

    const calendarGrid =
        $("#calendarGrid");


    const calendarTitle =
        $("#calendarTitle");


    const calendarPrev =
        $("#calendarPrev");


    const calendarNext =
        $("#calendarNext");


    const today =
        new Date();


    let calendarDate =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


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


    const renderCalendar = () => {

        if (!calendarGrid) {
            return;
        }


        const year =
            calendarDate.getFullYear();


        const month =
            calendarDate.getMonth();


        if (calendarTitle) {

            calendarTitle.textContent =
                `${monthNames[month]} ${year}`;

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


        const previousMonthDays =
            new Date(
                year,
                month,
                0
            ).getDate();


        let html = "";


        /*
           Previous month cells
        */

        for (
            let i = firstDay - 1;
            i >= 0;
            i--
        ) {

            html += `
                <div
                    class="calendar-day muted-day"
                >
                    ${
                        previousMonthDays -
                        i
                    }
                </div>
            `;

        }


        /*
           Current month
        */

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            const dateKey =
                `${year}-${String(
                    month + 1
                ).padStart(
                    2,
                    "0"
                )}-${String(
                    day
                ).padStart(
                    2,
                    "0"
                )}`;


            const dayOrders =
                allOrders.filter(
                    order =>
                        order.booking_date ===
                        dateKey
                );


            const isToday =
                today.getFullYear() ===
                    year &&
                today.getMonth() ===
                    month &&
                today.getDate() ===
                    day;


            html += `

                <button
                    type="button"
                    class="
                        calendar-day
                        ${
                            isToday
                                ? "today"
                                : ""
                        }
                        ${
                            dayOrders.length
                                ? "has-orders"
                                : ""
                        }
                    "
                    data-date="${dateKey}"
                >

                    <span>
                        ${day}
                    </span>

                    ${
                        dayOrders.length
                            ? `
                                <small>
                                    ${dayOrders.length}
                                </small>
                              `
                            : ""
                    }

                </button>

            `;

        }


        calendarGrid.innerHTML =
            html;


        $$(".calendar-day[data-date]")
            .forEach(dayButton => {

                dayButton.addEventListener(
                    "click",
                    () => {

                        const date =
                            dayButton.dataset.date;


                        const orders =
                            allOrders.filter(
                                order =>
                                    order.booking_date ===
                                    date
                            );


                        if (
                            orders.length ===
                            0
                        ) {

                            showDashboardMessage(
                                `No bookings on ${formatDate(date)}.`,
                                "info"
                            );

                            return;

                        }


                        renderOrders(
                            orders
                        );


                        showDashboardMessage(
                            `${orders.length} booking(s) on ${formatDate(date)}.`,
                            "success"
                        );

                    }
                );

            });

    };


    if (calendarPrev) {

        calendarPrev.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() -
                    1
                );


                renderCalendar();

            }
        );

    }


    if (calendarNext) {

        calendarNext.addEventListener(
            "click",
            () => {

                calendarDate.setMonth(
                    calendarDate.getMonth() +
                    1
                );


                renderCalendar();

            }
        );

    }


    /* =====================================================
       NEW ORDER FORM
    ===================================================== */

    const newOrderForm =
        $("#newOrderForm");


    if (newOrderForm) {

        newOrderForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const formData =
                    new FormData(
                        newOrderForm
                    );


                const booking = {

                    customer_name:
                        String(
                            formData.get(
                                "customer_name"
                            ) || ""
                        ).trim(),

                    phone:
                        String(
                            formData.get(
                                "phone"
                            ) || ""
                        ).trim(),

                    location:
                        String(
                            formData.get(
                                "location"
                            ) || ""
                        ).trim(),

                    booking_date:
                        String(
                            formData.get(
                                "booking_date"
                            ) || ""
                        ).trim(),

                    booking_time:
                        String(
                            formData.get(
                                "booking_time"
                            ) || ""
                        ).trim(),

                    function_type:
                        String(
                            formData.get(
                                "function_type"
                            ) || ""
                        ).trim(),

                    expected_money:
                        Number(
                            formData.get(
                                "expected_money"
                            ) || 0
                        ) || null,

                    notes:
                        String(
                            formData.get(
                                "notes"
                            ) || ""
                        ).trim() ||
                        null,

                    status:
                        "pending"

                };


                if (
                    !booking.customer_name ||
                    !booking.phone ||
                    !booking.booking_date ||
                    !booking.booking_time ||
                    !booking.function_type
                ) {

                    showDashboardMessage(
                        "Please complete all required fields.",
                        "error"
                    );

                    return;

                }


                try {

                    const {
                        data,
                        error
                    } =
                        await supabaseClient
                            .from("orders")
                            .insert(
                                booking
                            )
                            .select()
                            .single();


                    if (error) {

                        console.error(
                            "Create order error:",
                            error
                        );


                        showDashboardMessage(
                            "Could not save the order.",
                            "error"
                        );

                        return;

                    }


                    console.log(
                        "Order created:",
                        data
                    );


                    newOrderForm.reset();


                    showDashboardMessage(
                        "Order saved successfully.",
                        "success"
                    );


                    await loadOrders();


                } catch (error) {

                    console.error(
                        "Unexpected create order error:",
                        error
                    );


                    showDashboardMessage(
                        "Unexpected error while saving order.",
                        "error"
                    );

                }

            }
        );

    }


    /* =====================================================
       TODAY BUTTON
    ===================================================== */

    const todayBtn =
        $("#calendarToday");


    if (todayBtn) {

        todayBtn.addEventListener(
            "click",
            () => {

                calendarDate =
                    new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );


                renderCalendar();

            }
        );

    }


    /* =====================================================
       REFRESH BUTTON
    ===================================================== */

    const refreshBtn =
        $("#refreshOrders");


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                refreshBtn.disabled =
                    true;


                try {

                    await loadOrders();

                } finally {

                    refreshBtn.disabled =
                        false;

                }

            }
        );

    }


    /* =====================================================
       USER INFORMATION
    ===================================================== */

    const userEmail =
        $("#userEmail");


    const loadUserInformation =
        async () => {

            const user =
                await getCurrentUser();


            if (
                user &&
                userEmail
            ) {

                userEmail.textContent =
                    user.email || "";

            }

        };


    /* =====================================================
       DASHBOARD LOADER
    ===================================================== */

    async function loadDashboard() {

        try {

            await loadUserInformation();

            await loadOrders();

            renderCalendar();

            updateDashboardStats();

        } catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );


            showDashboardMessage(
                "Dashboard could not load completely.",
                "error"
            );

        }

    }


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeSidebar();

                closeOrderModal();

            }

        }
    );


    /* =====================================================
       START APPLICATION
    ===================================================== */

    await checkSession();


    /* =====================================================
       FINAL LOADER
    ===================================================== */

    setTimeout(
        hideLoader,
        300
    );


    console.log(
        "RS Photography Owner Dashboard initialized."
    );

});