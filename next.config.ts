/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  env: {
    TZ: 'Asia/Tehran', // تنظیم منطقه زمانی به ایران
  },
};

module.exports = nextConfig;