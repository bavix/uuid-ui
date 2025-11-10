import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import preact from '@preact/preset-vite';

export default defineConfig({
  root: 'src',
  base: './',
  publicDir: '../public',
  esbuild: {
    loader: 'jsx',
    include: /.*\.js$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  plugins: [
    preact(),
    {
      name: 'clean-assets',
      buildStart() {
        const assetsDir = '../public/assets';
        if (existsSync(assetsDir)) {
          try {
            rmSync(assetsDir, { recursive: true, force: true });
            mkdirSync(assetsDir, { recursive: true });
          } catch (e) {
            console.warn('Failed to clean assets directory:', e);
          }
        }
      }
    },
    {
      name: 'move-html',
      closeBundle() {
        try {
          let htmlContent = readFileSync('../public/src/index.html', 'utf-8');
          // Fix paths from ../assets/ to ./assets/
          htmlContent = htmlContent.replace(/\.\.\/assets\//g, './assets/');
          writeFileSync('../public/index.html', htmlContent);
          rmSync('../public/src', { recursive: true, force: true });
        } catch (e) {
          // Ignore errors if files don't exist
        }
      }
    }
  ],
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: false,
    copyPublicDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
      output: {
        entryFileNames: 'assets/bundle-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    },
    sourcemap: true,
    minify: 'esbuild',
    write: true
  },
  server: {
    port: 8080,
    open: true
  }
});
