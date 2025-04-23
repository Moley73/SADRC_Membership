// Script to add test nominations data to the database
// Run with: node scripts/add-test-nominations.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample data generators
const memberNames = [
  'John Smith', 'Sarah Johnson', 'Michael Williams', 'Emma Brown', 'David Jones',
  'Lisa Davis', 'Robert Miller', 'Jennifer Wilson', 'William Moore', 'Patricia Taylor',
  'James Anderson', 'Linda Thomas', 'Richard Jackson', 'Barbara White', 'Charles Harris',
  'Susan Martin', 'Joseph Thompson', 'Margaret Garcia', 'Thomas Martinez', 'Jessica Robinson'
];

const memberEmails = [
  'john.smith@example.com', 'sarah.johnson@example.com', 'michael.williams@example.com',
  'emma.brown@example.com', 'david.jones@example.com', 'lisa.davis@example.com',
  'robert.miller@example.com', 'jennifer.wilson@example.com', 'william.moore@example.com',
  'patricia.taylor@example.com', 'james.anderson@example.com', 'linda.thomas@example.com',
  'richard.jackson@example.com', 'barbara.white@example.com', 'charles.harris@example.com',
  'susan.martin@example.com', 'joseph.thompson@example.com', 'margaret.garcia@example.com',
  'thomas.martinez@example.com', 'jessica.robinson@example.com'
];

const projectNames = [
  'Community Garden Renovation', 'Youth Mentorship Program', 'Senior Digital Literacy Workshop',
  'Neighborhood Clean-up Initiative', 'Local History Documentation', 'Public Art Installation',
  'Food Bank Expansion', 'Emergency Preparedness Training', 'Wildlife Conservation Effort',
  'Cultural Festival Organization', 'Affordable Housing Advocacy', 'After-School Tutoring Program',
  'Homeless Shelter Support', 'River Cleanup Project', 'Mental Health Awareness Campaign',
  'Veteran Support Network', 'Literacy Improvement Program', 'Disability Accessibility Initiative',
  'Sustainable Energy Education', 'Community Theater Revival'
];

const achievements = [
  'Led a team of 15 volunteers to complete the project ahead of schedule',
  'Secured $10,000 in grant funding for community initiatives',
  'Organized 5 community events with over 500 total attendees',
  'Implemented innovative solutions that reduced costs by 30%',
  'Created partnerships with 8 local businesses to support the project',
  'Developed a sustainable model that will continue for years to come',
  'Trained 25 community members to become project leaders',
  'Documented best practices that have been adopted by other communities',
  'Overcame significant challenges through creative problem-solving',
  'Increased community participation by 45% through outreach efforts',
  'Designed and built custom tools that improved efficiency',
  'Coordinated logistics for a complex multi-site initiative',
  'Advocated successfully for policy changes at the local government level',
  'Created educational materials used by hundreds of community members',
  'Established a scholarship fund that has supported 12 students'
];

const impacts = [
  'The project directly benefited over 200 families in our community',
  'Environmental impact included planting 150 native trees and reducing waste by 40%',
  'Created a safe space for youth that has reduced local juvenile incidents by 25%',
  'Elderly residents report 85% higher satisfaction with community resources',
  'Local businesses saw a 20% increase in foot traffic due to the initiative',
  'The project has become a model for three neighboring communities',
  'Vulnerable populations now have improved access to essential services',
  'Community pride and cohesion metrics improved by 60% in surveys',
  'Educational outcomes for participating students improved by an average of 30%',
  'The initiative has attracted positive media attention and new investment',
  'Public spaces are now used 3x more frequently than before the project',
  'Emergency response readiness has improved measurably across the community',
  'Cultural preservation efforts have documented 45 oral histories that would have been lost',
  'Health outcomes show measurable improvement in targeted demographics',
  'The project created 8 part-time jobs for local residents'
];

const reasons = [
  'Their dedication and perseverance inspired everyone involved',
  'The nominee went far beyond expectations to ensure success',
  'Their innovative approach solved problems that had stumped others for years',
  'They demonstrated exceptional leadership during challenging circumstances',
  'The level of community engagement they achieved was unprecedented',
  'Their commitment to inclusivity ensured everyone could participate',
  'The long-term vision they established will benefit our community for generations',
  'They volunteered countless hours despite having many other responsibilities',
  'Their technical expertise was crucial to the project\'s success',
  'They showed remarkable resilience when facing setbacks',
  'The nominee built bridges between different community groups',
  'Their passion for the cause inspired others to get involved',
  'They identified a critical need that others had overlooked',
  'The nominee secured resources that made the impossible possible',
  'Their attention to detail ensured the highest quality outcomes'
];

const adminNotes = [
  'Exceptional candidate with strong community support',
  'Verified achievements with multiple references',
  'Notable project with measurable outcomes',
  'Consider for special recognition award',
  'Recommend follow-up for additional documentation',
  'Strong contender based on impact metrics',
  'Innovative approach deserves recognition',
  'Meets all criteria with outstanding results',
  'Particularly impressive given resource constraints',
  'Collaboration with multiple stakeholders',
  'Sustainable project with ongoing benefits',
  'Addresses a critical community need',
  'Demonstrates exceptional leadership qualities',
  'Project has potential for expansion',
  'Unique contribution to the community'
];

// Statuses with appropriate distribution
const statuses = [
  'submitted', 'submitted', 'submitted', 'submitted', 'submitted', 
  'under_review', 'under_review', 'under_review',
  'approved', 'rejected'
];

// Function to generate a unique nomination
function generateUniqueNomination(categoryId, index) {
  // Use modulo to cycle through our sample data arrays with an offset based on category and index
  // This ensures different combinations for each nomination
  const nameIndex = (index + categoryId * 3) % memberNames.length;
  const emailIndex = (nameIndex + 1) % memberEmails.length;
  const projectIndex = (index + categoryId * 2) % projectNames.length;
  const achievementIndex = (index + categoryId) % achievements.length;
  const impactIndex = (index + categoryId * 4) % impacts.length;
  const reasonIndex = (index + categoryId * 5) % reasons.length;
  const adminNoteIndex = (index + categoryId * 2) % adminNotes.length;
  
  // Create dates with some variation
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30)); // Random date in last 30 days
  
  // Some nominations should have review data
  const statusIndex = (index + categoryId) % statuses.length;
  const status = statuses[statusIndex];
  
  let reviewDate = null;
  let reviewedBy = null;
  let adminNote = null;
  
  if (status === 'approved' || status === 'rejected' || status === 'under_review') {
    reviewDate = new Date(createdDate);
    reviewDate.setDate(reviewDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1-5 days after creation
    reviewedBy = memberEmails[(emailIndex + 5) % memberEmails.length];
    adminNote = adminNotes[adminNoteIndex];
  }
  
  return {
    category_id: categoryId,
    nominee_name: memberNames[nameIndex],
    nominee_email: memberEmails[emailIndex],
    project_name: projectNames[projectIndex],
    achievements: achievements[achievementIndex],
    community_impact: impacts[impactIndex],
    nomination_reason: reasons[reasonIndex],
    nominator_name: memberNames[(nameIndex + 10) % memberNames.length], // Different person as nominator
    nominator_email: memberEmails[(emailIndex + 10) % memberEmails.length],
    status: status,
    created_at: createdDate.toISOString(),
    reviewed_by: reviewedBy,
    admin_note: adminNote,
    review_date: reviewDate ? reviewDate.toISOString() : null
  };
}

// Main function to add test nominations
async function addTestNominations() {
  try {
    // 1. Get all categories
    console.log('Fetching award categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('award_categories')
      .select('id, name');
    
    if (categoriesError) {
      throw new Error(`Error fetching categories: ${categoriesError.message}`);
    }
    
    if (!categories || categories.length === 0) {
      throw new Error('No award categories found. Please create categories first.');
    }
    
    console.log(`Found ${categories.length} categories`);
    
    // 2. For each category, add 10 nominations
    for (const category of categories) {
      console.log(`Adding nominations for category: ${category.name}`);
      
      const nominations = [];
      for (let i = 0; i < 10; i++) {
        nominations.push(generateUniqueNomination(category.id, i));
      }
      
      // 3. Insert nominations
      const { data, error } = await supabase
        .from('award_nominations')
        .insert(nominations);
      
      if (error) {
        console.error(`Error adding nominations for category ${category.name}:`, error);
      } else {
        console.log(`✓ Added 10 nominations to category: ${category.name}`);
      }
    }
    
    console.log('Test data generation complete!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the function
addTestNominations();
