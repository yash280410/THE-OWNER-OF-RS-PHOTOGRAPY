

/* =========================================================
   RS PHOTOGRAPHY
   OWNER DASHBOARD
   SUPABASE CONNECTION
========================================================= */

"use strict";

/*
 * Supabase project URL
 *
 * IMPORTANT:
 * Replace this ONLY if your actual Supabase project URL
 * is different.
 */
const SUPABASE_URL =
    "https://YOUR-PROJECT-REF.supabase.co";


/*
 * Supabase publishable key
 *
 * This is safe to use in browser-side code when your
 * database is correctly protected with Row Level Security.
 */
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oZnvdj_k5vp8_gK_Xh3Lg_a3mgpJ4T";


/* =========================================================
   CONNECTION CHECK
========================================================= */

if (
    typeof window.supabase === "undefined"
) {

    console.error(
        "RS Photography: Supabase library was not loaded."
    );

} else {

    /*
     * Create the client used by script.js
     */
    window.supabaseClient =
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


    console.log(
        "RS Photography: Supabase client initialized."
    );

}