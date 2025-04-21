-- Awards System Database Schema

-- Table for award categories
CREATE TABLE award_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for award system settings
CREATE TABLE award_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_phase TEXT NOT NULL CHECK (current_phase IN ('inactive', 'nomination', 'voting', 'completed')),
    nomination_start_date TIMESTAMP WITH TIME ZONE,
    nomination_end_date TIMESTAMP WITH TIME ZONE,
    voting_start_date TIMESTAMP WITH TIME ZONE,
    voting_end_date TIMESTAMP WITH TIME ZONE,
    active_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for nominations
CREATE TABLE award_nominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES award_categories(id) ON DELETE CASCADE,
    nominee_email TEXT NOT NULL,
    nominator_email TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    award_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for votes
CREATE TABLE award_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nomination_id UUID NOT NULL REFERENCES award_nominations(id) ON DELETE CASCADE,
    voter_email TEXT NOT NULL,
    award_year INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each user can only vote once per category per year
    UNIQUE(voter_email, nomination_id, award_year)
);

-- Insert default award categories
INSERT INTO award_categories (name, description) VALUES
('Most Improved Male', 'The male club member who has improved their running performance the most in the past year.'),
('Most Improved Female', 'The female club member who has improved their running performance the most in the past year.'),
('Race Performance', 'An impressive race performance from any individual.'),
('Outstanding Achievement', 'Recognition for an outstanding achievement in running or contribution to the club.'),
('Golden Oldie', 'Recognition for outstanding performance or contribution from a senior member.'),
('Club MVP', 'Most Valuable Person - recognition for the member who has contributed most to the club.'),
('Spirit of the Club Award', 'Recognition for the member who best embodies the spirit and values of the club.');

-- Insert default settings (initially inactive)
INSERT INTO award_settings (
    current_phase, 
    nomination_start_date, 
    nomination_end_date, 
    voting_start_date, 
    voting_end_date, 
    active_year
) VALUES (
    'inactive',
    NULL,
    NULL,
    NULL,
    NULL,
    EXTRACT(YEAR FROM CURRENT_DATE)
);

-- Create indexes for performance
CREATE INDEX idx_nominations_category ON award_nominations(category_id);
CREATE INDEX idx_nominations_status ON award_nominations(status);
CREATE INDEX idx_nominations_year ON award_nominations(award_year);
CREATE INDEX idx_votes_nomination ON award_votes(nomination_id);
CREATE INDEX idx_votes_year ON award_votes(award_year);
