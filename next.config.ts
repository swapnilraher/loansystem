import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Monkeypatch fs.realpathSync to handle exFAT readlink / reparse point errors on Windows
const originalRealpathSync = fs.realpathSync;
fs.realpathSync = function (p, options) {
  try {
    return originalRealpathSync(p, options);
  } catch (err: any) {
    if (err.code === "EISDIR" || err.code === "EINVAL") {
      return path.resolve(String(p));
    }
    throw err;
  }
} as typeof fs.realpathSync;

// Monkeypatch fs.realpath
const originalRealpath = fs.realpath;
const patchedRealpath = function (p: any, options: any, callback: any) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  originalRealpath(p, options, (err, resolvedPath) => {
    if (err && (err.code === "EISDIR" || err.code === "EINVAL")) {
      callback(null, path.resolve(String(p)));
    } else {
      callback(err, resolvedPath);
    }
  });
} as any;
patchedRealpath.native = originalRealpath.native;
fs.realpath = patchedRealpath;

// Monkeypatch fs.promises.realpath
if (fs.promises) {
  const originalPromisesRealpath = fs.promises.realpath;
  fs.promises.realpath = async function (p, options) {
    try {
      return await originalPromisesRealpath(p, options);
    } catch (err: any) {
      if (err.code === "EISDIR" || err.code === "EINVAL") {
        return path.resolve(String(p));
      }
      throw err;
    }
  };
}

// Monkeypatch fs.readlinkSync to convert exFAT EISDIR errors to EINVAL on Windows
const originalReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (p, options) {
  try {
    return originalReadlinkSync(p, options);
  } catch (err: any) {
    if (err.code === "EISDIR" && process.platform === "win32") {
      const newErr = new Error(`EINVAL: invalid argument, readlink '${p}'`) as any;
      newErr.code = "EINVAL";
      newErr.errno = -4071;
      newErr.syscall = "readlink";
      newErr.path = p;
      throw newErr;
    }
    throw err;
  }
} as typeof fs.readlinkSync;

// Monkeypatch fs.readlink
const originalReadlink = fs.readlink;
fs.readlink = function (p: any, options: any, callback: any) {
  if (typeof options === "function") {
    callback = options;
    options = undefined;
  }
  originalReadlink(p, options, (err, linkString) => {
    if (err && err.code === "EISDIR" && process.platform === "win32") {
      const newErr = new Error(`EINVAL: invalid argument, readlink '${p}'`) as any;
      newErr.code = "EINVAL";
      newErr.errno = -4071;
      newErr.syscall = "readlink";
      newErr.path = p;
      callback(newErr);
    } else {
      callback(err, linkString);
    }
  });
} as any;

// Monkeypatch fs.promises.readlink
if (fs.promises) {
  const originalPromisesReadlink = fs.promises.readlink;
  fs.promises.readlink = async function (p, options) {
    try {
      return await originalPromisesReadlink(p, options);
    } catch (err: any) {
      if (err.code === "EISDIR" && process.platform === "win32") {
        const newErr = new Error(`EINVAL: invalid argument, readlink '${p}'`) as any;
        newErr.code = "EINVAL";
        newErr.errno = -4071;
        newErr.syscall = "readlink";
        newErr.path = p;
        throw newErr;
      }
      throw err;
    }
  };
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack: (config) => {
    config.cache = false;
    config.resolve.symlinks = false;
    return config;
  },
};

export default nextConfig;
