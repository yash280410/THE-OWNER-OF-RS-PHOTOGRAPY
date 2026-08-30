/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   SUPABASE.JS
   ---------------------------------------------------------
   Purpose:
   - Initialize Supabase
   - Persistent authentication
   - Auto refresh sessions
   - Make supabaseClient available to script.js

   IMPORTANT:
   - NEVER put database password here.
   - NEVER put a service_role/secret key here.
   - Only use the publishable/anon frontend key.
========================================================= */

"use strict";


/* =========================================================
   SUPABASE CONFIGURATION
========================================================= */

const RS_SUPABASE_URL =
    "https://dazguesfusfmvgfwuqnk.supabase.co";

const RS_SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_Xh3Lg_a3mgpJ4T";


/* =========================================================
   CLIENT INITIALIZATION
========================================================= */

(function initializeSupabase() {

    try {

        /* Check Supabase library */

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.error(
                "RS Photography: Supabase library was not loaded."
            );

            window.supabaseClient = null;

            return;
        }


        /* Create client */

        window.supabaseClient =
            window.supabase.createClient(
                RS_SUPABASE_URL,
                RS_SUPABASE_PUBLISHABLE_KEY,
                {
                    auth: {

                        /*
                         * Keep owner logged in after refresh.
                         */
                        persistSession: true,

                        /*
                         * Automatically refresh expired
                         * access tokens.
                         */
                        autoRefreshToken: true,

                        /*
                         * Allows Supabase to process
                         * authentication URL parameters.
                         */
                        detectSessionInUrl: true
                    },

                    global: {

                        headers: {
                            "x-application-name":
                                "RS-Photography-Owner"
                        }

                    }
                }
            );


        console.log(
            "RS Photography: Supabase client initialized."
        );


        /*
         * Helpful global connection state.
         */
        window.rsSupabaseReady = true;


    } catch (error) {

        console.error(
            "RS Photography: Supabase initialization failed:",
            error
        );

        window.supabaseClient = null;

        window.rsSupabaseReady = false;

    }

})();