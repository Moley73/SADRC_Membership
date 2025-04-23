import { supabaseAdmin } from '../../lib/supabaseClient';
import dayjs from 'dayjs';

/**
 * This API endpoint checks for expired memberships and updates their status.
 * It should be called by a scheduled task (cron job or Netlify function) daily.
 * 
 * Security: This endpoint requires a secret key to prevent unauthorized access.
 */
export default async function handler(req, res) {
  try {
    // Verify the request has the correct secret key
    const { secret } = req.query;
    
    if (!secret || secret !== process.env.MEMBERSHIP_CHECK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get today's date in YYYY-MM-DD format
    const today = dayjs().format('YYYY-MM-DD');
    
    // Find all active memberships that have expired
    const { data: expiredMemberships, error: fetchError } = await supabaseAdmin
      .from('members')
      .select('id, email, first_name, surname, membership_status, payment_status, membership_expiry')
      .eq('membership_status', 'active')
      .lt('membership_expiry', today);
    
    if (fetchError) {
      console.error('Error fetching expired memberships:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }
    
    console.log(`Found ${expiredMemberships?.length || 0} expired memberships to update`);
    
    // Update each expired membership
    const updatePromises = [];
    const updatedMembers = [];
    
    if (expiredMemberships && expiredMemberships.length > 0) {
      for (const member of expiredMemberships) {
        console.log(`Updating expired membership for ${member.email} (expired on ${member.membership_expiry})`);
        
        const updatePromise = supabaseAdmin
          .from('members')
          .update({
            membership_status: 'expired',
            payment_status: 'unpaid',
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id);
        
        updatePromises.push(updatePromise);
        updatedMembers.push({
          id: member.id,
          email: member.email,
          name: `${member.first_name} ${member.surname}`,
          expiry_date: member.membership_expiry
        });
      }
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
    }
    
    return res.status(200).json({
      success: true,
      checked_at: new Date().toISOString(),
      expired_count: expiredMemberships?.length || 0,
      updated_members: updatedMembers
    });
  } catch (error) {
    console.error('Unexpected error in membership check:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
