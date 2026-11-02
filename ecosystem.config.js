module.exports = {
  apps: [
    {
      name: "portal",
      cwd: "/var/www/portal",
      script: "npm",
      args: "start",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};


