const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).send("A token is required for authentication");
  }

  try {
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).send("Invalid Token Format");
    }
    
    const token = parts[1];
    if (!token) {
        return res.status(401).send("Invalid Token");
    }

    // Since the current auth.js implementation uses a simple base64 string
    // and not a signed JWT, we primarily check for existence/format here.
    // In a production environment, you would use jwt.verify() here.
    
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  
  return next();
};

module.exports = { verifyToken };