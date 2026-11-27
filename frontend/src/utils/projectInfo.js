// Official G-TRAMS Capstone Team & Mobile APK Release Metadata

export const CAPSTONE_TEAM = [
  {
    name: 'Justine S. Lachica',
    role: 'Lead Developer',
    iconKey: 'lead_dev',
  },
  {
    name: 'Ian Simon Francis M. Rey',
    role: 'Project Manager',
    iconKey: 'project_manager',
  },
  {
    name: 'Jhon Kyn Axix H. Cabrigas',
    role: 'System Analyst',
    iconKey: 'system_analyst',
  },
  {
    name: 'Jhude Michael S. Martin',
    role: 'Researcher',
    iconKey: 'researcher',
  },
  {
    name: 'Jay Vincent G. Motol',
    role: 'Researcher',
    iconKey: 'researcher',
  },
];

// Fallback Android APK metadata for github.com/justinot-030807/g-trams-mobile.
// Live release version, file size, and direct APK asset URL are auto-synced from
// the public GitHub Releases API via useLatestMobileRelease().
export const MOBILE_APP_CONFIG = {
  appName: 'G-TRAMS Mobile',
  githubRepo: 'justinot-030807/g-trams-mobile',
  latestReleaseApiUrl:
    import.meta.env.VITE_MOBILE_RELEASE_API_URL ||
    'https://api.github.com/repos/justinot-030807/g-trams-mobile/releases/latest',
  version: 'v1.0.1',
  platform: 'Android APK',
  fileSizeLabel: '59.0 MB',
  fileName: 'gtrams-mobile-release.apk',
  publishedAt: '2026-11-24T04:32:55Z',
  repoUrl: 'https://github.com/justinot-030807/g-trams-mobile',
  releaseUrl: 'https://github.com/justinot-030807/g-trams-mobile/releases/latest',
  apkDownloadUrl:
    import.meta.env.VITE_MOBILE_APK_URL ||
    'https://github.com/justinot-030807/g-trams-mobile/releases/latest/download/gtrams-mobile-release.apk',
};
