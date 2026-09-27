# Architecture & Flow Diagrams

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Worker Dashboard                           │
└────────────────────────────────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
           ┌────────▼─────────┐        ┌────────▼─────────┐
           │  Job Card View   │        │  Active Job View │
           │ (Assigned Jobs)  │        │  (ON_THE_WAY)    │
           └────────┬─────────┘        └────────┬─────────┘
                    │                           │
        ┌───────────▼───────────┐   ┌───────────▼───────────┐
        │ JobProgressBar        │   │ NavigationMap         │
        │ Component             │   │ Component             │
        │ ─────────────────────│   │ ─────────────────────│
        │ • Status display     │   │ • Interactive map    │
        │ • 6-stage progress   │   │ • Route visualization│
        │ • Color indicators   │   │ • ETA display        │
        │ • Stage icons        │   │ • Distance/Duration  │
        └───────────┬──────────┘   └───────────┬──────────┘
                    │                          │
                    └──────────────┬───────────┘
                                   │
                         ┌─────────▼──────────┐
                         │  Route Service     │
                         │ ─────────────────│
                         │ • Route calc      │
                         │ • ETA computation │
                         │ • Distance format │
                         └─────────┬────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │                             │
        ┌───────────▼────────────┐   ┌───────────▼────────────┐
        │ OSRM API               │   │ OpenStreetMap Tiles    │
        │ ─────────────────────│   │ ─────────────────────│
        │ • Shortest routes    │   │ • Map rendering      │
        │ • Distance/Duration  │   │ • Tile layers        │
        │ • Multiple options   │   │ • Zoom/Pan support   │
        └──────────────────────┘   └──────────────────────┘
```

---

## Component Hierarchy

```
WorkerDashboard
├── JobProgressBar (for each job)
│   ├── Stage 1: Requested
│   ├── Stage 2: Assigned
│   ├── Stage 3: Confirmed
│   ├── Stage 4: En Route
│   ├── Stage 5: Working
│   └── Stage 6: Completed
│
└── ON_THE_WAY Phase
    ├── Info Alert
    ├── NavigationMap
    │   ├── Map Container (Leaflet)
    │   ├── Route Summary Card
    │   │   ├── Distance
    │   │   ├── Duration
    │   │   └── ETA
    │   ├── Status Message
    │   └── Action Buttons
    │       ├── View in Google Maps
    │       └── Start Navigation
    └── OTP Button
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Worker Location Data                  │
│          (profile.location.coordinates)                 │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │ NavigationMap        │
            │ Component            │
            └──────────────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Customer Location│ │ Route Service    │ │ Leaflet Map      │
│ (job.location)  │ │ Integration      │ │ Initialization   │
└──────────────────┘ └────────┬─────────┘ └──────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  OSRM API Call    │
                    │ GET /route/v1/... │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────▼────────────────────┐
        │         Route Calculation Result        │
        │ ─────────────────────────────────────── │
        │ • Geometry (GeoJSON)                    │
        │ • Distance (meters)                     │
        │ • Duration (seconds)                    │
        │ • Steps (turn-by-turn)                  │
        └─────────────────────┬────────────────────┘
                              │
        ┌─────────────────────┼────────────────────┐
        │                     │                    │
        ▼                     ▼                    ▼
    ┌──────────┐        ┌──────────┐       ┌───────────┐
    │ Polyline │        │Markers   │       │ETA Calc   │
    │ Drawing  │        │Placement │       │Formation  │
    │          │        │          │       │           │
    └──────────┘        └──────────┘       └────┬──────┘
        │                   │                    │
        └───────────────────┼────────────────────┘
                            │
                    ┌───────▼───────┐
                    │Display Update │
                    │ • Map render  │
                    │ • ETA display │
                    │ • Info card   │
                    └───────────────┘
```

---

## Job Status State Machine

```
                    ┌─────────────┐
                    │  PENDING    │
                    │  Requested  │
                    └──────┬──────┘
                           │ Worker assigned by system
                           ▼
                    ┌─────────────┐
                    │  ASSIGNED   │ ◄─────────┐
                    │  Job Offer  │           │ Reject
                    └──────┬──────┘           │
                           │ Accept           │
                           ▼                  │
                    ┌─────────────┐           │
                    │  CONFIRMED  │           │
                    │  Confirmed  │           │
                    └──────┬──────┘───────────┘
                           │ Tap "Start Journey"
                           ▼
                    ┌─────────────┐
                    │ ON_THE_WAY  │ ◄─ NavigationMap appears here
                    │  En Route   │
                    └──────┬──────┘
                           │ OTP verified at site
                           ▼
                    ┌─────────────┐
                    │IN_PROGRESS  │
                    │  Working    │
                    └──────┬──────┘
                           │ Work complete
                           ▼
                    ┌─────────────┐
                    │ COMPLETED   │
                    │  Settled    │
                    └─────────────┘
                    
    ┌──────────────────────────────┐
    │ Progress Bar Updates Each     │
    │ Transition Showing Journey    │
    └──────────────────────────────┘
```

---

## Route Calculation Flow

```
┌──────────────────────────────────────────────────────┐
│ routeService.getRoute(origin, destination)          │
└────────────┬─────────────────────────────────────────┘
             │
    ┌────────▼──────────┐
    │ Validate Coords   │
    │ [lng, lat] format │
    └────────┬──────────┘
             │ Valid?
      ┌──────┴──────┐
      │Yes          │No
      ▼             ▼
  ┌────────┐   ┌──────────────┐
  │Continue│   │Return Error  │
  └────┬───┘   └──────────────┘
       │
    ┌──▼──────────────────────────┐
    │ Build OSRM Request URL       │
    │ {BASE_URL}/{coordinates}    │
    │ ?overview=full              │
    │ &geometries=geojson         │
    │ &steps=true                 │
    └──┬──────────────────────────┘
       │
    ┌──▼────────────────────────────┐
    │ Fetch from OSRM API            │
    │ https://router.project-osrm... │
    └──┬────────────────────────────┘
       │
    ┌──▼──────────────────────┐
    │ Parse Response          │
    │ Extract:                │
    │ • Geometry              │
    │ • Distance              │
    │ • Duration              │
    │ • Steps                 │
    └──┬──────────────────────┘
       │
    ┌──▼─────────────────────────┐
    │ Format for Display         │
    │ • km (distance)            │
    │ • minutes (duration)       │
    │ • Calculate ETA            │
    │ • Ready for UI             │
    └──┬─────────────────────────┘
       │
    ┌──▼────────────────────────────┐
    │ Return Result Object           │
    │ {                              │
    │   success: true,               │
    │   distance: 2.5,               │
    │   duration: 12,                │
    │   geometry: { ... },           │
    │   eta: { ... }                 │
    │ }                              │
    └────────────────────────────────┘
```

---

## Component Lifecycle

### JobProgressBar

```
Mount
  │
  ├─ Accept status prop
  │
  ├─ Find current stage index
  │
  ├─ Calculate progress percentage
  │
  ├─ Render stages
  │     ├─ Completed (green, checkmark)
  │     ├─ Current (orange, scale up)
  │     └─ Upcoming (grey, disabled)
  │
  └─ Display status text

Update (status changed)
  │
  ├─ Recalculate stage index
  │
  ├─ Update progress percentage
  │
  └─ Animate transitions

Unmount
  └─ Clean up
```

### NavigationMap

```
Mount
  │
  ├─ Initialize Leaflet map
  │
  ├─ Set center & zoom
  │
  └─ Add OSM tiles

Update (coordinates changed)
  │
  ├─ Validate coordinates
  │
  ├─ Call routeService.getRoute()
  │
  ├─ Draw polyline on map
  │
  ├─ Add markers (worker, customer)
  │
  ├─ Fit map bounds
  │
  ├─ Calculate & display ETA
  │
  ├─ Show route summary card
  │
  └─ Call onRouteCalculated callback

Loading State
  │
  └─ Show spinner

Error State
  │
  └─ Show error message

Unmount
  │
  ├─ Remove map instance
  │
  ├─ Clean up event listeners
  │
  └─ Clean up references
```

---

## Performance Timeline

```
User clicks "Start Journey"
│
├─ 0ms: NavigationMap component renders
│
├─ 50ms: Leaflet library loads
│
├─ 100ms: Map initializes with OSM tiles
│
├─ 150ms: routeService.getRoute() called
│
├─ 500-1000ms: OSRM API responds with route
│           │
│           ├─ Geometry parsed
│           ├─ Distance calculated
│           ├─ Duration extracted
│           └─ ETA computed
│
├─ 1050-1100ms: Polyline drawn on map
│
├─ 1100-1150ms: Markers placed
│
├─ 1150-1200ms: Map bounds fitted to route
│
├─ 1200-1250ms: Route summary card rendered
│
└─ 2000-3000ms: Complete display ready
              (visible to user)

Total: ~2-3 seconds
```

---

## Error Handling Flow

```
                    ┌─────────────┐
                    │ API Call    │
                    │ Initiated   │
                    └──────┬──────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                      │
    ┌───▼────┐                          ┌────▼──────┐
    │Success │                          │  Error    │
    │(200)   │                          │(4xx/5xx)  │
    └───┬────┘                          └────┬──────┘
        │                                    │
        ▼                                    ▼
    ┌──────────────────┐          ┌─────────────────────┐
    │Parse Route Data  │          │Parse Error Message  │
    └────┬─────────────┘          └──────┬──────────────┘
         │                               │
    ┌────▼────────────────┐    ┌────────▼───────────────┐
    │Validate Data        │    │Show Error in UI        │
    │Check: distance,     │    │"No route found" etc    │
    │       duration,     │    └──────────────────────┘
    │       geometry      │
    └────┬───────────────┘
         │
    ┌────▼────────────────────┐
    │Valid?                  │
    │ ├─ Yes ─────────────┐  │
    │ │                   │  │
    │ │ ┌─────────────┐   │  │
    │ │ │ Format Data │   │  │
    │ │ └──────┬──────┘   │  │
    │ │        │          │  │
    │ │ ┌──────▼──────┐   │  │
    │ │ │ Render Map  │   │  │
    │ │ │ & Summary   │   │  │
    │ │ └─────────────┘   │  │
    │ │                   │  │
    │ └─ No ────┐        │  │
    │           │        │  │
    │    ┌──────▼─────┐  │  │
    │    │Show Error  │  │  │
    │    │Fallback    │  │  │
    │    └────────────┘  │  │
    └────────────────────┘
```

---

## API Integration Detail

### OSRM Request

```
GET https://router.project-osrm.org/route/v1/driving/
    72.8479,19.076;72.8500,19.080
    ?overview=full
    &geometries=geojson
    &steps=true

Request Headers:
  User-Agent: Sramshetu/1.0
  Accept: application/json

Response (simplified):
{
  "code": "Ok",
  "routes": [{
    "geometry": {
      "type": "LineString",
      "coordinates": [[72.8479, 19.076], [...]]
    },
    "distance": 2500,     // meters
    "duration": 720,      // seconds
    "legs": [{
      "steps": [...]
    }]
  }],
  "waypoints": [{...}, {...}]
}

Processing:
  distance: 2500 / 1000 = 2.5 km
  duration: 720 / 60 = 12 minutes
  ETA: Now + 12 minutes
```

---

## Browser Compatibility Matrix

```
┌─────────────┬─────────┬──────────┬────────────┐
│ Browser     │ Desktop │ Mobile   │ Supports   │
├─────────────┼─────────┼──────────┼────────────┤
│ Chrome      │ 90+     │ Latest   │ ✅ Full    │
│ Firefox     │ 88+     │ Latest   │ ✅ Full    │
│ Safari      │ 14+     │ 13+      │ ✅ Full    │
│ Edge        │ 90+     │ Latest   │ ✅ Full    │
│ Opera       │ 76+     │ Latest   │ ✅ Full    │
│ IE 11       │ ❌      │ ❌       │ ✅ Fallback│
└─────────────┴─────────┴──────────┴────────────┘
```

---

## Responsive Breakpoints

```
Mobile (<640px)
│
│  ┌──────────────────┐
│  │ Job Card         │
│  ├──────────────────┤
│  │ Progress Bar     │
│  │ (Compact View)   │
│  ├──────────────────┤
│  │ Map              │
│  │ (Full Width)     │
│  ├──────────────────┤
│  │ Info Cards       │
│  │ (Stacked)        │
│  ├──────────────────┤
│  │ Buttons          │
│  │ (Full Width)     │
│  └──────────────────┘
│
├─ Tablet (640-1024px)
│
│  ┌────────────────────────┐
│  │ Job Card               │
│  ├──────────────┬─────────┤
│  │ Progress Bar │ Buttons │
│  ├──────────────┴─────────┤
│  │ Map                    │
│  │ (Larger)               │
│  ├──────────┬────────┬────┤
│  │ Info 1   │ Info 2 │ETA │
│  └──────────┴────────┴────┘
│
└─ Desktop (>1024px)
  
   ┌──────────────────────────────┐
   │ Full Layout with All Features│
   │ ├─ Progress Bar (Full)       │
   │ ├─ Large Interactive Map     │
   │ ├─ Detailed Info Cards       │
   │ └─ All Action Buttons        │
   └──────────────────────────────┘
```

---

## State Management Summary

```
WorkerDashboard (Parent)
│
├─ Profile State
│  └─ Contains: location.coordinates
│
└─ Assigned Jobs State
   ├─ Job 1: status = "ASSIGNED"
   │  └─ JobProgressBar: Shows Stage 2
   │
   ├─ Job 2: status = "ON_THE_WAY"
   │  └─ NavigationMap: Shows interactive map + ETA
   │
   └─ Job 3: status = "COMPLETED"
      └─ JobProgressBar: Shows Stage 6 (Completed)

Routes (Calculated & Cached)
└─ { jobId → { distance, duration, eta, geometry } }
```

---

This provides a complete visual understanding of how all components work together!
