import babel from '@rollup/plugin-babel';
import external from 'rollup-plugin-peer-deps-external';
import del from 'rollup-plugin-delete';
import pkg from './package.json';
import image from 'rollup-plugin-img';
import url from '@rollup/plugin-url';
import resolve from '@rollup/plugin-node-resolve'
import styles from "rollup-plugin-styles";
import commonjs from '@rollup/plugin-commonjs';
import dynamicImportVars from '@rollup/plugin-dynamic-import-vars';

export default {
    input: pkg.source,
    output: [
        // { file: pkg.main, format: 'cjs' },
        { file: pkg.module, format: 'es' },
    ],
    inlineDynamicImports: true,
    plugins: [
        // handle css -> js
        styles(),
        // Don't include peer dependencies
        external(),
        //images
        url(),
        image({dom:true}),
        // resolve node modules
        resolve({preferBuiltins: true}),
        //commonjs used by rainbowkit
        commonjs({
            transformMixedEsModules:true,
            include: /node_modules/
        }),
        //dynamicImportVars used by rainbowkit
        dynamicImportVars({
            include: /node_modules/
        }),
        babel({
            exclude: 'node_modules/**',
            babelHelpers: 'bundled',
            presets: [ ['@babel/preset-react', { runtime: "automatic"}]]
        }),
        del({ targets: ['dist/*'] }),
    ],
    external: Object.keys(pkg.peerDependencies || {}),
};
