import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useAuthContext } from './AuthContext';
import dayjs from 'dayjs';

export function useMembership() {
  const { user, loading: authLoading } = useAuthContext();
  const [membershipData, setMembershipData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMembership, setHasMembership] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchMembership = async () => {
      // Don't attempt to fetch membership if there's no user or auth is still loading
      if (!user || authLoading) {
        if (isMounted) {
          setLoading(false);
          setHasMembership(false);
          setMembershipData(null);
        }
        return;
      }
      
      try {
        setLoading(true);
        
        
        // Case-insensitive email search for regular users
        const userEmailLower = user.email.toLowerCase();
        console.log('Fetching membership with email:', userEmailLower);
        
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .ilike('email', userEmailLower)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching membership:', error);
          
          // Special handling for table not existing errors
          if (error.code === '42P01' || 
              error.message?.includes('relation') || 
              error.message?.includes('does not exist')) {
            console.log('Members table does not exist yet');
            if (isMounted) {
              setError('Membership database not available');
              setHasMembership(false);
              setMembershipData(null);
            }
          } else {
            if (isMounted) {
              setError(`Failed to fetch membership: ${error.message}`);
              
                setHasMembership(false);
                setMembershipData(null);
              
            }
          }
        } else if (data) {
          console.log('Membership found:', data);
          if (isMounted) {
            setHasMembership(true);
            setMembershipData(data);
            setError(null);
          }
        } else {
          console.log('No membership found for user:', userEmailLower);
          
            if (isMounted) {
              setHasMembership(false);
              setMembershipData(null);
              setError(null);
            }
          
        }
      } catch (err) {
        console.error('Unexpected error fetching membership:', err);
        
        if (isMounted) {
          setError(`Unexpected error: ${err.message}`);
          
          // Handle timeout errors with special case for admin
          if (err.message?.includes('timed out')) {
              setHasMembership(false);
              setMembershipData(null);
            
          } else {
            setHasMembership(false);
            setMembershipData(null);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMembership();
    
    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const refreshMembership = async () => {
    setLoading(true);
    
    try {
      
      if (!user) {
        setHasMembership(false);
        setMembershipData(null);
        setError(null);
        return;
      }
      
      // Case-insensitive email search
      const userEmailLower = user.email.toLowerCase();
      console.log('Refreshing membership with email:', userEmailLower);
      
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .ilike('email', userEmailLower)
        .maybeSingle();
      
      if (error) {
        console.error('Error refreshing membership:', error);
        setError(`Failed to refresh membership: ${error.message}`);
        
          setHasMembership(false);
          setMembershipData(null);
        
      } else if (data) {
        console.log('Membership found during refresh:', data);
        setHasMembership(true);
        setMembershipData(data);
        setError(null);
      } else {
        console.log('No membership found during refresh');
        
          setHasMembership(false);
          setMembershipData(null);
          setError(null);
        
      }
    } catch (err) {
      console.error('Unexpected error during membership refresh:', err);
      setError(`Unexpected error: ${err.message}`);
      
        setHasMembership(false);
        setMembershipData(null);
      
    } finally {
      setLoading(false);
    }
  };

  return {
    membershipData,
    hasMembership,
    loading,
    error,
    refreshMembership
  };
}
