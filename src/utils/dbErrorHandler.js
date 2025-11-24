/**
 * Database Error Handler
 * Handles MongoDB, Mongoose, and database connection errors
 */

const dbErrorHandler = (error) => {
  // Log the error for debugging
  console.error('Database Error:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });

  // Default error response
  const defaultError = {
    statusCode: 500,
    message: 'Database operation failed',
    code: 'DATABASE_ERROR',
    originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
  };

  // MongoDB Connection Errors
  if (error.name === 'MongoServerSelectionError') {
    return {
      statusCode: 503,
      message: 'Database connection failed. Please try again later.',
      code: 'DB_CONNECTION_FAILED',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // MongoDB Timeout Errors
  if (error.message.includes('buffering timed out') || error.message.includes('timed out')) {
    return {
      statusCode: 503,
      message: 'Service temporarily unavailable. Please try again.',
      code: 'DB_TIMEOUT',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // MongoDB Network Errors
  if (error.name === 'MongoNetworkError' || error.message.includes('network')) {
    return {
      statusCode: 503,
      message: 'Network issue with database. Please try again.',
      code: 'DB_NETWORK_ERROR',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // MongoDB Duplicate Key Errors
  if (error.code === 11000 || error.message.includes('duplicate key')) {
    const field = error.keyValue ? Object.keys(error.keyValue)[0] : 'field';
    return {
      statusCode: 409,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
      code: 'DUPLICATE_RESOURCE',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // Mongoose Validation Errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => val.message);
    return {
      statusCode: 400,
      message: 'Data validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // Mongoose Cast Errors (Invalid ObjectId)
  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      message: 'Invalid resource ID',
      code: 'INVALID_ID',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // MongoDB Authentication Errors
  if (error.message.includes('authentication failed') || error.code === 18) {
    return {
      statusCode: 500,
      message: 'Database authentication failed',
      code: 'DB_AUTH_FAILED',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // MongoDB Query Errors
  if (error.message.includes('query') || error.name === 'MongoQueryError') {
    return {
      statusCode: 400,
      message: 'Invalid database query',
      code: 'INVALID_QUERY',
      originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
    };
  }

  // Return default error if no specific handler found
  return defaultError;
};

// Helper function to check if error is database-related
dbErrorHandler.isDatabaseError = (error) => {
  const databaseErrorPatterns = [
    'Mongo',
    'timed out',
    'buffering',
    'database',
    'validation failed',
    'cast',
    'duplicate key',
    'network error'
  ];

  return databaseErrorPatterns.some(pattern => 
    error.name?.includes(pattern) || 
    error.message?.includes(pattern)
  );
};

// Export for use in other files
module.exports = dbErrorHandler;