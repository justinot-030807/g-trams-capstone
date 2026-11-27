import { useEffect, useState } from 'react';
import { MOBILE_APP_CONFIG } from '../utils/projectInfo';

const CACHE_KEY = 'gtrams_mobile_latest_release_v1';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const formatFileSize = (bytes) => {
  const num = Number(bytes);
  if (!Number.isFinite(num) || num <= 0) return MOBILE_APP_CONFIG.fileSizeLabel;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
};

const readCachedRelease = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - Number(parsed.cachedAt || 0) > CACHE_TTL_MS) return null;
    if (!parsed.data || !parsed.data.version) return null;
    return parsed.data;
  } catch {
    return null;
  }
};

const writeCachedRelease = (data) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), data }));
  } catch {
    // Ignore storage quota or private browsing errors
  }
};

export function useLatestMobileRelease() {
  const [release, setRelease] = useState(() => readCachedRelease() || MOBILE_APP_CONFIG);

  useEffect(() => {
    // If an explicit custom APK URL is set via env var without a custom release API, keep env config
    if (import.meta.env.VITE_MOBILE_APK_URL && !import.meta.env.VITE_MOBILE_RELEASE_API_URL) {
      return undefined;
    }

    const cached = readCachedRelease();
    if (cached) {
      setRelease(cached);
      return undefined;
    }

    const controller = new AbortController();

    const fetchLatestRelease = async () => {
      try {
        const res = await fetch(MOBILE_APP_CONFIG.latestReleaseApiUrl, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!res.ok) return;

        const json = await res.json();
        const tag = String(json?.tag_name || json?.name || '').trim();
        if (!tag) return;

        const assets = Array.isArray(json?.assets) ? json.assets : [];
        const apkAsset = assets.find((asset) =>
          String(asset?.name || '').toLowerCase().endsWith('.apk')
        );

        const nextRelease = {
          ...MOBILE_APP_CONFIG,
          version: tag,
          fileName: apkAsset?.name || MOBILE_APP_CONFIG.fileName,
          fileSizeLabel: apkAsset?.size ? formatFileSize(apkAsset.size) : MOBILE_APP_CONFIG.fileSizeLabel,
          apkDownloadUrl:
            apkAsset?.browser_download_url ||
            `https://github.com/${MOBILE_APP_CONFIG.githubRepo}/releases/download/${encodeURIComponent(tag)}/${MOBILE_APP_CONFIG.fileName}`,
          releaseUrl: json?.html_url || MOBILE_APP_CONFIG.releaseUrl,
          publishedAt: json?.published_at || MOBILE_APP_CONFIG.publishedAt,
        };

        writeCachedRelease(nextRelease);
        setRelease(nextRelease);
      } catch {
        // Silently keep fallback metadata if offline, aborted, or GitHub API is rate-limited
      }
    };

    fetchLatestRelease();
    return () => controller.abort();
  }, []);

  return release;
}

export default useLatestMobileRelease;
