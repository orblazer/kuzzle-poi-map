import { KDocumentContentGeneric } from "kuzzle-sdk";
import { LatLngTuple } from "leaflet";

declare interface KMarker {
  _id: string;
  name: string;
  position: LatLngTuple;
  state: "new" | "visited";
}
declare type KMarkerDocument = KDocumentContentGeneric & Marker;
