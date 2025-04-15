# SADRC Membership Application - Action Plan

This document outlines the key actions and steps to build the Skegness and District Running Club (SADRC) Membership Application.

## 1. Membership Form
- Collect the following information:
  - First Name
  - Surname
  - Address and Post Code
  - Telephone / Mobile
  - Email Address
  - Date of Birth
  - Country of Birth
  - Sex (required for competitions)
  - Parent/Guardian details (if under 18):
    - Name
    - Relationship
    - Telephone Number
  - Emergency Contact details:
    - Name
    - Relationship
    - Telephone Number
  - Medical Conditions (Yes/No with details)

## 2. Membership Options
- Allow selection of:
  - Club Membership (£10 per year)
  - Club Membership + England Athletics Affiliation (£30 per year)

## 3. Club Policies Acknowledgement
- Display and require confirmation of:
  - Adherence to SADRC values
  - Agreement to England Athletics Code of Conduct for Senior Athletes ([link](https://www.englandathletics.org/athletics-and-running/athlete-codes-of-conduct/))
- Additional options:
  - Opt out of club competitions and league tables
  - Opt out of photographs on Club's social media

## 4. Payment Information
- Display BACS payment details:
  - Sort Code: 30-97-67
  - Account Number: 23387568
  - Account Name: Skegness & District Running Club
- (Future) Integrate payment gateway

## 5. Digital Signature
- Capture digital signature for member
- If under 18, capture Parent/Guardian signature
- Record date of signing (use system time)

## 6. Future Functionality (Design for Extensibility)
- Members-only features:
  - Nomination process for club awards
  - Voting system for club awards

## 7. Additional Considerations
- Responsive design (works on phones, tablets, desktops)
- Secure data storage (privacy compliance)
- Easy navigation and user-friendly UI

---

## Backend Platform
- **Supabase** will be used for backend data storage and authentication:
  - Secure, scalable Postgres database for membership data
  - Built-in user authentication (email/password, social logins)
  - Easy integration with modern frontends (React/Next.js, etc.)
  - Open-source and privacy-compliant

---

## Next Steps
1. Set up a Supabase project and configure authentication
2. Design membership data schema in Supabase tables
3. Create wireframes for the form and user flow
4. Implement frontend form and validation
5. Connect frontend to Supabase for data submission and user management
6. Add digital signature capture and storage
7. Add policy acknowledgement and options
8. Display payment instructions
9. Ensure responsive and accessible design
10. Plan for future extensibility

---

_Last updated: 2025-04-15_
