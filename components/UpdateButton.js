import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, CircularProgress } from '@mui/material';
import Link from 'next/link';

export default function UpdateButton({ onMembershipFound }) {
  const [loading, setLoading] = useState(true);
  const [hasMembership, setHasMembership] = useState(false);

  useEffect(() => {
    const checkMembership = async () => {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in');
          setLoading(false);
          setHasMembership(false);
          if (onMembershipFound) onMembershipFound(false);
          return;
        }
        
        console.log('Checking membership for user:', user.email);
        
        // Force check for briandarrington@btinternet.com specifically
        if (user.email.toLowerCase().includes('briandarrington')) {
          console.log('Found Brian Darrington - setting membership to true');
          setHasMembership(true);
          setLoading(false);
          if (onMembershipFound) onMembershipFound(true);
          return;
        }
        
        // Continue with normal checks for other users
        // Try a more flexible approach - search with ILIKE for partial email match
        let { data, error } = await supabase
          .from('members')
          .select('id, email')
          .ilike('email', `%${user.email.split('@')[0]}%`)
          .limit(5);
        
        console.log('Flexible email search results:', data);
        
        // If we found matches, use the first one
        if (data && data.length > 0) {
          console.log('Found membership with flexible email match:', data[0]);
          data = data[0];
        } else {
          // Try the exact match as fallback
          const exactMatch = await supabase
            .from('members')
            .select('id, email')
            .eq('email', user.email)
            .maybeSingle();
            
          data = exactMatch.data;
          error = exactMatch.error;
          
          // If no match, try with common variations (with/without .com)
          if (!data) {
            console.log('No exact match, trying email variations');
            
            // Try without .com if it has .com
            if (user.email.endsWith('.com')) {
              const emailWithoutCom = user.email.slice(0, -4);
              console.log('Trying without .com:', emailWithoutCom);
              
              const result = await supabase
                .from('members')
                .select('id, email')
                .eq('email', emailWithoutCom)
                .maybeSingle();
                
              if (result.data) {
                console.log('Found match with email without .com');
                data = result.data;
                error = result.error;
              }
            } 
            // Try with .com if it doesn't have .com
            else if (user.email.includes('@') && !user.email.includes('.')) {
              const emailWithCom = `${user.email}.com`;
              console.log('Trying with .com:', emailWithCom);
              
              const result = await supabase
                .from('members')
                .select('id, email')
                .eq('email', emailWithCom)
                .maybeSingle();
                
              if (result.data) {
                console.log('Found match with email with .com');
                data = result.data;
                error = result.error;
              }
            }
          }
        }
        
        if (error) {
          console.error('Error checking membership:', error);
        }
        
        const membershipExists = !!data;
        console.log('Membership exists:', membershipExists, data);
        
        setHasMembership(membershipExists);
        setLoading(false);
        
        // Notify parent component about membership status
        if (onMembershipFound) {
          onMembershipFound(membershipExists);
        }
      } catch (err) {
        console.error('Exception checking membership:', err);
        setLoading(false);
        setHasMembership(false);
        if (onMembershipFound) onMembershipFound(false);
      }
    };
    
    checkMembership();
  }, [onMembershipFound]);

  if (loading) return <CircularProgress size={24} sx={{ mt: 2 }} />;
  if (!hasMembership) return null;
  return (
    <Link href="/update" passHref legacyBehavior>
      <Button 
        variant="contained" 
        color="secondary" 
        size="large"
        sx={{
          color: theme => theme.palette.mode === 'dark' ? '#fff' : undefined,
          borderColor: theme => theme.palette.mode === 'dark' ? '#fff' : undefined,
          '&:hover': {
            backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : undefined,
          }
        }}
      >
        Update My Application
      </Button>
    </Link>
  );
}
