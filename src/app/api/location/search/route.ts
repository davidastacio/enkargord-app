import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { street, sector, municipality, province, country } = await req.json();

    const queryParts = [];
    if (street) queryParts.push(street);
    if (sector) queryParts.push(sector);
    if (municipality) queryParts.push(municipality);
    if (province) queryParts.push(province);
    if (country) queryParts.push(country);

    const queryStr = encodeURIComponent(queryParts.join(', '));
    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${queryStr}&limit=1&addressdetails=1`;

    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'EnkargoRD-Logistics-Platform'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      throw new Error("Error en la geocodificación");
    }

    const results = await res.json();

    if (!results || results.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pudimos encontrar la ubicación aproximada en el mapa.'
      }, { status: 404 });
    }

    const bestMatch = results[0];
    return NextResponse.json({
      success: true,
      latitude: parseFloat(bestMatch.lat),
      longitude: parseFloat(bestMatch.lon),
      formattedAddress: bestMatch.display_name
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'No pudimos consultar el servicio de búsqueda geográfica.'
    }, { status: 500 });
  }
}
