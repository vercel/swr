module.exports = {
  mode: 'development',
  entry: {
    demo1: './react-window-infinite-loader.tsx'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: { target: 'es2019', module: 'esnext' }
            }
          }
        ]
      }
    ]
  }
}
