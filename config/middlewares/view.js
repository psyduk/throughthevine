module.exports = function (config) {
  return function (req, res, next) {
    res.locals.appName = "through the vine"
    res.locals.req = req
    next()
  }
}