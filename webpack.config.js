var nodeExternals = require('webpack-node-externals');
var path = require('path');

module.exports = {
    devtool: 'inline-source-map',
    entry: './src/index.js',
    output: {
      filename: './build/bundle.js'
    },
    target: 'node',
    externals: [nodeExternals()],
    resolve: {
      // Add `.ts` and `.tsx` as a resolvable extension.
      extensions: ['.js']
    },
    resolveLoader: {
        alias: {
            'bundle-loader': require.resolve('./loaders/bundle.js'),
            'binding-loader': require.resolve('./loaders/binding.js')
        }
    },
    module: {
        loaders: [
            { test: /\.jsx?$/, loader: 'babel-loader', query: {
                presets:[ 'stage-2' ]
              }}
        ]
    }
}