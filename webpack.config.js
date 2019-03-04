module.exports = [{
  entry: './test/index.ts',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: ['ts-loader']
      }
    ]
  },
  devtool: 'source-map',
  resolve: {
    modules: ['node_modules', 'src'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.node']
  },
  output: {
    path: __dirname + '/test/dist',
    publicPath: '/',
    filename: 'app.js'
  }
}]