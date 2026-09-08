// Loads the Places library of the Google Maps JavaScript API on demand — used only to
// autofill a cafe's address and coordinates in the admin panel (see architecture doc).
// Entirely optional: with no API key configured, callers just skip loading it.

export function placesApiKey(): string | undefined {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || undefined;
}

let loadPromise: Promise<google.maps.PlacesLibrary> | null = null;

export function loadPlacesLibrary(): Promise<google.maps.PlacesLibrary> {
  if (loadPromise) return loadPromise;

  const key = placesApiKey();
  if (!key) {
    return Promise.reject(new Error('VITE_GOOGLE_PLACES_API_KEY is not set'));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async`;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load the Google Maps script'));
    script.onload = () => {
      google.maps.importLibrary('places').then((lib) => resolve(lib as google.maps.PlacesLibrary), reject);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
