export const POPULAR_CITIES = [
  { name: 'Coimbatore', state: 'Tamil Nadu', icon: '🌴' },
  { name: 'Bengaluru', state: 'Karnataka', icon: '🏙️' },
  { name: 'Mumbai', state: 'Maharashtra', icon: '🌊' },
  { name: 'Delhi NCR', state: 'Delhi', icon: '🏛️' },
  { name: 'Chennai', state: 'Tamil Nadu', icon: '🏖️' },
  { name: 'Hyderabad', state: 'Telangana', icon: '🏰' },
  { name: 'Pune', state: 'Maharashtra', icon: '🎓' },
  { name: 'Kolkata', state: 'West Bengal', icon: '🌉' },
  { name: 'Ahmedabad', state: 'Gujarat', icon: '🪁' },
  { name: 'Kochi', state: 'Kerala', icon: '⛵' },
  { name: 'Mysuru', state: 'Karnataka', icon: '👑' },
  { name: 'Chandigarh', state: 'Punjab', icon: '🌳' },
];

/**
 * Auto-detect user current city via HTML5 Browser Geolocation + BigDataCloud reverse geocode API,
 * with automatic fallback to IP Geolocation.
 */
export async function detectUserCity() {
  // console.log('🔍 [locationHelper] Starting detectUserCity()...');

  // 1. Try HTML5 Browser Geolocation
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        });
      });

      // console.log('📍 [locationHelper] Browser Geolocation Position object:', position);
      // console.log('🌐 [locationHelper] Coordinates:', position.coords.latitude, position.coords.longitude);

      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      const data = await response.json();
      // console.log('🏢 [locationHelper] Reverse Geocode Data:', data);

      const cityCandidate =
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        data.localityInfo?.administrative?.[2]?.name ||
        data.localityInfo?.administrative?.[1]?.name;

      if (cityCandidate && typeof cityCandidate === 'string' && cityCandidate.trim()) {
        const cleanCity = cityCandidate.replace(/ District| Division| Metropolitan Area/gi, '').trim();
        // console.log('✅ [locationHelper] Detected City via GPS:', cleanCity);
        return cleanCity;
      }
    } catch (err) {
      // console.warn('⚠️ [locationHelper] Browser geolocation failed, denied, or timed out:', err);
    }
  } else {
    // console.warn('⚠️ [locationHelper] navigator.geolocation not supported in this browser environment.');
  }

  // 2. Fallback to IP Geolocation API
  // console.log('🌐 [locationHelper] Attempting IP Geolocation fallback...');
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    // console.log('📡 [locationHelper] IP Geolocation Data:', data);
    if (data.city && typeof data.city === 'string' && data.city.trim()) {
      // console.log('✅ [locationHelper] Detected City via IP:', data.city.trim());
      return data.city.trim();
    }
  } catch (err) {
    // console.warn('⚠️ [locationHelper] IP geolocation failed:', err);
  }

  // console.log('ℹ️ [locationHelper] Fallback to default city: Bengaluru');
  return 'Bengaluru';
}
