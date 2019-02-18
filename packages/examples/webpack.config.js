/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  entry: {
    vector: './src/example-vectors/index.tsx',
  },
  output: {
    filename: 'static/index.[hash:8].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsconfigPathsPlugin({})],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Collabodux',
      meta: {
        viewport:
          'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1',
      },
    }),
  ],
};
