function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器开了小差';

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message).join('; ');
    return res.status(400).json({
      success: false,
      data: null,
      message: messages,
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      data: null,
      message: '数据已存在，请检查重复字段',
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      data: null,
      message: '文件大小不能超过 5MB',
    });
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

export { errorHandler };