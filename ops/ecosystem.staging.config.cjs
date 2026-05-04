// pm2 ecosystem — staging on this box (80.240.31.146)
// Runs apps/web + services/api as user-level pm2 processes.
//
// Usage from /home/ahmad/Zhic:
//   pm2 start ops/ecosystem.staging.js
//   pm2 logs
//   pm2 restart all
//   pm2 save                         # persist process list
//   pm2 resurrect                    # re-spawn after host reboot

module.exports = {
  apps: [
    {
      name: 'zhic-web',
      cwd: '/home/ahmad/Zhic/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      interpreter: '/home/ahmad/.nvm/versions/node/v24.14.1/bin/node',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '800M',
      autorestart: true,
      out_file: '/home/ahmad/.pm2/logs/zhic-web-out.log',
      error_file: '/home/ahmad/.pm2/logs/zhic-web-err.log',
    },
    {
      name: 'zhic-api',
      cwd: '/home/ahmad/Zhic/services/api',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3001 -H 0.0.0.0',
      interpreter: '/home/ahmad/.nvm/versions/node/v24.14.1/bin/node',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '1G',
      autorestart: true,
      out_file: '/home/ahmad/.pm2/logs/zhic-api-out.log',
      error_file: '/home/ahmad/.pm2/logs/zhic-api-err.log',
    },
  ],
}
