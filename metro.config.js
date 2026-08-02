const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// kar-ui-kit is a `file:` dep resolved via a symlink and ships its own
// node_modules/react (from its devDependencies). Metro's hierarchical
// node_modules walk-up starts from the *real* (symlink-resolved) path of the
// requiring file, so a plain `resolver.extraNodeModules` mapping is not
// enough here: extraNodeModules is only consulted *after* that walk-up fails,
// and the walk-up from inside kar-ui-kit finds kar-ui-kit/node_modules/react
// first, giving the app two separate React copies and breaking hooks
// ("Invalid hook call") - the same failure this repo's jest.config.js
// moduleNameMapper fixes for Jest. Force just these singleton packages to
// resolve as if required from this repo's own root, regardless of which
// package's code is doing the requiring.
const SINGLETON_MODULES = ['react', 'react-native'];

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  // kar-ui-kit's real directory lives outside this project root (it's a
  // sibling package pulled in only via the node_modules symlink). Metro's
  // crawler/watcher only indexes projectRoot + watchFolders, so without this
  // it can't find kar-ui-kit's files at all ("Unable to resolve module
  // kar-ui-kit"), regardless of the resolver fix below.
  watchFolders: [path.resolve(__dirname, '..', 'kar-ui-kit')],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (SINGLETON_MODULES.includes(moduleName)) {
        return context.resolveRequest(
          { ...context, originModulePath: path.join(__dirname, 'metro.config.js') },
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
