import { PackageSettings } from 'arui-scripts';

const aruiScriptsConfig: PackageSettings = {
    presets: './presets',
    clientPolyfillsEntry: './src/polyfills.js',
    serverEntry: './src/server/index',
    clientEntry: './src/client',
    keepCssVars: false,
    debug: true,
    compatModules: {
        shared: {
            'react': 'react',
            'react-dom': 'reactDOM',
        }
    },
    modules: {
        shared: {
            'react': {
                eager: true,
                singleton: true,
                requiredVersion: '^17.0.0',
            },
            'react-dom': {
                eager: true,
                singleton: true,
                requiredVersion: '^17.0.0',
            }
        }
    }
}

export default aruiScriptsConfig;