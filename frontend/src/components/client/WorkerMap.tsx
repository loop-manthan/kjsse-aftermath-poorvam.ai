import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { matchingService } from "../../api/services";
import { MapPin, Navigation, Clock } from "lucide-react";

interface Worker {
  _id: string;
  name: string;
  phone: string;
  categories: string[];
  location: {
    type: string;
    coordinates: [number, number];
  };
  rating: number;
  status: string;
  distance?: number;
}

export const WorkerMap = () => {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapLoaded && user) {
      fetchNearbyWorkers();
    }
  }, [mapLoaded, user]);

  const loadGoogleMaps = async () => {
    try {
      // Wait for Google Maps to be available
      if (window.google?.maps) {
        setMapLoaded(true);
        initMap();
      } else {
        // Load maps library using the bootstrap loader
        await google.maps.importLibrary("maps");
        await google.maps.importLibrary("marker");
        setMapLoaded(true);
        initMap();
      }
    } catch (error) {
      console.error("Error loading Google Maps:", error);
    }
  };

  const initMap = () => {
    if (!mapRef.current || !user || !window.google) return;

    const map = new google.maps.Map(mapRef.current, {
      center: {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      },
      zoom: 13,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
      ],
    });

    // Add client marker
    new google.maps.Marker({
      position: {
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      },
      title: "Your Location",
    });

    googleMapRef.current = map;
  };

  const fetchNearbyWorkers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch nearby workers directly (within 10km)
      const { data } = await matchingService.getNearbyWorkers(10);

      // Map User type to Worker type
      const workersData: Worker[] = data.workers.map((w: any) => ({
        ...w,
        categories: w.categories || [],
      }));

      setWorkers(workersData);
      addWorkerMarkers(workersData);
    } catch (error) {
      console.error("Error fetching nearby workers:", error);
    } finally {
      setLoading(false);
    }
  };

  const addWorkerMarkers = (workersData: Worker[]) => {
    if (!googleMapRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add worker markers
    workersData.forEach((worker) => {
      const marker = new google.maps.Marker({
        position: {
          lat: worker.location.coordinates[1],
          lng: worker.location.coordinates[0],
        },
        map: googleMapRef.current!,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#10b981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
        title: worker.name,
      });

      marker.addListener("click", () => {
        setSelectedWorker(worker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (workersData.length > 0 && user) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({
        lat: user.location.coordinates[1],
        lng: user.location.coordinates[0],
      });
      workersData.forEach((worker) => {
        bounds.extend({
          lat: worker.location.coordinates[1],
          lng: worker.location.coordinates[0],
        });
      });
      googleMapRef.current!.fitBounds(bounds);
    }
  };

  const calculateETA = (distance: number) => {
    // Assume average speed of 30 km/h in city
    const hours = distance / 1000 / 30;
    const minutes = Math.round(hours * 60);
    return minutes;
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Nearby Workers</h2>
        <div className="flex items-center gap-2 text-white/70 text-sm">
          <MapPin size={16} className="text-blue-400" />
          <span>{workers.length} available workers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div
            ref={mapRef}
            className="w-full h-96 rounded-xl overflow-hidden"
            style={{ minHeight: "400px" }}
          />
          {loading && (
            <div className="flex items-center justify-center h-96">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/70">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Worker List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {workers.length === 0 && !loading && (
            <div className="text-center py-8">
              <MapPin size={48} className="mx-auto text-white/40 mb-4" />
              <p className="text-white/70">No workers available nearby</p>
            </div>
          )}

          {workers.map((worker) => (
            <div
              key={worker._id}
              onClick={() => setSelectedWorker(worker)}
              className={`glass-nested rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 ${
                selectedWorker?._id === worker._id
                  ? "bg-white/10 border-2 border-green-500/50"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-semibold">{worker.name}</h3>
                  <p className="text-white/60 text-sm">
                    {worker.categories.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-white text-sm">
                    {worker.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {worker.distance && (
                <div className="flex items-center gap-4 text-xs text-white/70">
                  <div className="flex items-center gap-1">
                    <Navigation size={12} className="text-blue-400" />
                    <span>{(worker.distance / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="text-purple-400" />
                    <span>~{calculateETA(worker.distance)} min</span>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Available
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Worker Details */}
      {selectedWorker && (
        <div className="mt-6 glass-nested rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">
                {selectedWorker.name}
              </h3>
              <p className="text-white/70">
                {selectedWorker.categories.join(", ")}
              </p>
            </div>
            <button
              onClick={() => setSelectedWorker(null)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="glass-card rounded-lg p-3">
              <p className="text-white/60 text-xs mb-1">Distance</p>
              <p className="text-white font-semibold">
                {selectedWorker.distance
                  ? `${(selectedWorker.distance / 1000).toFixed(1)} km`
                  : "N/A"}
              </p>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="text-white/60 text-xs mb-1">ETA</p>
              <p className="text-white font-semibold">
                {selectedWorker.distance
                  ? `~${calculateETA(selectedWorker.distance)} min`
                  : "N/A"}
              </p>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="text-white/60 text-xs mb-1">Rating</p>
              <p className="text-white font-semibold">
                {selectedWorker.rating.toFixed(1)} ★
              </p>
            </div>
            <div className="glass-card rounded-lg p-3">
              <p className="text-white/60 text-xs mb-1">Status</p>
              <p className="text-green-400 font-semibold">Available</p>
            </div>
          </div>

          <button className="w-full glass-button rounded-xl py-3 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all font-medium">
            Request This Worker
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkerMap;
