export async function downloadOriginalLguTemplate({ franchise, type = 'mtop', draft = false }) {
  const token = localStorage.getItem('token');
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  const franchiseId = franchise?._id || franchise?.id;
  const draftParam = draft ? '&draft=true' : '';

  if (franchiseId && /^[0-9a-fA-F]{24}$/.test(String(franchiseId))) {
    response = await fetch(`${baseUrl}/api/v1/franchises/${franchiseId}/download-original?type=${encodeURIComponent(type)}${draftParam}`, {
      method: 'GET',
      headers,
    });
    if (type === 'cancellation' && response && (response.status === 400 || response.status === 403)) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || errBody.message || 'Official cancellation letter is not available until finalized by OVM.');
    }
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
      ? (draft ? 'DRAFT_CANCELLATION' : 'CANCELLATION_OF_FRANCHISE')
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
