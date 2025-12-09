// Simplified middleware - pass through all requests
export const onRequest = async (context: any, next: any) => {
  return next();
};
