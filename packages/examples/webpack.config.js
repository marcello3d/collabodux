/* eslint-disable @typescript-eslint/no-var-requires */
// @ts-ignore
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const shared = {
  devtool: 'source-map',
  output: {
    filename: 'static/[name].[hash:8].js',
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
};

const meta = {
  viewport:
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1',
};

module.exports = [
  {
    ...shared,
    entry: {
      todos: './src/example-todos/index.tsx',
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Collabodux - todos',
        filename: 'todos.html',
        meta,
      }),
    ],
  },
  {
    ...shared,
    entry: {
      vectors: './src/example-vectors/index.tsx',
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'Collabodux - vectors',
        filename: 'vectors.html',
        meta,
      }),
    ],
  },
];
