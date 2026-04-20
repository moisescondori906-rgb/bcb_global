module.exports = {
  apps: [
    {
      name: 'bcb-global-backend',
      script: 'src/index.mjs',
      cwd: '/var/www/bcb_global/backend',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        DEBUG: '*',
        NODE_APP_INSTANCE: '0' // PM2 injects this automatically, but we declare it for safety
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false
    }
  ]
};
