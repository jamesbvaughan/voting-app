# Todo

## Enhancements
- Make people confirm before deleting an applicant
  - It's easy to accidentally delete an applicant from the applicant list
  - This would cause problems, especially if users have already voted on them
- Implement the gender ratio rule
  - Right now, you just get a list of applicants sorted by score
  - You have to figure out the gender ratio manually
  - There could be a few different ways to do this
- Make the client side update automatically when the admin changes the current person
- Add a way to change the applicants' gender
- Add option to remove the current applicant

## Bugs to fix
- Current Applicant race condition
  - Steps to produce:
    - Current applicant is A
    - User U opens the main voting page
    - Admin changes current applicant to B
    - U tries votes on A since they haven't refreshed the page
    - That vote actually goes to B and U doesn't vote on A at all
  - Possible fixes:
    - Make the /vote route take an applicant ID
    - Make the frontend update dynamically when the current user changes
    -Actually both of those together would be ideal
