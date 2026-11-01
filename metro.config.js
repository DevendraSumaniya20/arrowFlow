const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // server/ is the Node backend; keep it (and its node_modules) out of the app bundle.
    blockList: [new RegExp(`^${path.resolve(__dirname, 'server').replace(/[/\\.]/g, '\\$&')}/.*`)],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
