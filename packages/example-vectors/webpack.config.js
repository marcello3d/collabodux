const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devtool: 'source-map',
  entry: './src/index.tsx',
  output: {
    filename: 'index.[hash:8].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    plugins: [new TsconfigPathsPlugin({})],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          // {
          //   loader: 'typings-for-css-modules-loader',
          //   options: { namedExport: true, modules: true },
          // },
          'css-loader',
        ],
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
