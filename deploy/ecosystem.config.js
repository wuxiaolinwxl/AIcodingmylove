module.exports = {
  apps: [
    {
      name: 'memory-backend',
      script: './dist/main.js',
      cwd: '/var/www/memory-space/backend',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/memory-space/error.log',
      out_file: '/var/log/memory-space/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
