export default function errorHandler(err, req, res, _next) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error(err.stack);

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors || {}).map((fieldError) => fieldError.message);
    return res.status(400).json({
      error: {
        message: "Validation failed.",
        details,
        status: 400,
      },
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      error: {
        message: "Invalid identifier format.",
        details: [err.message],
        status: 400,
      },
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      message: err.message || "Internal Server Error",
      status: statusCode,
    },
  });
}
