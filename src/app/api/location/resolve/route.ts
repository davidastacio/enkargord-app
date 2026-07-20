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

    let latitude: number | null = null;
    let longitude: number | null = null;
    let source = 'google_maps';

    // Try directly parsing raw coordinates (e.g. 18.4861, -69.9312)
    const rawCoordsMatch = url.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
    if (rawCoordsMatch) {
      latitude = parseFloat(rawCoordsMatch[1]);
      longitude = parseFloat(rawCoordsMatch[2]);
      source = 'coordinates';
    } else {
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
          signal: AbortSignal.timeout(6000)
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

      latitude = coords.latitude;
      longitude = coords.longitude;
      source = url.includes('whatsapp') ? 'whatsapp' : 'google_maps';
    }

    if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json({ success: false, error: 'Coordenadas fuera de rango válido.' }, { status: 400 });
    }

    // Call OpenStreetMap Nominatim reverse geocoder for DR location resolution
    let formattedAddress = `Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    let details: any = {};

    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EnkargoRD-Logistics-Platform'
          },
          signal: AbortSignal.timeout(4000)
        }
      );

      if (geoRes.ok) {
        const geoData = await geoRes.json();
        formattedAddress = geoData.display_name || formattedAddress;
        
        const addr = geoData.address || {};
        details = {
          road: addr.road || addr.street || addr.avenue || '',
          suburb: addr.suburb || addr.neighbourhood || addr.quarter || '',
          city: addr.city || addr.town || addr.village || addr.municipality || '',
          county: addr.county || '',
          state: addr.state || '',
          postcode: addr.postcode || '',
          houseNumber: addr.house_number || ''
        };
      }
    } catch {
      // Fail-safe to empty details if geocoder times out or fails
    }

    return NextResponse.json({
      success: true,
      latitude,
      longitude,
      formattedAddress,
      source,
      details
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'No pudimos procesar la geocodificación de esta ubicación.' 
    }, { status: 500 });
  }
}
