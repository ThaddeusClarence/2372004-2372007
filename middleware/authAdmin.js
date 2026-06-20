// CODE-CITE:
//   Title: Admin Authentication Middleware Redirect
//   Type: ai
//   Value: Antigravity Gemini
//   Notes: Redirects non-admin requests to /login.
//   Lines Range: 7
module.exports = function (req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};
