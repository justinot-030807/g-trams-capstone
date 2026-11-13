export async function downloadOriginalLguTemplate({ franchise, type = 'mtop' }) {
  const token = localStorage.getItem('token');
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  const franchiseId = franchise?._id || franchise?.id;

  if (franchiseId && /^[0-9a-fA-F]{24}$/.test(String(franchiseId))) {
    response = await fetch(`${baseUrl}/api/v1/franchises/${franchiseId}/download-original?type=${encodeURIComponent(type)}`, {
      method: 'GET',
      headers,
    });
  }

  if (!response || !response.ok) {
    response = await fetch(`${baseUrl}/api/v1/franchises/download-original-preview?type=${encodeURIComponent(type)}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...(franchise || {}), type }),
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to download original LGU file (${response.status})`);
  }

  const blob = await response.blob();
  const safePlate = String(franchise?.plateNumber || franchise?.mtopNumber || 'GTRAMS').replace(/[^A-Za-z0-9_-]/g, '_');
  const ext = type === 'cancellation' ? 'docx' : 'xlsx';
  const prefix =
    type === 'application'
      ? 'MTOP_APPLICATION'
      : type === 'cancellation'
      ? 'CANCELLATION_OF_FRANCHISE'
      : 'MTOP_FRANCHISE';

  const filename = `${prefix}_${safePlate}.${ext}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
