module.exports = {
  ensureAuthenticated: (req, res, next) =>
    req.session.currentUser
      ? next()
      : res.redirect('/'),

  ensureAdmin: (req, res, next) =>
    req.session.currentUser && req.session.currentUser.is_admin
      ? next()
      : res.redirect('/')
}
