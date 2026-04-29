export const downloadItem = (item) => {
  // If there's a direct PDF link, opening it in a new tab might be preferred for browsing,
  // but for "Download", we'll provide a metadata export (JSON) which contains all citations etc.
  // If we had a direct binary PDF download available, we'd use that.
  
  const data = JSON.stringify(item, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
