# voting-app

This is a simple web app for automating the SEP deliberation voting process.

## Development

### Setup

First, clone the repo and install the dependencies:

```bash
$ git clone git@github.com/jamesbvaughan/voting-app.git
$ cd voting-app
$ npm install
```

Get the `.env` file from james (message @jamesbvaughan on Facebook).
Then you can start the app:

```bash
$ npm start
```

The site should now be up on http://localhost:4000

## Contributing

Just message me (jamesbvaughan) and I'll help get you started.

## Todo

### Enhancements

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
- Switch from nedb to sqlite3 + an ORM
  - This should simplify things

### Bugs to fix

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
