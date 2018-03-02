require('dotenv').config()
const express = require('express')
const session = require('express-session')
const db = require('./database.js')
const slack = require('./slack.js')
const { ensureAdmin, ensureAuthenticated } = require('./accessControl.js')
const app = express()


const stringSort = list =>
  list.sort((a, b) =>
    a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

const sessionSettings = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false,
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1)
  sessionSettings.cookie.secure = true
}

app.use(session(sessionSettings))

app.use('/users*', ensureAdmin)
app.use('/applicants*', ensureAdmin)
app.use('/app*', ensureAuthenticated)

app.use((req, res, next) => {
  res.locals.current_user = req.session.current_user
  next()
})


// Express server code ========================================================
app.set('view engine', 'pug')

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.render('index', { slack_auth_uri: slack.authURI })
})

app.get('/slack-callback', (req, res) => {
  slack.getAccessToken(req.query.code, data => {
    db.findUserBySlackID(data.user.id, user => {
      if (!user) {
        user = {
          name: data.user.name,
          slack_user_id: data.user.id,
          slack_team_id: data.team.id,
          slack_access_token: data.access_token,
          vote_weight: 0,
        }

        db.addUser(user)
      }

      req.session.current_user = user
      res.redirect('/')
    })
  })
})

app.get('/users', (req, res) => {
  db.listUsers(users => res.render('users', { users: stringSort(users) }))
})

app.get('/applicants', (req, res) => {
  db.listApplicants(applicants => {
    res.render('applicants', { applicants: stringSort(applicants) })
  })
})

app.get('/applicants/:_id/remove', (req, res) => {
  db.removeApplicant(req.params._id, () => res.redirect('/applicants'))
})

app.get('/applicants/add', (req, res) => {
  db.addApplicant({ name: req.query.name }, err => res.redirect('/applicants'))
})

app.get('/users/:_id/set-vote-weight', (req, res) => {
  const { vote_weight } = req.query
  db.updateUser(req.params._id, { $set: { vote_weight } }, () => {
    res.redirect('/users')
  })
})

app.get('/logout', (req, res) => {
  req.session.current_user = null
  res.redirect('/')
})

app.use((req, res) => res.status(404).render('404'))

app.listen(4000, () => console.log('voting app running on port 4000.'))
