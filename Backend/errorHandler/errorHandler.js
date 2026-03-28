const errorHandler = (err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: "Internal Server Error",
    stack: err.stack,
    
  });

};
  
  export default errorHandler;