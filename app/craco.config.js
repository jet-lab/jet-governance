const CracoLessPlugin = require("craco-less");

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: {
              // Global vars
              'border-radius-base': '2px',

              
              // List item
              'list-item-meta-margin-bottom': '0',

            }
          },
        },
      },
    },
  ],
};
