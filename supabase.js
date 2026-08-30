/* =========================================================
   RS PHOTOGRAPHY
   OWNER WEBSITE
   SUPABASE CLIENT
   ========================================================= */

"use strict";

(function () {

    const SUPABASE_URL =
        "https://dazguesfusfmvgfwuqnk.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_oZnvdj_k5vp8_gK_XhL3Lg_a3mgpJ4T";


    /* ---------------------------------------------------------
       CHECK SUPABASE LIBRARY
       --------------------------------------------------------- */

    if (
        !window.supabase ||
        typeof window.supabase.createClient !== "function"
    ) {

        console.error(
            "Supabase JavaScript library was not loaded."
        );

        window.supabaseClient = null;

        return;
    }


    /* ---------------------------------------------------------
       CREATE CLIENT
       --------------------------------------------------------- */

    try {

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {
                        autoRefreshToken: true,
                        persistSession: true,
                        detectSessionInUrl: false
                    }
                }
            );


        console.log(
            "✅ Supabase client initialized."
        );


    } catch (error) {

        console.error(
            "❌ Supabase client initialization failed:",
            error
        );

        window.supabaseClient = null;

    }

})();