const Datastore = require('nedb')

class Database {
  constructor() {
    this.users = new Datastore({ filename: 'users.db', autoload: true })
    this.applicants = new Datastore({ filename: 'applicants.db', autoload: true })

    this.users.ensureIndex({
      fieldName: 'slack_user_id',
      unique: true,
    })
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
    this.applicants.insert(user, this.callbackWrapper(callback))
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
    this.applicants.find({}, this.callbackWrapper(callback))
  }
}

module.exports = new Database()
