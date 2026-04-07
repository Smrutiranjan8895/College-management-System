const awsExports = {
  Auth: {
    Cognito: {
      region: import.meta.env.VITE_COGNITO_REGION || 'ap-south-1',
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || '',
    }
  }
};

export default awsExports;
