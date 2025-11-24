const jwt = require("jsonwebtoken")

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key_change_in_production"

const generateToken = (userId, username) => {
  return jwt.sign({ id: userId, username }, SECRET_KEY, { expiresIn: "24h" })
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY)
  } catch (err) {
    return null
  }
}

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "No token provided" })
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    return res.status(401).json({ error: "Invalid token" })
  }

  req.user = decoded
  next()
}

const adminMiddleware = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: "Admin access required" })
    }
    next()
  })
}

module.exports = { generateToken, verifyToken, authMiddleware, adminMiddleware }
