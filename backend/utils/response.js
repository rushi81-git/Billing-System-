const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendError = (res, message, data = null, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

module.exports = { sendSuccess, sendError };
