module.exports = {
  apps: [{
    name: 'runecheck',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      DISABLE_ESLINT_PLUGIN: 'true',
      PORT: 3000
    },
    max_memory_restart: '1G',
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    time: true,
    instances: 1,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 5000
  }]
} 