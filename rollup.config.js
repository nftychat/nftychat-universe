import babel from '@rollup/plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import del from 'rollup-plugin-delete';
import pkg from './package.json';
import svgr from '@svgr/rollup'
import url from '@rollup/plugin-url';
import resolve from '@rollup/plugin-node-resolve'
import styles from "rollup-plugin-styles";
import commonjs from '@rollup/plugin-commonjs';


export default {
    input: pkg.source,
    output: [
        { file: pkg.main, format: 'cjs' },
        { file: pkg.module, format: 'esm' }
    ],
    inlineDynamicImports: true,
    plugins: [
        styles(),
        external(),
        url(),
        svgr(),
        resolve({preferBuiltins: true}),
        commonjs({
            include: /node_modules/
        }),
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled',
            presets: ["@babel/preset-env", ['@babel/preset-react', { runtime: "automatic" }]]
        }),
        del({ targets: ['dist/*'] }),
    ],
    external: Object.keys(pkg.peerDependencies || {}),
};
