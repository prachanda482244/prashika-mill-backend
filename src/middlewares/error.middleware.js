
const errorHandler = (err, _, res, next) => {
      console.log("fire")
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
            status: statusCode,
            message: err.message || "Something went wrong",
            stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
};
export { errorHandler }