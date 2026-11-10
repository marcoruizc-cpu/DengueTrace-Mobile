const rawBase = process.argv[2] || process.env.EXPO_PUBLIC_API_URL;
if (!rawBase || !/^https?:\/\//.test(rawBase)) {
  console.error('Uso: node scripts/check-backend.mjs https://tu-servidor/api/v1');
  process.exit(1);
}
const base = rawBase.replace(/\/+$/, '');
let failures = 0;

async function inspect(path, check) {
  try {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.json();
    if (!check(body)) throw new Error('JSON no coincide con la estructura esperada');
    console.log(`OK ${path}: ${body.length} registros`);
    return body;
  } catch (error) {
    failures++;
    console.error(`ERROR ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

await inspect('/districts', body => Array.isArray(body) && body.every(item =>
  typeof item.id === 'number' && typeof item.name === 'string' && typeof item.department === 'string'));
await inspect('/alerts', body => Array.isArray(body) && body.every(item =>
  typeof item.id === 'number' && typeof item.districtId === 'number' && typeof item.message === 'string'));

if (failures) {
  console.error(`Fallaron ${failures} comprobaciones. Revisa URL/red y despliegue.`);
  process.exitCode = 1;
} else {
  console.log('Los endpoints públicos coinciden con el contrato inspeccionado del backend.');
}
