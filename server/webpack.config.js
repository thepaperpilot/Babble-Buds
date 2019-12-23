const path = require('path')
const WebpackShellPlugin = require('webpack-shell-plugin')

module.exports = {
	entry: './src/index.js',
	mode: process.env.NODE_ENV,
	target: 'web',
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: 'bundle.js'
	},
  	watch: process.env.NODE_ENV === 'development',
	module: {
		rules: [
		{
			test: /\.(js|jsx)$/,
			exclude: /node_modules/,
			use: {
				loader: "babel-loader",
				options: {
					"presets": ["@babel/preset-env", "@babel/preset-react"]
				}
			}
		}
		]
	},
  	plugins: [
    	new WebpackShellPlugin({
      		onBuildEnd: process.env.NODE_ENV === 'development' ? ['npm run run:dev'] : []
    	})
  	]
}
