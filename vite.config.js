import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, rmSync, readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
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
        const assetsDir = resolve(__dirname, 'public/assets');
        const publicDir = resolve(__dirname, 'public');
        
        if (existsSync(assetsDir)) {
          try {
            console.log('Cleaning assets directory...');
            const files = readdirSync(assetsDir);
            let removedCount = 0;
            files.forEach(file => {
              const filePath = join(assetsDir, file);
              try {
                const stat = statSync(filePath);
                if (stat.isFile() || stat.isDirectory()) {
                  rmSync(filePath, { recursive: true, force: true });
                  removedCount++;
                }
              } catch (e) {
                console.warn(`Failed to remove ${file}:`, e);
              }
            });
            if (removedCount > 0) {
              console.log(`Removed ${removedCount} file(s) from assets directory`);
            }
          } catch (e) {
            console.warn('Failed to clean assets directory:', e);
            try {
              rmSync(assetsDir, { recursive: true, force: true });
              mkdirSync(assetsDir, { recursive: true });
              console.log('Recreated assets directory');
            } catch (e2) {
              console.error('Failed to recreate assets directory:', e2);
            }
          }
        } else {
          mkdirSync(assetsDir, { recursive: true });
        }
        
        if (existsSync(publicDir)) {
          try {
            const files = readdirSync(publicDir);
            files.forEach(file => {
              const filePath = join(publicDir, file);
              const stat = statSync(filePath);
              
              if (stat.isFile() && (
                (file.startsWith('bundle-') && file.endsWith('.js')) ||
                (file.startsWith('index-') && file.endsWith('.js')) ||
                (file.endsWith('.map') && !file.includes('assets')) ||
                (file.endsWith('.css') && file.includes('index') && !file.includes('assets'))
              )) {
                try {
                  rmSync(filePath, { force: true });
                  console.log(`Removed old file: ${file}`);
                } catch (e) {
                  console.warn(`Failed to remove ${file}:`, e);
                }
              }
            });
          } catch (e) {
            console.warn('Failed to clean old build files:', e);
          }
        }
        
        const srcDir = resolve(__dirname, 'public/src');
        if (existsSync(srcDir)) {
          try {
            rmSync(srcDir, { recursive: true, force: true });
            console.log('Removed old src directory');
          } catch (e) {
            console.warn('Failed to clean src directory:', e);
          }
        }
      }
    },
    {
      name: 'move-html',
      closeBundle() {
        try {
          let htmlContent = readFileSync(resolve(__dirname, 'public/src/index.html'), 'utf-8');
          htmlContent = htmlContent.replace(/\.\.\/assets\//g, './assets/');
          writeFileSync(resolve(__dirname, 'public/index.html'), htmlContent);
          rmSync(resolve(__dirname, 'public/src'), { recursive: true, force: true });
        } catch (e) {
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
    outDir: resolve(__dirname, 'public'),
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
