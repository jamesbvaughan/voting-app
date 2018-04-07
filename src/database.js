const Datastore = require('nedb')

class Database {
  constructor() {
    this.users = new Datastore({ filename: 'users.db', autoload: true })
    this.applicants = new Datastore({ filename: 'applicants.db', autoload: true })
    this.votes = new Datastore({ filename: 'votes.db', autoload: true })

    this.users.ensureIndex({ fieldName: 'slack_user_id', unique: true })
  }

  callbackWrapper(callback) {
    return (err, data) => {
      if (err) {
        console.error(err)
      }
      if (callback) {
        callback(data)
      }
    }
  }

  findUser(_id, callback) {
    this.users.findOne({ _id }, this.callbackWrapper(callback))
  }

  findUserBySlackID(slack_user_id, callback) {
    this.users.findOne({ slack_user_id }, this.callbackWrapper(callback))
  }

  addUser(user, callback) {
    this.users.insert(user, this.callbackWrapper(callback))
  }

  listUsers(callback) {
    this.users.find({}, this.callbackWrapper(callback))
  }

  updateUser(_id, update, callback) {
    this.users.update({ _id }, update, {}, this.callbackWrapper(callback))
  }

  findApplicant(_id, callback) {
    this.applicants.findOne({ _id }, this.callbackWrapper(callback))
  }

  addApplicant(applicant, callback) {
    this.applicants.insert(applicant, this.callbackWrapper(callback))
  }

  removeApplicant(_id, callback) {
    this.applicants.remove({ _id }, this.callbackWrapper(callback))
  }

  listApplicants(callback) {
    this.applicants.find({}, (err, applicants) => {
      this.users.find({}, (err, actives) => {
        this.votes.find({}, (err, votes) => {
          callback(applicants.map(applicant => {
            let sumVotes = 0
            let nWeightedVotes = 0
            applicant.nVotes = 0
            applicant.ones = 0

            const activeMap = actives.reduce((map, active) => {
              map[active._id] = active
              return map
            }, {})

            votes
              .filter(vote => vote.applicant_id === applicant._id)
              .forEach(vote => {
                const voteWeight = parseInt(activeMap[vote.active_id].vote_weight)
                sumVotes += voteWeight * vote.vote
                nWeightedVotes += voteWeight
                applicant.nVotes += 1

                if (vote.vote == 1) {
                  applicant.ones += 1
                }
              })

            if (nWeightedVotes > 0) {
              const score = sumVotes / nWeightedVotes
              applicant.candidacyScore = Math.round(score * 100) / 100
            }

            return applicant
          }))
        })
      })
    })
  }

  addVote(active_id, applicant_id, vote, callback) {
    const _id = active_id + applicant_id
    this.votes.update({ _id }, {
      _id,
      active_id,
      applicant_id,
      vote,
    }, {
      upsert: true,
    }, this.callbackWrapper(callback))
  }

  findVote(active, applicant, callback) {
    if (!active || !applicant) {
      callback(null)
      return
    }

    this.votes.findOne({
      active_id: active._id,
      applicant_id: applicant._id,
    }, this.callbackWrapper(callback))
  }
}

module.exports = new Database()
