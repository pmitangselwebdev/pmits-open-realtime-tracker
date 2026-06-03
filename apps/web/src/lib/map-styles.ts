import type { StyleSpecification } from "maplibre-gl"

export interface MapStyle {
  id: string
  name: string
  type: "vector" | "raster"
  style: string | StyleSpecification
  preview?: string
}

function rasterStyle(
  id: string,
  name: string,
  tiles: string[],
  attribution: string,
): MapStyle {
  return {
    id,
    name,
    type: "raster",
    style: {
      version: 8,
      sources: {
        [id]: { type: "raster", tiles, tileSize: 256, attribution },
      },
      layers: [{ id: `${id}-layer`, type: "raster", source: id }],
    },
  }
}

export const mapStyles: MapStyle[] = [
  rasterStyle("street", "Street", [
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  ], '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'),
  rasterStyle("dark", "Dark", [
    "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  ], '&copy; <a href="https://carto.com/">CARTO</a>'),
  rasterStyle("light", "Light", [
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  ], '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'),
  rasterStyle("topo", "Topo", [
    "https://tile.opentopomap.org/{z}/{x}/{y}.png",
  ], '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'),
  {
    id: "satellite",
    name: "Satellite",
    type: "raster",
    style: {
      version: 8,
      sources: {
        "satellite-tiles": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.esri.com/">Esri</a>',
        },
      },
      layers: [
        {
          id: "satellite-layer",
          type: "raster",
          source: "satellite-tiles",
        },
      ],
    },
  },
]

export function getMapStyle(id: string): MapStyle {
  return mapStyles.find((s) => s.id === id) ?? mapStyles[0]
}
