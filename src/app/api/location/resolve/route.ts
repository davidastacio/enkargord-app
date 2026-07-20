import { NextResponse } from 'next/server';

// Allowed domains to prevent SSRF
const ALLOWED_DOMAINS = [
  'google.com',
  'www.google.com',
  'maps.google.com',
  'maps.app.goo.gl',
  'goo.gl'
];

function isDomainAllowed(urlStr: string): boolean {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname.toLowerCase();
    return ALLOWED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

// Extract coords using regex from URL string
function extractCoords(urlStr: string): { latitude: number; longitude: number } | null {
  // Pattern 1: /@lat,lng
  const atPattern = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchAt = urlStr.match(atPattern);
  if (matchAt) {
    return {
      latitude: parseFloat(matchAt[1]),
      longitude: parseFloat(matchAt[2])
    };
  }

  // Pattern 2: query=lat,lng or q=lat,lng or ll=lat,lng
  const queryPattern = /[?&](query|q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchQuery = urlStr.match(queryPattern);
  if (matchQuery) {
    return {
      latitude: parseFloat(matchQuery[2]),
      longitude: parseFloat(matchQuery[3])
    };
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL no proporcionada' }, { status: 400 });
    }

    // Try directly parsing coordinates if raw coords were supplied instead of a URL
    const rawCoordsMatch = url.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
    if (rawCoordsMatch) {
      const lat = parseFloat(rawCoordsMatch[1]);
      const lng = parseFloat(rawCoordsMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return NextResponse.json({
          success: true,
          latitude: lat,
          longitude: lng,
          formattedAddress: `Coordenadas manuales: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          source: 'coordinates'
        });
      }
    }

    if (!isDomainAllowed(url)) {
      return NextResponse.json({ 
        success: false, 
        error: 'No pudimos reconocer este enlace de ubicación. Dominio no autorizado o no compatible.' 
      }, { status: 400 });
    }

    let finalUrl = url;

    // Follow redirect if it's a short URL
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps') || url.includes('goo.gl')) {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(6000) // 6 seconds timeout
      });

      const locationHeader = response.headers.get('location');
      if (locationHeader) {
        if (!isDomainAllowed(locationHeader)) {
          return NextResponse.json({ 
            success: false, 
            error: 'Redirección no autorizada a un dominio desconocido.' 
          }, { status: 400 });
        }
        finalUrl = locationHeader;
      }
    }

    const coords = extractCoords(finalUrl);

    if (!coords) {
      return NextResponse.json({ 
        success: false, 
        error: 'El enlace no contiene coordenadas válidas.' 
      }, { status: 400 });
    }

    const { latitude, longitude } = coords;

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ success: false, error: 'Coordenadas fuera de rango válido.' }, { status: 400 });
    }

    // Attempt mock reverse geocoding for SD sectors to display a friendly address label
    let sectorName = "Santo Domingo";
    if (latitude > 18.48 && latitude < 18.49 && longitude > -69.94 && longitude < -69.93) {
      sectorName = "Naco, Santo Domingo";
    } else if (latitude > 18.45 && latitude < 18.47 && longitude > -69.95 && longitude < -69.94) {
      sectorName = "Bella Vista, Santo Domingo";
    } else if (latitude > 18.46 && latitude < 18.48 && longitude > -69.90 && longitude < -69.88) {
      sectorName = "Zona Colonial, Santo Domingo";
    }

    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      formattedAddress: `Cerca de ${sectorName} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      source: url.includes('whatsapp') ? 'whatsapp' : 'google_maps'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'No pudimos abrir el enlace corto. Intenta pegar el enlace completo de Google Maps.' 
    }, { status: 500 });
  }
}
