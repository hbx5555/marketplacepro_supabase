// One-time cleanup script to remove duplicate offers
// Run this once to clean up existing duplicate offers in the database
// Keep only the most recent offer per buyer-item combination

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kpbzjbvjmfuqgvpvqzxl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwYnpqYnZqbWZ1cWd2cHZxenhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI5MTgsImV4cCI6MjA1MzczODkxOH0.Uj1yMFYqGFdwrEtLJqbcBBJDDdTIVvJPzQWCmYJhgaE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicateOffers() {
  console.log('🧹 Starting cleanup of duplicate offers...');
  
  try {
    // Fetch all pending offers
    const { data: offers, error } = await supabase
      .from('offers')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`📊 Found ${offers.length} total pending offers`);
    
    // Group by buyer_id + item_id combination
    const offerGroups = new Map();
    
    offers.forEach(offer => {
      const key = `${offer.buyer_id}_${offer.item_id}`;
      if (!offerGroups.has(key)) {
        offerGroups.set(key, []);
      }
      offerGroups.get(key).push(offer);
    });
    
    console.log(`👥 Found ${offerGroups.size} unique buyer-item combinations`);
    
    // Find duplicates to delete
    const offersToDelete = [];
    let duplicatesCount = 0;
    
    offerGroups.forEach((groupOffers, key) => {
      if (groupOffers.length > 1) {
        duplicatesCount++;
        // Keep the first one (most recent due to sorting), delete the rest
        const [keep, ...remove] = groupOffers;
        console.log(`🔍 ${key}: Keeping offer ${keep.id} (${keep.amount} ש"ח), removing ${remove.length} older offers`);
        offersToDelete.push(...remove.map(o => o.id));
      }
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`   - Total pending offers: ${offers.length}`);
    console.log(`   - Unique buyer-item combinations: ${offerGroups.size}`);
    console.log(`   - Combinations with duplicates: ${duplicatesCount}`);
    console.log(`   - Offers to delete: ${offersToDelete.length}`);
    
    if (offersToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${offersToDelete.length} duplicate offers...`);
      
      const { error: deleteError } = await supabase
        .from('offers')
        .delete()
        .in('id', offersToDelete);
      
      if (deleteError) throw deleteError;
      
      console.log('✅ Cleanup completed successfully!');
      console.log(`   - Deleted ${offersToDelete.length} duplicate offers`);
      console.log(`   - Remaining offers: ${offers.length - offersToDelete.length}`);
    } else {
      console.log('\n✨ No duplicates found! Database is clean.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupDuplicateOffers()
  .then(() => {
    console.log('\n🎉 Cleanup script finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup script failed:', error);
    process.exit(1);
  });
