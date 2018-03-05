const Datastore = require('nedb')

class Database {
  constructor() {
    this.users = new Datastore({ filename: 'users.db', autoload: true })
    this.applicants = new Datastore({ filename: 'applicants.db', autoload: true })
    this.votes = new Datastore({ filename: 'votes.db', autoload: true })

    this.users.ensureIndex({ fieldName: 'slack_user_id', unique: true })
    this.votes.ensureIndex({ fieldName: 'combined_id', unique: true })
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
      this.users.find({ vote_weight: { $gt: 0 } }, (err, actives) => {
        this.votes.find({}, (err, votes) => {
          callback(applicants.map(applicant => {
            let sumVotes = 0
            let nWeightedVotes = 0
            applicant.nVotes = 0

            const activeMap = actives.reduce((map, active) => {
              map[active._id] = active
              return map
            }, {})

            votes
              .filter(vote => vote.applicant_id === applicant._id)
              .forEach(vote => {
                const voteWeight = activeMap[vote.active_id].vote_weight
                sumVotes += voteWeight * vote.vote
                nWeightedVotes += voteWeight
                applicant.nVotes += 1
              })

            if (nWeightedVotes > 0) {
              applicant.candidacyScore = sumVotes / nWeightedVotes
            }

            return applicant
          }))
        })
      })
    })
  }

  addVote(active_id, applicant_id, newVote, callback) {
    this.votes.findOne({ active_id, applicant_id }, (err, vote) => {
      if (vote) {
        this.votes.update(
          { active_id, applicant_id, },
          { $set: { vote: newVote } },
          {},
          this.callbackWrapper(callback)
        )
      } else {
        this.votes.insert({
          active_id,
          applicant_id,
          combined_id: active_id + applicant_id,
          vote: newVote,
        }, this.callbackWrapper(callback))
      }
    })
  }

  findVote(active, applicant, callback) {
    if (active && applicant) {
      this.votes.findOne({
        active_id: active._id,
        applicant_id: applicant._id,
      }, this.callbackWrapper(callback))
    } else {
      callback(null)
    }
  }
}

module.exports = new Database()
