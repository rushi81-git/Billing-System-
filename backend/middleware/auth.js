const jwt = require('jsonwebtoken');
const { Owner } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        data: null,
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please log in again.',
          data: null,
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        data: null,
      });
    }

    const owner = await Owner.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!owner) {
      return res.status(401).json({
        success: false,
        message: 'Owner account not found.',
        data: null,
      });
    }

    req.owner = owner;
    next();
  } catch (error) {
    next(error);
  }
};

const requireOwner = (req, res, next) => {
  if (!req.owner || req.owner.role !== 'OWNER') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Owner access required.',
      data: null,
    });
  }
  next();
};

module.exports = { authMiddleware, requireOwner };
