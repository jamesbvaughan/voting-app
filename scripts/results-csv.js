const db = require('../src/database.js')

console.log(`Name,Score,Ones,Actives Voted,Total Actives`)
db.listUsers(actives => {
  db.listApplicants(applicants => {
    applicants.forEach(({ name, gender, candidacyScore, ones, nVotes }) => {
      console.log(`${name},${candidacyScore || ''},${ones},${nVotes},${actives.length}`)
    })
  })
})
