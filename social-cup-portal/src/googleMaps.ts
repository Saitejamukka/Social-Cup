// Loads the Places library of the Google Maps JavaScript API on demand — used only to
// autofill a cafe's address and coordinates in the admin panel (see architecture doc).
// Entirely optional: with no API key configured, callers just skip loading it.

export function placesApiKey(): string | undefined {
  return import.meta.env.VITE_GOOGLE_PLACES_API_KEY || undefined;
}

// google.maps.importLibrary is NOT defined just by loading the API via a plain
// <script src="...&libraries=places">. It only exists once this bootstrap loader
// installs it — and PlaceAutocompleteElement is only ever exposed through it (unlike
// the older, now-deprecated google.maps.places.Autocomplete). This is a straight
// TypeScript transcription of Google's own published bootstrap snippet:
// https://developers.google.com/maps/documentation/javascript/load-maps-js-api
function installBootstrapLoader(config: { key: string; v?: string }) {
  const g: any = window;
  const google = (g.google ||= {});
  const maps = (google.maps ||= {});
  if (maps.importLibrary) return; // already installed (e.g. by a previous call)

  let loadingPromise: Promise<void> | null = null;
  const requestedLibraries = new Set<string>();
  const params = new URLSearchParams();

  const startLoad = (): Promise<void> =>
    loadingPromise ||
    (loadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      params.set('libraries', [...requestedLibraries].join(','));
      for (const key in config) params.set(key, (config as any)[key]);
      params.set('callback', 'google.maps.__ib__');
      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
      maps.__ib__ = resolve;
      script.onerror = () => {
        loadingPromise = null;
        reject(new Error('The Google Maps JavaScript API could not load.'));
      };
      document.head.append(script);
    }));

  maps.importLibrary = (name: string, ...rest: unknown[]) => {
    requestedLibraries.add(name);
    return startLoad().then(() => maps.importLibrary(name, ...rest));
  };
}

let loadPromise: Promise<typeof google.maps.places> | null = null;

export function loadPlacesLibrary(): Promise<typeof google.maps.places> {
  if (loadPromise) return loadPromise;

  const key = placesApiKey();
  if (!key) {
    return Promise.reject(new Error('VITE_GOOGLE_PLACES_API_KEY is not set'));
  }

  installBootstrapLoader({ key, v: 'weekly' });
  loadPromise = google.maps.importLibrary('places') as Promise<typeof google.maps.places>;
  return loadPromise;
}
