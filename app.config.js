module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.WEB_BASE_PATH ? { baseUrl: process.env.WEB_BASE_PATH } : {}),
  },
});
