const validateCryptoRequest = (req, res, next) => {
    const { sensitiveData } = req.body;
    
    if (typeof sensitiveData !== 'string') {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'sensitiveData must be a string'
      });
    }
  
    if (sensitiveData.length > 1000) {
      return res.status(400).json({
        error: 'Data too large',
        message: 'sensitiveData must be less than 1000 characters'
      });
    }
  
    next();
  };
  
  module.exports = { validateCryptoRequest };