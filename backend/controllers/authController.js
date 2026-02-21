const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Owner } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/auth/register
 * Initial owner setup – only works if no owner exists yet
 */
const register = async (req, res, next) => {
  try {
    const existingOwner = await Owner.count();
    if (existingOwner > 0) {
      return sendError(
        res,
        'Owner already registered. Only one owner allowed.',
        null,
        409
      );
    }

    const { name, email, password } = req.body;

    const hashed = await bcrypt.hash(password, 12);

    const owner = await Owner.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: 'OWNER',
    });

    return sendSuccess(
      res,
      'Owner registered successfully.',
      { id: owner.id, name: owner.name, email: owner.email, role: owner.role },
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const owner = await Owner.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!owner) {
      return sendError(res, 'Invalid email or password.', null, 401);
    }

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', null, 401);
    }

    const token = jwt.sign(
      { id: owner.id, email: owner.email, role: owner.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return sendSuccess(res, 'Login successful.', {
      token,
      owner: {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Owner profile fetched.', req.owner);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Stateless JWT – client drops token; we confirm logout
 */
const logout = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Logged out successfully. Please remove token client-side.');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, logout };
