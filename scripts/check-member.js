// Script to check if a member exists in the database
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Email to check (can be passed as command line argument)
const emailToCheck = process.argv[2] || 'briandarrington@btinternet.com';

async function checkMember() {
  console.log(`Checking for member with email: ${emailToCheck}`);
  
  // Try exact match
  const { data: exactMatch, error: exactError } = await supabase
    .from('members')
    .select('*')
    .eq('email', emailToCheck);
    
  if (exactError) {
    console.error('Error checking exact match:', exactError);
  }
  
  console.log('Exact match results:', exactMatch);
  
  // Try partial match on username
  const username = emailToCheck.split('@')[0];
  const { data: partialMatch, error: partialError } = await supabase
    .from('members')
    .select('*')
    .ilike('email', `%${username}%`);
    
  if (partialError) {
    console.error('Error checking partial match:', partialError);
  }
  
  console.log('Partial match results:', partialMatch);
  
  // Try without .com if it has .com
  if (emailToCheck.endsWith('.com')) {
    const emailWithoutCom = emailToCheck.slice(0, -4);
    const { data: withoutComMatch, error: withoutComError } = await supabase
      .from('members')
      .select('*')
      .eq('email', emailWithoutCom);
      
    if (withoutComError) {
      console.error('Error checking without .com match:', withoutComError);
    }
    
    console.log('Without .com match results:', withoutComMatch);
  }
  
  // Show all members for reference
  const { data: allMembers, error: allError } = await supabase
    .from('members')
    .select('id, email, first_name, surname')
    .limit(10);
    
  if (allError) {
    console.error('Error fetching all members:', allError);
  } else {
    console.log('All members (first 10):', allMembers);
  }
}

checkMember().catch(console.error);
