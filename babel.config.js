module.exports = api => {
  const isDevelopment = api.env('development');

  return {
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          bugfixes: true,
          modules: false
        }
      ],
      [
        require.resolve('@babel/preset-react'),
        {
          development: isDevelopment,
          runtime: 'automatic'
        }
      ],
      [
        require.resolve('@babel/preset-typescript'),
        {
          allowDeclareFields: true,
          allowNamespaces: true
        }
      ]
    ],
    plugins: [require.resolve('babel-plugin-react-compiler')]
  };
};
