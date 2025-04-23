import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with the service role key for admin operations
// This bypasses RLS policies and should only be used server-side
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Awards System Service
 * Handles all operations related to the awards system
 */
export const AwardsService = {
  /**
   * Get the current settings for the awards system
   */
  getSettings: async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('award_settings')
        .select('*')
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching award settings:', error);
      throw error;
    }
  },
  
  /**
   * Update the awards system settings
   * @param {Object} settings - The settings to update
   */
  updateSettings: async (settings) => {
    try {
      // Create a sanitized copy of the settings object
      const sanitizedSettings = { ...settings };
      
      // Validate and format date fields
      const dateFields = ['nomination_start_date', 'nomination_end_date', 'voting_start_date', 'voting_end_date'];
      
      for (const field of dateFields) {
        if (sanitizedSettings[field]) {
          try {
            // Ensure date is in valid format
            const date = new Date(sanitizedSettings[field]);
            if (isNaN(date.getTime())) {
              throw new Error(`Invalid date format for ${field}`);
            }
            // Keep the ISO string format
            sanitizedSettings[field] = date.toISOString();
          } catch (err) {
            console.error(`Error formatting ${field}:`, err);
            throw new Error(`Invalid date format for ${field}: ${err.message}`);
          }
        }
      }
      
      // Ensure active_year is an integer
      if (sanitizedSettings.active_year) {
        sanitizedSettings.active_year = parseInt(sanitizedSettings.active_year, 10);
        if (isNaN(sanitizedSettings.active_year)) {
          throw new Error('Active year must be a valid number');
        }
      }
      
      console.log('Updating award settings with sanitized data:', JSON.stringify(sanitizedSettings, null, 2));
      
      const { data, error } = await supabaseAdmin
        .from('award_settings')
        .update(sanitizedSettings)
        .eq('id', sanitizedSettings.id)
        .select()
        .single();
        
      if (error) {
        console.error('Supabase error updating settings:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating award settings:', error);
      throw error;
    }
  },
  
  /**
   * Change the current phase of the awards system
   * @param {string} phase - The new phase (inactive, nomination, voting, completed)
   * @param {string} settingsId - The ID of the settings record
   */
  changePhase: async (phase, settingsId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('award_settings')
        .update({ 
          current_phase: phase,
          updated_at: new Date().toISOString()
        })
        .eq('id', settingsId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error changing award phase:', error);
      throw error;
    }
  },
  
  /**
   * Get all award categories
   */
  getCategories: async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('award_categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching award categories:', error);
      throw error;
    }
  },
  
  /**
   * Create a nomination
   * @param {Object} nomination - The nomination details
   */
  createNomination: async (nomination) => {
    try {
      // Get current settings to ensure we're in nomination phase
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('award_settings')
        .select('*')
        .single();
        
      if (settingsError) throw settingsError;
      
      if (settings.current_phase !== 'nomination') {
        throw new Error('Nominations are not currently open');
      }
      
      // Create the nomination
      const { data, error } = await supabaseAdmin
        .from('award_nominations')
        .insert({
          ...nomination,
          status: 'pending',
          award_year: settings.active_year
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating nomination:', error);
      throw error;
    }
  },
  
  /**
   * Get nominations for a specific category
   * @param {string} categoryId - The category ID
   * @param {string} status - Filter by status (optional)
   */
  getNominations: async (categoryId, status = null) => {
    try {
      let query = supabaseAdmin
        .from('award_nominations')
        .select(`
          *,
          category:award_categories(name, description)
        `)
        .eq('category_id', categoryId);
        
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching nominations:', error);
      throw error;
    }
  },
  
  /**
   * Get all nominations
   * @param {string} status - Filter by status (optional)
   */
  getAllNominations: async (status = null) => {
    try {
      let query = supabaseAdmin
        .from('award_nominations')
        .select(`
          *,
          category:award_categories(name, description)
        `);
        
      // Add status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching all nominations:', error);
      throw error;
    }
  },
  
  /**
   * Update a nomination's status
   * @param {string} nominationId - The nomination ID
   * @param {string} status - The new status (pending, approved, rejected)
   */
  updateNominationStatus: async (nominationId, status) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('award_nominations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', nominationId)
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating nomination status:', error);
      throw error;
    }
  },
  
  /**
   * Cast a vote for a nomination
   * @param {string} nominationId - The nomination ID
   * @param {string} voterEmail - The voter's email
   */
  castVote: async (nominationId, voterEmail) => {
    try {
      // Get current settings to ensure we're in voting phase
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('award_settings')
        .select('*')
        .single();
        
      if (settingsError) throw settingsError;
      
      if (settings.current_phase !== 'voting') {
        throw new Error('Voting is not currently open');
      }
      
      // Get the nomination to check if it's approved
      const { data: nomination, error: nominationError } = await supabaseAdmin
        .from('award_nominations')
        .select('*')
        .eq('id', nominationId)
        .single();
        
      if (nominationError) throw nominationError;
      
      if (nomination.status !== 'approved') {
        throw new Error('Cannot vote for a nomination that is not approved');
      }
      
      // Check if user has already voted in this category
      const { data: existingVotes, error: existingVotesError } = await supabaseAdmin
        .from('award_votes')
        .select('id')
        .eq('voter_email', voterEmail)
        .eq('award_year', settings.active_year);
        
      if (existingVotesError) throw existingVotesError;
      
      // If user has already voted in this category, throw an error
      if (existingVotes.length > 0) {
        const { data: existingNominations, error: existingNominationsError } = await supabaseAdmin
          .from('award_nominations')
          .select('category_id')
          .in('id', existingVotes.map(vote => vote.nomination_id));
          
        if (existingNominationsError) throw existingNominationsError;
        
        if (existingNominations.some(nom => nom.category_id === nomination.category_id)) {
          throw new Error('You have already voted in this category');
        }
      }
      
      // Cast the vote
      const { data, error } = await supabaseAdmin
        .from('award_votes')
        .insert({
          nomination_id: nominationId,
          voter_email: voterEmail,
          award_year: settings.active_year
        })
        .select()
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  },
  
  /**
   * Get vote counts for nominations
   * @param {string} categoryId - The category ID (optional)
   */
  getVoteCounts: async (categoryId = null) => {
    try {
      // Get the current settings to get the active year
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('award_settings')
        .select('active_year')
        .single();
        
      if (settingsError) throw settingsError;
      
      // Build the query to get vote counts
      let query = supabaseAdmin.rpc('get_vote_counts', {
        active_year: settings.active_year
      });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting vote counts:', error);
      throw error;
    }
  },
  
  /**
   * Get voting statistics
   */
  getVotingStats: async () => {
    try {
      // Get the current settings to get the active year
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('award_settings')
        .select('active_year')
        .single();
        
      if (settingsError) throw settingsError;
      
      // Get total votes per category
      const { data, error } = await supabaseAdmin.rpc('get_voting_stats', {
        active_year: settings.active_year
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting voting stats:', error);
      throw error;
    }
  }
};

// Create stored procedures for vote counting and stats
export const createStoredProcedures = async () => {
  try {
    // Create function to get vote counts
    await supabaseAdmin.rpc('create_get_vote_counts_function', {
      sql: `
        CREATE OR REPLACE FUNCTION get_vote_counts(active_year INTEGER)
        RETURNS TABLE (
          nomination_id UUID,
          category_id UUID,
          nominee_email TEXT,
          category_name TEXT,
          vote_count BIGINT
        )
        LANGUAGE SQL
        AS $$
          SELECT 
            n.id AS nomination_id,
            n.category_id,
            n.nominee_email,
            c.name AS category_name,
            COUNT(v.id) AS vote_count
          FROM award_nominations n
          JOIN award_categories c ON n.category_id = c.id
          LEFT JOIN award_votes v ON n.id = v.nomination_id
          WHERE n.status = 'approved'
          AND n.award_year = active_year
          GROUP BY n.id, n.category_id, n.nominee_email, c.name
          ORDER BY c.name, vote_count DESC;
        $$;
      `
    });
    
    // Create function to get voting stats
    await supabaseAdmin.rpc('create_get_voting_stats_function', {
      sql: `
        CREATE OR REPLACE FUNCTION get_voting_stats(active_year INTEGER)
        RETURNS TABLE (
          category_id UUID,
          category_name TEXT,
          total_votes BIGINT,
          total_nominations BIGINT,
          approved_nominations BIGINT
        )
        LANGUAGE SQL
        AS $$
          SELECT 
            c.id AS category_id,
            c.name AS category_name,
            COUNT(v.id) AS total_votes,
            COUNT(DISTINCT n.id) AS total_nominations,
            COUNT(DISTINCT CASE WHEN n.status = 'approved' THEN n.id END) AS approved_nominations
          FROM award_categories c
          LEFT JOIN award_nominations n ON c.id = n.category_id AND n.award_year = active_year
          LEFT JOIN award_votes v ON n.id = v.nomination_id AND v.award_year = active_year
          GROUP BY c.id, c.name
          ORDER BY c.name;
        $$;
      `
    });
    
    return true;
  } catch (error) {
    console.error('Error creating stored procedures:', error);
    return false;
  }
};

export default AwardsService;
