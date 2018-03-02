module.exports = {
  ensureAuthenticated: (req, res, next) =>
    req.session.current_user
      ? next()
      : res.redirect('/'),

  ensureAdmin: (req, res, next) =>
    req.session.current_user && req.session.current_user.is_admin
      ? next()
      : res.redirect('/')
}
