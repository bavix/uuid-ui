import babel from '@rollup/plugin-babel';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from "@rollup/plugin-json";
import resolve from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import { createTransform } from 'rollup-copy-transform-css';

export default {
    input: 'src/index.jsx',
    output: {
        dir: 'public/',
        format: 'iife', // 'cjs' if building Node app, 'umd' for both
        sourcemap: true,
    },
    plugins: [
        copy({
            targets: [{
                src: [
                    './src/app.css',
                    './node_modules/bulma/css/bulma.css',
                    './node_modules/@creativebulma/bulma-tooltip/dist/bulma-tooltip.css',
                ],
                dest: 'public',
                transform: createTransform({
                    inline: true,
                    minify: true,
                    map: {inline: false},
                }),
            }]
        }),
        resolve({
            browser: true
        }),
        commonjs({
            include: /node_modules/,
            requireReturnsDefault: 'auto', // <---- this solves default issue
        }),
        json(),
        nodeResolve({
            extensions: [".js"],
        }),
        replace({
            'process.env.NODE_ENV': JSON.stringify( 'development' ),
            preventAssignment: true
        }),
        babel({
            presets: ["@babel/preset-react", "minify"],
            plugins: ["@babel/plugin-transform-react-jsx"],
            babelHelpers: 'bundled'
        }),
        alias({
            entries: [
                { find: 'react', replacement: 'preact/compat' },
                { find: 'react-dom/test-utils', replacement: 'preact/test-utils' },
                { find: 'react-dom', replacement: 'preact/compat' },
                { find: 'react/jsx-runtime', replacement: 'preact/jsx-runtime' }
            ]
        })
    ]
};
