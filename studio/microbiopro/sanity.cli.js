import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'b33hwgh0',
    dataset: 'production'
  },
  studioHost: 'am-group-microbio',
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
    appId: 'rrkjj4jscnxqwk14xbi2uwt7',
  }
})
