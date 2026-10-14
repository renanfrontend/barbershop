/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      {
        hostname: "utfs.io",
      },
    ],
  },
};

export default nextConfig;
