import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wlxgpvqfzrxzqaahwkmr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Cy_0-9phqaOgLf2GsW8_KQ_Hc_C1-or";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminLogin() {
  console.log("--- Testing Admin Login ---");
  const email = "quoreichfoundation@gmail.com";
  const password = "Admin123";

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("❌ Auth Error:", authError.message);
    return;
  }

  console.log("✅ Auth Success! User ID:", authData.user.id);
  console.log("JWT Role:", authData.session.user.app_metadata.role);

  console.log("\n--- Testing Edge Function admin-portal/dashboard ---");
  
  try {
    const { data: funcData, error: funcError } = await supabase.functions.invoke('admin-portal/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`
      }
    });

    if (funcError) {
      console.error("❌ Function Error:", funcError);
      if (funcError.context) {
         const text = await funcError.context.text();
         console.log("Response Body (Debug):", text);
      }
    } else {
      console.log("✅ Function Success! Dashboard data received:");
      console.log(JSON.stringify(funcData, null, 2));
    }
  } catch (err) {
    console.error("❌ Unexpected Error:", err);
  }
}

testAdminLogin();
