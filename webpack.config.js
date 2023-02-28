const path = require("path")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require('copy-webpack-plugin')
module.exports = {
    mode: 'development', // or "development" or "none"
    entry: {
        index: "./src/index.js"
    },
    output: {
        filename: 'bundle.js',
        path: `${__dirname}/dist`
    },
    devServer:{
        static: "./dist"
    },
    plugins:[new HtmlWebpackPlugin({
        template: './src/index.html'
    }), new CopyPlugin({
        patterns: [
          { from: 'static' }
        ]
      })]
}