const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// kar-ui-kit is a `file:` dep resolved via a symlink and ships its own
// node_modules (react, react-native, react-native-svg, etc. - installed
// for its own devDependency-driven tests). Metro's hierarchical
// node_modules walk-up starts from the *real* (symlink-resolved) path of
// the requiring file, so any bare-specifier require made by code inside
// kar-ui-kit (react, react-native, deep react-native/Libraries/* imports,
// react-native-svg, @babel/runtime, ...) can resolve to kar-ui-kit's OWN
// copy instead of this repo's - producing duplicate React instances
// ("Invalid hook call") and duplicate RN bridge/native-module singletons
// (BatchedBridge, NativeModules, TurboModuleRegistry, etc.), which is
// worse and can break at runtime in ways Jest/tsc never exercise.
// Force every bare-specifier require originating from inside kar-ui-kit
// to resolve as if required from this repo's own root instead.
const KAR_UI_KIT_PATH = path.resolve(__dirname, '..', 'kar-ui-kit');

function isBareSpecifier(moduleName) {
  return !moduleName.startsWith('.') && !moduleName.startsWith('/');
}

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
  watchFolders: [KAR_UI_KIT_PATH],
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      const requestingFromKarUiKit = context.originModulePath.startsWith(KAR_UI_KIT_PATH);
      if (requestingFromKarUiKit && isBareSpecifier(moduleName)) {
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
