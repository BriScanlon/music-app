export function handleError(err, res) {
    const status = err.cause?.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({ success: false, message });
  }
  
  export function missingKeys(requiredKeys, body) {
    return requiredKeys.filter(key => !(key in body));
  }
  