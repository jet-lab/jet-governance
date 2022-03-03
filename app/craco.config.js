const CracoLessPlugin = require('craco-less');
const path = require('path');
const fs = require('fs');

// Handle relative paths to sibling packages
const appDirectory = fs.realpathSync(process.cwd());
const resolvePackage = relativePath => path.resolve(appDirectory, relativePath);

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#2abdd2',
              // Global vars
              'border-radius-base': '2px',
              // List item
              'list-item-meta-margin-bottom': '0'
            },
            javascriptEnabled: true
          }
        }
      }
    }
  ]
};
