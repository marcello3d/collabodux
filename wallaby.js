module.exports = function(wallaby) {
  return {
    files: ['packages/*/src/**/*', '!packages/*/src/**/*.test.ts'],

    tests: ['packages/*/src/**/*.test.ts'],

    compilers: {
      '**/*.ts?(x)': wallaby.compilers.typeScript({ module: 'commonjs' }),
    },

    env: {
      type: 'node',
      runner: 'node',
    },

    testFramework: 'jest',
  };
};
