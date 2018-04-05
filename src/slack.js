require('dotenv').config()
const qs = require('querystring')
const fetch = require('node-fetch')

const redirect_uri = process.env.SLACK_REDIRECT_URI

const auth_uri_query = qs.stringify({
  scope: [
    'identity.basic',
    'identity.email',
    'identity.avatar',
  ].join(','),
  client_id: process.env.SLACK_CLIENT_ID,
  team: process.env.SLACK_TEAM_ID,
  redirect_uri,
})


module.exports = {
  authURI: `https://slack.com/oauth/authorize?${auth_uri_query}`,
  getAccessToken: (code, callback) => {
    const query = qs.stringify({
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code,
      redirect_uri,
    })

    fetch(`https://slack.com/api/oauth.access?${query}`)
      .then(r => r.json())
      .then(callback)
  }
}
