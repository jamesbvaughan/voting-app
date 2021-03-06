require('dotenv').config()
const express = require('express')
const session = require('express-session')
const fs = require('fs')
const NedbStore = require('nedb-session-store')(session)
const Jimp = require('jimp')
const fileUpload = require('express-fileupload')

const db = require('./database.js')
const slack = require('./slack.js')
const { scoreSort, stringSort } = require('./helpers.js')

const app = express()


// Globals ====================================================================
let currentApplicant = null


// Session Setup ==============================================================
const sessionSettings = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false,
  store: new NedbStore({ filename: 'session.db' }),
}

if (app.get('env') === 'production') {
  app.set('trust proxy', 1)
  sessionSettings.cookie.secure = true
}


// Middlewares ================================================================
const ensureAuthenticated = (req, res, next) =>
  req.session.currentUser
    ? next()
    : res.redirect('/')

const ensureAdmin = (req, res, next) =>
  req.session.currentUser && req.session.currentUser.is_admin
    ? next()
    : res.redirect('/')

const injectLocals = (req, res, next) => {
  res.locals.currentUser = req.session.currentUser
  res.locals.currentApplicant = currentApplicant
  next()
}


// Express setup ==============================================================
app.use(session(sessionSettings))
app.use(['/users*', '/applicants*', '/stats*'], ensureAdmin)
app.use(injectLocals)
app.use(express.static('public'))
app.use(fileUpload())

app.set('view engine', 'pug')


// Routes =====================================================================
app.get('/', (req, res) => {
  db.findVote(req.session.currentUser, currentApplicant, currentVote => {
    res.render('index', {
      slackAuthURI: slack.authURI,
      currentVote,
    })
  })
})

app.get('/slack-callback', (req, res) => {
  slack.getAccessToken(req.query.code, data => {
    db.findUserBySlackID(data.user.id, user => {
      if (user) {
        req.session.currentUser = user
        return res.redirect('/')
      }

      user = {
        name: data.user.name,
        slack_user_id: data.user.id,
        slack_team_id: data.team.id,
        slack_access_token: data.access_token,
        vote_weight: 0,
      }

      db.addUser(user, newUser => {
        req.session.currentUser = newUser
        res.redirect('/')
      })
    })
  })
})

app.use('/', ensureAuthenticated)

app.get('/users', (req, res) => {
  db.listUsers(users => res.render('users', { users: stringSort(users) }))
})

app.get('/users/:_id/set-vote-weight', (req, res) => {
  const { vote_weight } = req.query
  db.updateUser(req.params._id, { $set: { vote_weight } }, () => {
    res.redirect('/users')
  })
})

app.get('/applicants', (req, res) => {
  db.listApplicants(applicants => {
    db.listUsers(actives => {
      res.render('applicants', {
        applicants: stringSort(applicants),
        nActives: actives.length,
      })
    })
  })
})

app.get('/applicants/add', (req, res) => {
  db.addApplicant({
    name: req.query.name,
    gender: req.query.gender,
  }, err => res.redirect('/applicants'))
})

app.get('/applicants/:_id/remove', (req, res) => {
  if (currentApplicant && req.params._id === currentApplicant._id) {
    currentApplicant = null
  }
  db.removeApplicant(req.params._id, () => res.redirect('/applicants'))
})

app.get('/applicants/:_id/set-current', (req, res) => {
  db.findApplicant(req.params._id, applicant => {
    currentApplicant = applicant
    res.redirect('/applicants')
  })
})

app.post('/applicants/:_id/upload-photo', (req, res) => {
  if (!req.files) {
    return res.status(400).send('You need to select a photo to upload.')
  }

  const fileExtension = req.files.photo.name.match(/\.(jpe?g|png|gif)$/i)
  if (!fileExtension) {
    return res.status(400).send('You can only use jpg, png, and gif filetypes.')
  }

  const tmpPath = `public/applicant-photos/tmp.${fileExtension[1]}`
  req.files.photo.mv(tmpPath, err => {
    if (err) {
      return res.status(500).send(err)
    }

    Jimp.read(tmpPath, (err, photo) => {
      if (err) {
        return res.status(500).send(err)
      }

      photo.quality(60).write(`public/applicant-photos/${req.params._id}.jpg`)

      res.redirect('/applicants')
    })
  })
})

app.get('/stats', (req, res) => {
  db.listApplicants(applicants => {
    db.listUsers(actives => {
      res.render('stats', {
        applicants: scoreSort(applicants),
        nActives: actives.length,
        namesHidden: true,
      })
    })
  })
})

app.get('/stats-with-names', (req, res) => {
  db.listApplicants(applicants => {
    db.listUsers(actives => {
      res.render('stats', {
        applicants: scoreSort(applicants),
        nActives: actives.length,
        namesHidden: false,
      })
    })
  })
})

app.get('/vote', (req, res) => {
  const { applicant_id, vote } = req.query
  db.addVote(req.session.currentUser._id, applicant_id, vote, () => {
    res.redirect('/')
  })
})

app.get('/logout', (req, res) => {
  req.session.currentUser = null
  res.redirect('/')
})

app.use((req, res) => res.status(404).render('404'))

if (!fs.existsSync('public/applicant-photos')) {
  fs.mkdirSync('public/applicant-photos')
}

app.listen(4000, () => console.log('voting app running on http://localhost:4000.'))
