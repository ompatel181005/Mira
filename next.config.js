/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled because react-leaflet's MapContainer doesn't tolerate StrictMode's
  // double-mount in dev — it throws "Map container is already initialized".
  reactStrictMode: false,
};
module.exports = nextConfig;
