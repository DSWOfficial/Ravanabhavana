export async function copyText(value) {
  await navigator.clipboard.writeText(value || '');
}

export async function copyToClipboard(text) {
  await copyText(text);
}
