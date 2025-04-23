-- SQL script to add test nominations data
-- Run this in your Supabase SQL Editor

-- First, let's get the existing categories to reference their IDs
-- You'll need to replace the category_id values below with your actual category IDs

-- Function to generate random dates within the last 30 days
CREATE OR REPLACE FUNCTION random_date(min_days integer, max_days integer) 
RETURNS TIMESTAMP AS $$
BEGIN
  RETURN NOW() - (random() * (max_days - min_days) + min_days) * INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Clear existing test nominations if needed (comment out if you want to keep existing data)
-- DELETE FROM award_nominations WHERE nominee_email LIKE '%example.com';

-- Insert test nominations for each category
-- Replace the category_id values with your actual category IDs from the award_categories table

-- Community Leadership Award (replace with your actual category ID)
INSERT INTO award_nominations (
  category_id, nominee_name, nominee_email, project_name, 
  achievements, community_impact, nomination_reason,
  nominator_name, nominator_email, status, created_at,
  reviewed_by, admin_note, review_date
) VALUES
-- Category 1 nominations
(1, 'John Smith', 'john.smith@example.com', 'Community Garden Renovation',
 'Led a team of 15 volunteers to complete the project ahead of schedule',
 'The project directly benefited over 200 families in our community',
 'Their dedication and perseverance inspired everyone involved',
 'Sarah Johnson', 'sarah.johnson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(1, 'Emma Brown', 'emma.brown@example.com', 'Youth Mentorship Program',
 'Secured $10,000 in grant funding for community initiatives',
 'Created a safe space for youth that has reduced local juvenile incidents by 25%',
 'The nominee went far beyond expectations to ensure success',
 'Michael Williams', 'michael.williams@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Strong contender based on impact metrics', random_date(1, 5)),

(1, 'David Jones', 'david.jones@example.com', 'Senior Digital Literacy Workshop',
 'Organized 5 community events with over 500 total attendees',
 'Elderly residents report 85% higher satisfaction with community resources',
 'Their innovative approach solved problems that had stumped others for years',
 'Lisa Davis', 'lisa.davis@example.com', 'approved', random_date(1, 30),
 'admin@sadrc.org', 'Exceptional candidate with strong community support', random_date(1, 5)),

(1, 'Robert Miller', 'robert.miller@example.com', 'Neighborhood Clean-up Initiative',
 'Implemented innovative solutions that reduced costs by 30%',
 'Environmental impact included planting 150 native trees and reducing waste by 40%',
 'They demonstrated exceptional leadership during challenging circumstances',
 'Jennifer Wilson', 'jennifer.wilson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(1, 'William Moore', 'william.moore@example.com', 'Local History Documentation',
 'Created partnerships with 8 local businesses to support the project',
 'Cultural preservation efforts have documented 45 oral histories that would have been lost',
 'The level of community engagement they achieved was unprecedented',
 'Patricia Taylor', 'patricia.taylor@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Verified achievements with multiple references', random_date(1, 5)),

(1, 'James Anderson', 'james.anderson@example.com', 'Public Art Installation',
 'Developed a sustainable model that will continue for years to come',
 'Public spaces are now used 3x more frequently than before the project',
 'Their commitment to inclusivity ensured everyone could participate',
 'Linda Thomas', 'linda.thomas@example.com', 'rejected', random_date(1, 30),
 'admin@sadrc.org', 'Recommend follow-up for additional documentation', random_date(1, 5)),

(1, 'Richard Jackson', 'richard.jackson@example.com', 'Food Bank Expansion',
 'Trained 25 community members to become project leaders',
 'The project directly benefited over 200 families in our community',
 'The long-term vision they established will benefit our community for generations',
 'Barbara White', 'barbara.white@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(1, 'Charles Harris', 'charles.harris@example.com', 'Emergency Preparedness Training',
 'Documented best practices that have been adopted by other communities',
 'Emergency response readiness has improved measurably across the community',
 'They volunteered countless hours despite having many other responsibilities',
 'Susan Martin', 'susan.martin@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(1, 'Joseph Thompson', 'joseph.thompson@example.com', 'Wildlife Conservation Effort',
 'Overcame significant challenges through creative problem-solving',
 'The project has become a model for three neighboring communities',
 'Their technical expertise was crucial to the project\'s success',
 'Margaret Garcia', 'margaret.garcia@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Notable project with measurable outcomes', random_date(1, 5)),

(1, 'Thomas Martinez', 'thomas.martinez@example.com', 'Cultural Festival Organization',
 'Increased community participation by 45% through outreach efforts',
 'Community pride and cohesion metrics improved by 60% in surveys',
 'They showed remarkable resilience when facing setbacks',
 'Jessica Robinson', 'jessica.robinson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

-- Category 2 nominations (replace category_id with your actual ID)
(2, 'Sarah Johnson', 'sarah.johnson@example.com', 'Affordable Housing Advocacy',
 'Designed and built custom tools that improved efficiency',
 'Vulnerable populations now have improved access to essential services',
 'The nominee built bridges between different community groups',
 'John Smith', 'john.smith@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(2, 'Michael Williams', 'michael.williams@example.com', 'After-School Tutoring Program',
 'Coordinated logistics for a complex multi-site initiative',
 'Educational outcomes for participating students improved by an average of 30%',
 'Their passion for the cause inspired others to get involved',
 'Emma Brown', 'emma.brown@example.com', 'approved', random_date(1, 30),
 'admin@sadrc.org', 'Meets all criteria with outstanding results', random_date(1, 5)),

(2, 'Lisa Davis', 'lisa.davis@example.com', 'Homeless Shelter Support',
 'Advocated successfully for policy changes at the local government level',
 'The initiative has attracted positive media attention and new investment',
 'They identified a critical need that others had overlooked',
 'David Jones', 'david.jones@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Consider for special recognition award', random_date(1, 5)),

(2, 'Jennifer Wilson', 'jennifer.wilson@example.com', 'River Cleanup Project',
 'Created educational materials used by hundreds of community members',
 'Environmental impact included planting 150 native trees and reducing waste by 40%',
 'The nominee secured resources that made the impossible possible',
 'Robert Miller', 'robert.miller@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(2, 'Patricia Taylor', 'patricia.taylor@example.com', 'Mental Health Awareness Campaign',
 'Established a scholarship fund that has supported 12 students',
 'Health outcomes show measurable improvement in targeted demographics',
 'Their attention to detail ensured the highest quality outcomes',
 'William Moore', 'william.moore@example.com', 'rejected', random_date(1, 30),
 'admin@sadrc.org', 'Particularly impressive given resource constraints', random_date(1, 5)),

(2, 'Linda Thomas', 'linda.thomas@example.com', 'Veteran Support Network',
 'Led a team of 15 volunteers to complete the project ahead of schedule',
 'The project created 8 part-time jobs for local residents',
 'Their dedication and perseverance inspired everyone involved',
 'James Anderson', 'james.anderson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(2, 'Barbara White', 'barbara.white@example.com', 'Literacy Improvement Program',
 'Secured $10,000 in grant funding for community initiatives',
 'Educational outcomes for participating students improved by an average of 30%',
 'The nominee went far beyond expectations to ensure success',
 'Richard Jackson', 'richard.jackson@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Innovative approach deserves recognition', random_date(1, 5)),

(2, 'Susan Martin', 'susan.martin@example.com', 'Disability Accessibility Initiative',
 'Organized 5 community events with over 500 total attendees',
 'Vulnerable populations now have improved access to essential services',
 'Their innovative approach solved problems that had stumped others for years',
 'Charles Harris', 'charles.harris@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(2, 'Margaret Garcia', 'margaret.garcia@example.com', 'Sustainable Energy Education',
 'Implemented innovative solutions that reduced costs by 30%',
 'The project has become a model for three neighboring communities',
 'They demonstrated exceptional leadership during challenging circumstances',
 'Joseph Thompson', 'joseph.thompson@example.com', 'approved', random_date(1, 30),
 'admin@sadrc.org', 'Sustainable project with ongoing benefits', random_date(1, 5)),

(2, 'Jessica Robinson', 'jessica.robinson@example.com', 'Community Theater Revival',
 'Created partnerships with 8 local businesses to support the project',
 'Community pride and cohesion metrics improved by 60% in surveys',
 'The level of community engagement they achieved was unprecedented',
 'Thomas Martinez', 'thomas.martinez@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

-- Category 3 nominations (replace category_id with your actual ID)
(3, 'Emma Brown', 'emma.brown@example.com', 'Youth Mentorship Program',
 'Developed a sustainable model that will continue for years to come',
 'Created a safe space for youth that has reduced local juvenile incidents by 25%',
 'Their commitment to inclusivity ensured everyone could participate',
 'Sarah Johnson', 'sarah.johnson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(3, 'David Jones', 'david.jones@example.com', 'Senior Digital Literacy Workshop',
 'Trained 25 community members to become project leaders',
 'Elderly residents report 85% higher satisfaction with community resources',
 'The long-term vision they established will benefit our community for generations',
 'Michael Williams', 'michael.williams@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Addresses a critical community need', random_date(1, 5)),

(3, 'Robert Miller', 'robert.miller@example.com', 'Neighborhood Clean-up Initiative',
 'Documented best practices that have been adopted by other communities',
 'Environmental impact included planting 150 native trees and reducing waste by 40%',
 'They volunteered countless hours despite having many other responsibilities',
 'Lisa Davis', 'lisa.davis@example.com', 'approved', random_date(1, 30),
 'admin@sadrc.org', 'Demonstrates exceptional leadership qualities', random_date(1, 5)),

(3, 'William Moore', 'william.moore@example.com', 'Local History Documentation',
 'Overcame significant challenges through creative problem-solving',
 'Cultural preservation efforts have documented 45 oral histories that would have been lost',
 'Their technical expertise was crucial to the project\'s success',
 'Jennifer Wilson', 'jennifer.wilson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(3, 'James Anderson', 'james.anderson@example.com', 'Public Art Installation',
 'Increased community participation by 45% through outreach efforts',
 'Public spaces are now used 3x more frequently than before the project',
 'They showed remarkable resilience when facing setbacks',
 'Patricia Taylor', 'patricia.taylor@example.com', 'rejected', random_date(1, 30),
 'admin@sadrc.org', 'Project has potential for expansion', random_date(1, 5)),

(3, 'Richard Jackson', 'richard.jackson@example.com', 'Food Bank Expansion',
 'Designed and built custom tools that improved efficiency',
 'The project directly benefited over 200 families in our community',
 'The nominee built bridges between different community groups',
 'Linda Thomas', 'linda.thomas@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(3, 'Charles Harris', 'charles.harris@example.com', 'Emergency Preparedness Training',
 'Coordinated logistics for a complex multi-site initiative',
 'Emergency response readiness has improved measurably across the community',
 'Their passion for the cause inspired others to get involved',
 'Barbara White', 'barbara.white@example.com', 'under_review', random_date(1, 30),
 'admin@sadrc.org', 'Unique contribution to the community', random_date(1, 5)),

(3, 'Joseph Thompson', 'joseph.thompson@example.com', 'Wildlife Conservation Effort',
 'Advocated successfully for policy changes at the local government level',
 'The project has become a model for three neighboring communities',
 'They identified a critical need that others had overlooked',
 'Susan Martin', 'susan.martin@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL),

(3, 'Thomas Martinez', 'thomas.martinez@example.com', 'Cultural Festival Organization',
 'Created educational materials used by hundreds of community members',
 'Community pride and cohesion metrics improved by 60% in surveys',
 'The nominee secured resources that made the impossible possible',
 'Margaret Garcia', 'margaret.garcia@example.com', 'approved', random_date(1, 30),
 'admin@sadrc.org', 'Exceptional candidate with strong community support', random_date(1, 5)),

(3, 'John Smith', 'john.smith@example.com', 'Community Garden Renovation',
 'Established a scholarship fund that has supported 12 students',
 'The project directly benefited over 200 families in our community',
 'Their attention to detail ensured the highest quality outcomes',
 'Jessica Robinson', 'jessica.robinson@example.com', 'submitted', random_date(1, 30),
 NULL, NULL, NULL);

-- Drop the temporary function
DROP FUNCTION random_date(integer, integer);

-- You can add more categories following the same pattern
-- Just replace the category_id with your actual IDs
