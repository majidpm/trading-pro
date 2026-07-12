module.exports = {
  apps: [{
    name: "trading-pro",
    script: "node",
    args: "./node_modules/next/dist/bin/next start",
    cwd: "C:/Trader/trading-app",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
       TZ: "Asia/Tehran"
      
    }
  }]
}