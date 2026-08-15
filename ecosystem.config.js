// PM2 ecosystem file — mirrors hostmargin-full/server/ecosystem.config.js
// Start with: pm2 start ecosystem.config.js --env production

module.exports = {
  apps: [
    {
      name:         'expose127-dashboard',
      script:       'src/server.js',

      autorestart:  true,
      max_restarts: 10,
      restart_delay: 3000,

      instances:    1,
      watch:        false,

      env: {
        NODE_ENV: 'development',
        PORT:     '6000',
      },

      env_production: {
        NODE_ENV: 'production',
        PORT:     '6000',
      },
    },
  ],
};
