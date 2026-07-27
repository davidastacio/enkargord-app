const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Firebase Admin Setup
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const matchKey = envContent.match(/FIREBASE_ADMIN_PRIVATE_KEY="([\s\S]+?)"\n/);
const privateKey = matchKey ? matchKey[1].replace(/\\n/g, '\n') : null;

const serviceAccount = {
  projectId: "enkargord-app-2026",
  clientEmail: "firebase-adminsdk-fbsvc@enkargord-app-2026.iam.gserviceaccount.com",
  privateKey: privateKey,
};

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

// 2. Supabase Setup
const supabaseUrl = "https://wwyqgftbhirgwvjjlivw.supabase.co";
const supabaseKey = "sb_publishable_2mFHA8eLsIk__qkdf4Ykgg_M826A27u";
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log("=== STEP 1: Deleting orders from Firebase Firestore ===");
  const firestoreSnapshot = await db.collection('orders').get();
  console.log(`Found ${firestoreSnapshot.docs.length} orders in Firestore.`);
  
  const batch = db.batch();
  firestoreSnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  if (firestoreSnapshot.docs.length > 0) {
    await batch.commit();
    console.log("Deleted all orders from Firestore!");
  }

  console.log("\n=== STEP 2: Deleting orders from Supabase ===");
  const { data: delEvents, error: errEvents } = await supabase
    .from('order_events')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Deleted order_events:", errEvents ? errEvents.message : "Success");

  const { data: delOrders, error: errOrders } = await supabase
    .from('orders')
    .delete()
    .neq('id', 'CLEAR_ALL_SENTINEL_DUMMY_ID');
  console.log("Deleted orders from Supabase:", errOrders ? errOrders.message : "Success");

  const { count: supabaseCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });
  
  const postFirestoreSnapshot = await db.collection('orders').get();
  
  console.log("\n=== VERIFICATION RESULTS ===");
  console.log(`Firestore remaining orders: ${postFirestoreSnapshot.docs.length}`);
  console.log(`Supabase remaining orders: ${supabaseCount}`);
  console.log("============================");
}

main().catch(console.error);
