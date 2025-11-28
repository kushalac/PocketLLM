const User = require("../models/User")
const { generateToken } = require("../utils/jwt")

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" })
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      return res.status(400).json({ error: "Username or email already exists" })
    }

    const user = new User({ username, email, password })
    await user.save()

    res.status(201).json({ message: "User registered successfully", username, email })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    const user = await User.findOne({ username })

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password" })
    }

    const token = generateToken(user._id, user.username, user.is_admin || false)
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email,
        is_admin: user.is_admin || false
      } 
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

module.exports = { register, login }
