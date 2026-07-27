const { createClient } = require('@supabase/supabase-js');

const url = "https://wwyqgftbhirgwvjjlivw.supabase.co";
const key = "sb_publishable_2mFHA8eLsIk__qkdf4Ykgg_M826A27u";

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log("Cleaning orders table in Supabase...");

  // Delete all order_events first (foreign key dependency)
  const { data: events, error: errEvents } = await supabase.from('order_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Deleted order_events:", events, errEvents);

  // Delete all orders
  const { data: orders, error: errOrders } = await supabase.from('orders').delete().neq('id', 'CLEAR_ALL_SENTINEL_DUMMY_ID');
  console.log("Deleted orders:", orders, errOrders);

  // Verify count
  const { count, error: errCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  console.log("Remaining orders count in DB:", count, errCount);
}

main().catch(console.error);
