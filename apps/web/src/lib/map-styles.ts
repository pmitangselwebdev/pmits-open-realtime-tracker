import type { StyleSpecification } from "maplibre-gl"

export interface MapStyle {
  id: string
  name: string
  type: "vector" | "raster"
  style: string | StyleSpecification
  preview?: string
}

export const mapStyles: MapStyle[] = [
  {
    id: "street",
    name: "Street",
    type: "vector",
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  },
  {
    id: "dark",
    name: "Dark",
    type: "vector",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  },
  {
    id: "light",
    name: "Light",
    type: "vector",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  },
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
      glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    },
  },
  {
    id: "terrain",
    name: "Terrain",
    type: "raster",
    style: {
      version: 8,
      sources: {
        "terrain-tiles": {
          type: "raster",
          tiles: [
            "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        },
      },
      layers: [
        {
          id: "terrain-layer",
          type: "raster",
          source: "terrain-tiles",
        },
      ],
      glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
    },
  },
]

export function getMapStyle(id: string): MapStyle {
  return mapStyles.find((s) => s.id === id) ?? mapStyles[0]
}
